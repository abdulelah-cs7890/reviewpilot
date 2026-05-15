import { loadEnvFile } from 'node:process';
import type { Config } from 'drizzle-kit';

// drizzle-kit doesn't auto-load .env.local. Pull it in explicitly so
// `npm run db:generate` / `db:migrate` work without external dotenv-cli.
try {
  loadEnvFile('.env.local');
} catch {
  // .env.local is optional in CI / Vercel where env vars come from the platform
}

// Prefer the direct (unpooled) URL for migrations — the Neon pooler can drop
// long statements mid-flight. App runtime still uses the pooled URL.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error('DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: migrationUrl },
} satisfies Config;
