import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  /** Comma-separated list of origins allowed to call the API with credentials. */
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  /** Requests per 15 minutes per client for the whole API. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
  /** Lets the site-audit crawler reach private/loopback addresses. Only for local testing. */
  AUDIT_ALLOW_PRIVATE_HOSTS: bool,
  /** Express "trust proxy" setting, needed behind a load balancer for correct client IPs. */
  TRUST_PROXY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid backend environment (see backend/.env.example):\n${problems}`);
  }
  return parsed.data;
}

export const env = load();

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
