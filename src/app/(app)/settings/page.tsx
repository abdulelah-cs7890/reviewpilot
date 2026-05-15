import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { defaultsFromRow } from '@/components/voice-profile/VoiceProfileFields';

export default async function SettingsPage() {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const profile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, restaurant.id),
  });
  if (!profile) redirect('/onboarding');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        ← الرجوع للصندوق
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">إعدادات نغمة الردود</h1>
      <p className="mb-6 text-sm text-ink-600">
        التغييرات تنطبق على الردود الجديدة فقط. المسودات الموجودة تبقى كما هي.
      </p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <SettingsForm defaults={defaultsFromRow(profile)} />
      </div>
    </div>
  );
}
