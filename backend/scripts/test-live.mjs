// Runs the live Supabase integration tests (see test/integration.supabase.test.ts).
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['vitest', 'run', 'test/integration.supabase.test.ts', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, LIVE_SUPABASE_TESTS: 'true' },
});
process.exit(result.status ?? 1);
