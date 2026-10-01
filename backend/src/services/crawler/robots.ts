// Minimal robots.txt support: Allow/Disallow rules for the matching user-agent group, longest match
// wins, "*" wildcards and "$" anchors. Enough to crawl politely; not a full RFC 9309 implementation.

interface Rule {
  allow: boolean;
  pattern: RegExp;
  length: number;
}

export interface Robots {
  isAllowed(path: string): boolean;
}

function toRegExp(path: string) {
  const anchored = path.endsWith('$');
  const body = (anchored ? path.slice(0, -1) : path)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** Parses robots.txt and picks the most specific group for `agentTokens` (falling back to "*"). */
export function parseRobots(text: string, agentTokens: string[]): Robots {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === 'allow' || field === 'disallow') && current) {
      lastWasAgent = false;
      if (field === 'disallow' && value === '') continue; // "Disallow:" allows everything
      current.rules.push({ allow: field === 'allow', pattern: toRegExp(value), length: value.length });
    } else {
      lastWasAgent = false;
    }
  }

  const tokens = agentTokens.map((t) => t.toLowerCase());
  const group =
    groups.find((g) => g.agents.some((a) => tokens.some((t) => a !== '*' && t.includes(a)))) ??
    groups.find((g) => g.agents.includes('*'));
  const rules = group?.rules ?? [];

  return {
    isAllowed(path: string) {
      let best: Rule | undefined;
      for (const rule of rules) {
        if (rule.pattern.test(path) && (!best || rule.length > best.length || (rule.length === best.length && rule.allow))) {
          best = rule;
        }
      }
      return best ? best.allow : true;
    },
  };
}

export const allowAll: Robots = { isAllowed: () => true };
