// HTTP client for crawling user-supplied websites without exposing the server's own network (SSRF).
// Every connection's DNS answer is checked against private/reserved ranges *at connect time*, so a
// hostname can't pass a check and then resolve to 127.0.0.1 (DNS rebinding). Redirects are followed
// manually so every hop goes through the same checks.
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { Agent, fetch } from 'undici';
import { env } from '../../config/env.js';

const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['100::', 64], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6');
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  if (family === 4) return blocked.check(address, 'ipv4');
  // IPv4-mapped (::ffff:a.b.c.d) and NAT64 (64:ff9b::a.b.c.d) addresses: judge the embedded IPv4.
  const embedded = /^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (embedded) return blocked.check(embedded[1], 'ipv4');
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return blocked.check(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`, 'ipv4');
  }
  return blocked.check(address, 'ipv6');
}

export class BlockedHostError extends Error {
  constructor(host: string) {
    super(`Refusing to connect to ${host}: it resolves to a private or reserved address.`);
    this.name = 'BlockedHostError';
  }
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

function safeLookup(hostname: string, options: object, callback: LookupCallback) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '');
    const list = addresses as LookupAddress[];
    if (!env.AUDIT_ALLOW_PRIVATE_HOSTS && list.some((a) => isBlockedAddress(a.address))) {
      return callback(new BlockedHostError(hostname), '');
    }
    const wantsAll = (options as { all?: boolean }).all;
    if (wantsAll) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

const agent = new Agent({
  connect: { lookup: safeLookup as never, timeout: 10_000 },
  headersTimeout: 15_000,
  bodyTimeout: 15_000,
  connections: 8,
});

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  body: string | null;
  ms: number;
  redirects: string[];
  error?: string;
}

const MAX_REDIRECTS = 5;

/** GETs a URL with a byte cap and timeout. Never throws for HTTP/network problems: see `error`. */
export async function safeGet(
  url: string,
  opts: { userAgent: string; timeoutMs?: number; maxBytes?: number; wantBody?: (contentType: string) => boolean }
): Promise<FetchResult> {
  const started = performance.now();
  const redirects: string[] = [];
  let current = url;
  const maxBytes = opts.maxBytes ?? 3_000_000;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(current);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Only http(s) URLs can be crawled.');
      if (!env.AUDIT_ALLOW_PRIVATE_HOSTS && isIP(parsed.hostname.replace(/^\[|\]$/g, '')) && isBlockedAddress(parsed.hostname.replace(/^\[|\]$/g, ''))) {
        throw new BlockedHostError(parsed.hostname);
      }
      const res = await fetch(current, {
        dispatcher: agent,
        redirect: 'manual',
        headers: { 'user-agent': opts.userAgent, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel();
        redirects.push(current);
        current = new URL(location, current).toString();
        continue;
      }
      const contentType = res.headers.get('content-type') ?? '';
      let body: string | null = null;
      if (res.body && (opts.wantBody?.(contentType) ?? true)) {
        body = await readCapped(res.body as unknown as ReadableStream<Uint8Array>, maxBytes);
      } else {
        await res.body?.cancel();
      }
      return { url, finalUrl: current, status: res.status, contentType, body, ms: performance.now() - started, redirects };
    }
    return { url, finalUrl: current, status: 0, contentType: '', body: null, ms: performance.now() - started, redirects, error: 'Too many redirects' };
  } catch (err) {
    const message = err instanceof Error ? (err.cause instanceof Error ? err.cause.message : err.message) : String(err);
    return { url, finalUrl: current, status: 0, contentType: '', body: null, ms: performance.now() - started, redirects, error: message };
  }
}

async function readCapped(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
