import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default async function OnboardingPage() {
  const { user } = await requireUser();

  const existing = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (existing) {
    redirect('/inbox');
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        نبدأ بإعداد مطعمك
      </h1>
      <p className="mb-8 text-ink-600">
        خطوة واحدة فقط. هذه الإعدادات تحدد كيف يردّ ReviewPilot على تقييمات عملائك.
      </p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <OnboardingForm />
      </div>
    </div>
  );
}
