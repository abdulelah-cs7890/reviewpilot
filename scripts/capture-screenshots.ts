/**
 * Capture README-ready screenshots via Playwright + Chromium.
 *
 * Drives a headless browser, sets the demo session cookie (same HMAC scheme
 * as src/lib/auth-utils.ts), navigates to each key page, takes a viewport
 * screenshot, writes to public/screenshots/.
 *
 * Run with: npm run screenshots (requires npm run dev on port 3001).
 */

import { chromium, type Page } from 'playwright';
import { createHmac } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db, reviews, restaurants } from '../src/db';
import { DEMO_USER_EMAIL } from '../src/lib/auth-utils';
import { user as userTable } from '../src/db/schema';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const SECRET = process.env.BETTER_AUTH_SECRET;
const DEMO_USER_ID = 'demo_user_001';
const OUT = 'public/screenshots';

if (!SECRET) {
  console.error('BETTER_AUTH_SECRET not set — load .env.local first');
  process.exit(1);
}

const cookieValue = `${DEMO_USER_ID}.${createHmac('sha256', SECRET)
  .update(DEMO_USER_ID)
  .digest('base64url')}`;

async function pickUrgentReviewId(): Promise<string> {
  // Pick the urgent-hygiene seed review for the detail screenshot — it's the
  // most visually loaded (multiple checklist items in quality check).
  const demoUser = await db.query.user.findFirst({
    where: eq(userTable.email, DEMO_USER_EMAIL),
  });
  if (!demoUser) throw new Error('Demo user not found — run npm run db:seed first');
  const demoRestaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, demoUser.id),
  });
  if (!demoRestaurant) throw new Error('Demo restaurant not found');
  const row = await db.query.reviews.findFirst({
    where: eq(reviews.externalId, 'seed_urgent-hygiene'),
  });
  if (!row) throw new Error('seed_urgent-hygiene not found — run npm run db:seed');
  return row.id;
}

async function captureFullPage(page: Page, name: string) {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: true,
    type: 'png',
  });
  console.log(`✓ ${name}.png`);
}

async function captureViewport(page: Page, name: string) {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: false,
    type: 'png',
  });
  console.log(`✓ ${name}.png`);
}

async function main() {
  const detailId = await pickUrgentReviewId();
  console.log('Detail review id:', detailId);

  const browser = await chromium.launch();

  // Desktop context with demo cookie set
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2, // retina-quality output
    locale: 'ar-SA',
  });
  await desktop.addCookies([
    {
      name: 'reviewpilot_demo',
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Mobile context for the mobile screenshot
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    locale: 'ar-SA',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  await mobile.addCookies([
    {
      name: 'reviewpilot_demo',
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Helper: navigate, wait for network idle + fonts, capture
  async function shoot(context: typeof desktop, path: string, name: string, full = true) {
    const page = await context.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    // Give fonts a beat to render
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(500);
    if (full) await captureFullPage(page, name);
    else await captureViewport(page, name);
    await page.close();
  }

  await shoot(desktop, '/', 'landing', false);
  await shoot(desktop, '/inbox', 'inbox');
  await shoot(desktop, `/inbox/${detailId}`, 'detail');
  await shoot(desktop, '/dashboard', 'dashboard');
  await shoot(desktop, '/settings', 'settings');
  await shoot(mobile, '/inbox', 'mobile-inbox');

  await browser.close();
  console.log('\nAll screenshots in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
