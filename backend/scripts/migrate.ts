// Applies supabase/migrations/*.sql to the database in DATABASE_URL, in filename order.
//
//   npm run db:migrate              apply pending migrations
//   npm run db:migrate -- --status  only list applied / pending
//
// Applied versions are recorded in supabase_migrations.schema_migrations, the same table the
// Supabase CLI uses, so `supabase db push` and this script agree. Each file runs in its own
// transaction. A migration that was already run by hand in the SQL Editor (so it isn't recorded)
// fails with "already exists"; it is then rolled back and recorded as applied, not run twice.
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const dir = join(import.meta.dirname, '..', '..', 'supabase', 'migrations');
const statusOnly = process.argv.includes('--status');
const ALREADY_EXISTS = new Set(['42P07', '42710', '42723', '42701', '42P16']);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to backend/.env (Supabase → Project Settings → Database → Connection string).');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key, statements text[], name text
      );`);
    const applied = new Set(
      (await client.query<{ version: string }>('select version from supabase_migrations.schema_migrations')).rows.map((r) => r.version)
    );
    const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();

    for (const file of files) {
      const [version, ...rest] = file.replace(/\.sql$/, '').split('_');
      const name = rest.join('_');
      if (applied.has(version)) {
        console.log(`  applied   ${file}`);
        continue;
      }
      if (statusOnly) {
        console.log(`  pending   ${file}`);
        continue;
      }
      const sql = readFileSync(join(dir, file), 'utf8');
      const record = () =>
        client.query('insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2, $3)', [version, [sql], name]);
      try {
        await client.query('begin');
        await client.query(sql);
        await record();
        await client.query('commit');
        console.log(`  APPLIED   ${file}`);
      } catch (err) {
        await client.query('rollback');
        const code = (err as { code?: string }).code;
        if (code && ALREADY_EXISTS.has(code)) {
          await record();
          console.log(`  recorded  ${file} (its objects already exist; it was applied earlier by hand)`);
        } else {
          console.error(`  FAILED    ${file}: ${(err as Error).message}`);
          process.exitCode = 1;
          return;
        }
      }
    }
    // Make PostgREST pick up new tables/columns immediately.
    if (!statusOnly) await client.query(`notify pgrst, 'reload schema'`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`Migration failed: ${(err as Error).message}`);
  process.exit(1);
});
