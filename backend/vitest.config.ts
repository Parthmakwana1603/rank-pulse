import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // The live integration test imports the frontend's response mappers (../src/lib/api/mappers.ts).
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 20_000,
    // Placeholder Supabase settings so the app can load; unit tests never contact Supabase.
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key-000000000000000000',
      CORS_ORIGINS: 'http://localhost:5173',
    },
  },
});
