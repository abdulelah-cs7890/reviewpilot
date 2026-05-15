/**
 * One-shot: drop the old `users` table + cascading FKs so the new BetterAuth
 * schema can be pushed cleanly without drizzle-kit's interactive rename prompt.
 * Safe because the old table was empty.
 *
 * Run with: npx tsx --env-file=.env.local scripts/drop-users-table.ts
 */

import { neon } from '@neondatabase/serverless';

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);

  console.log('Dropping old users table and its dependents...');
  // CASCADE drops the dependent restaurants/voice_profiles/reviews/drafts/daily_digests too.
  // All empty per earlier verification.
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  await sql`DROP TABLE IF EXISTS restaurants CASCADE`;
  await sql`DROP TABLE IF EXISTS voice_profiles CASCADE`;
  await sql`DROP TABLE IF EXISTS reviews CASCADE`;
  await sql`DROP TABLE IF EXISTS drafts CASCADE`;
  await sql`DROP TABLE IF EXISTS daily_digests CASCADE`;
  // Also clear drizzle's migration tracking so future db:generate starts fresh.
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  console.log('Done. waitlist preserved.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
