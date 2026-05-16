import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Sparkles } from 'lucide-react';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale } from '@/lib/locale';
import { appCopy } from '@/lib/app-copy';
import { getOwnerEditExamples } from '@/ai/owner-edits';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { defaultsFromRow } from '@/components/voice-profile/VoiceProfileFields';
import { ProfileTunerPanel } from '@/components/settings/ProfileTunerPanel';

export default async function SettingsPage() {
  const { user } = await requireUser();
  const locale = await getUiLocale();
  const t = appCopy[locale].settings;
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const profile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, restaurant.id),
  });
  if (!profile) redirect('/onboarding');

  const edits = await getOwnerEditExamples(restaurant.id);
  const editsLabel =
    locale === 'en'
      ? {
          heading:
            edits.length === 0
              ? 'AI not yet learning from edits'
              : `AI is learning from ${edits.length} past edit${edits.length === 1 ? '' : 's'}`,
          sub:
            edits.length === 0
              ? 'When you edit an AI draft and save, future drafts will pick up your style.'
              : 'These edits are appended as few-shot examples to the next drafter call. Most recent first.',
          original: 'AI original',
          owner: 'Your edit',
        }
      : {
          heading:
            edits.length === 0
              ? 'الذكاء الاصطناعي لم يبدأ التعلم بعد'
              : `الذكاء الاصطناعي يتعلّم من ${edits.length} تعديل سابق`,
          sub:
            edits.length === 0
              ? 'لما تعدّل مسودة الذكاء الاصطناعي وتحفظها، المسودات القادمة تأخذ بأسلوبك.'
              : 'هذه التعديلات تُضاف كأمثلة في تعليمات الذكاء الاصطناعي للمسودات القادمة. الأحدث أولاً.',
          original: 'مسودة الذكاء',
          owner: 'تعديلك',
        };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {t.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
      <p className="mb-6 text-sm text-ink-600">{t.sub}</p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <SettingsForm defaults={defaultsFromRow(profile)} locale={locale} />
      </div>

      {/* Auto-tune voice profile panel */}
      <ProfileTunerPanel locale={locale} />

      {/* Learn-from-edits panel */}
      <div className="mt-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{editsLabel.heading}</h2>
        </div>
        <p className="mb-4 text-sm text-ink-600">{editsLabel.sub}</p>
        {edits.length > 0 && (
          <ul className="space-y-3">
            {edits.slice(0, 3).map((e, i) => (
              <li key={i} className="rounded-xl border border-ink-100 bg-ink-50/40 p-3 text-sm">
                <div className="mb-1 text-xs uppercase tracking-wider text-ink-400">
                  {editsLabel.original}
                </div>
                <p className="mb-2 text-ink-500 line-through">{e.originalDraft}</p>
                <div className="mb-1 text-xs uppercase tracking-wider text-emerald-700">
                  {editsLabel.owner}
                </div>
                <p className="text-ink-800">{e.ownerEdit}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
