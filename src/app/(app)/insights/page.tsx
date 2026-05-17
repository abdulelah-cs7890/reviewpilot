import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale } from '@/lib/locale';
import { InsightsGenerator } from '@/components/insights/InsightsGenerator';
import { InsightsTabs } from '@/components/insights/InsightsTabs';
import { QualityDashboard } from '@/components/insights/QualityDashboard';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireUser();
  const locale = await getUiLocale();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const sp = await searchParams;
  const tab: 'policies' | 'quality' = sp.tab === 'quality' ? 'quality' : 'policies';

  const profile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, restaurant.id),
  });

  const customInstructionsLines = (profile?.customInstructions ?? '')
    .split('\n')
    .filter((line) => line.trim().startsWith('•'))
    .map((line) => line.replace(/^•\s*When\s*/, '').trim());

  const copy =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          title: 'AI insights',
          subPolicies:
            'The AI reads your reply history and extracts the implicit response policies you follow. Save the ones you want to lock in to your voice profile.',
          subQuality:
            "How well the AI is drafting against your reviews — grader scores aggregated across every draft, with the recurring issues it's missing.",
        }
      : {
          back: '← الرجوع للصندوق',
          title: 'تحليلات الذكاء الاصطناعي',
          subPolicies:
            'الذكاء الاصطناعي يقرأ سجل ردودك ويستخرج السياسات الضمنية اللي تتبعها. احفظ اللي تبيها في نغمة الردود.',
          subQuality:
            'كم المسودات اللي ينتجها الذكاء الاصطناعي قوية مقارنة بتقييماتك — الدرجات مجمّعة عبر كل المسودات مع المشاكل المتكررة اللي يضيّعها.',
        };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {copy.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">{copy.title}</h1>
      <p className="mb-6 text-sm text-ink-600">
        {tab === 'policies' ? copy.subPolicies : copy.subQuality}
      </p>

      <InsightsTabs current={tab} locale={locale} />

      {tab === 'policies' ? (
        <InsightsGenerator locale={locale} savedSignatures={customInstructionsLines} />
      ) : (
        <QualityDashboard restaurantId={restaurant.id} locale={locale} />
      )}
    </div>
  );
}
