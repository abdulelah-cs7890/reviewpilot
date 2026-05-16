import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale } from '@/lib/locale';
import { InsightsGenerator } from '@/components/insights/InsightsGenerator';

export default async function InsightsPage() {
  const { user } = await requireUser();
  const locale = await getUiLocale();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const profile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, restaurant.id),
  });

  // Pull existing customInstructions lines so the UI knows which policies are
  // already saved. Each saved policy starts with "When ..." per the action's
  // formatting; we slice the first 40 chars as a signature.
  const customInstructionsLines = (profile?.customInstructions ?? '')
    .split('\n')
    .filter((line) => line.trim().startsWith('•'))
    .map((line) => line.replace(/^•\s*When\s*/, '').trim());

  const copy =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          title: 'AI insights',
          sub: 'The AI reads your reply history and extracts the implicit response policies you follow. Save the ones you want to lock in to your voice profile.',
        }
      : {
          back: '← الرجوع للصندوق',
          title: 'تحليلات الذكاء الاصطناعي',
          sub: 'الذكاء الاصطناعي يقرأ سجل ردودك ويستخرج السياسات الضمنية اللي تتبعها. احفظ اللي تبيها في نغمة الردود.',
        };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {copy.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        {copy.title}
      </h1>
      <p className="mb-6 text-sm text-ink-600">{copy.sub}</p>
      <InsightsGenerator locale={locale} savedSignatures={customInstructionsLines} />
    </div>
  );
}
