/**
 * One-shot end-to-end DB check: insert a row into waitlist, read it back, clean up.
 * Run with: npx tsx --env-file=.env.local scripts/verify-db.ts
 */

import { db, waitlist } from '../src/db';
import { eq } from 'drizzle-orm';

async function main() {
  const email = `verify+${Date.now()}@reviewpilot.local`;
  console.log(`Inserting ${email}...`);
  await db.insert(waitlist).values({ email, city: 'Riyadh', restaurantName: 'Verify Test' });

  const rows = await db.select().from(waitlist).where(eq(waitlist.email, email));
  console.log(`Read back ${rows.length} row(s):`, rows);

  await db.delete(waitlist).where(eq(waitlist.email, email));
  console.log('Cleaned up.');

  const total = await db.$count(waitlist);
  console.log(`Total waitlist rows now: ${total}`);
}

main().catch((err) => {
  console.error('verify-db failed:', err);
  process.exit(1);
});
