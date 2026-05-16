'use client';

import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { updateVoiceProfile, type SettingsState } from '@/app/(app)/settings/actions';
import { VoiceProfileFields, type VoiceProfileDefaults } from '@/components/voice-profile/VoiceProfileFields';

const initial: SettingsState = { status: 'idle' };

export function SettingsForm({
  defaults,
  locale = 'ar',
}: {
  defaults: VoiceProfileDefaults;
  locale?: 'ar' | 'en';
}) {
  const [state, action, pending] = useActionState(updateVoiceProfile, initial);
  const lastStatus = useRef(state.status);

  const labels =
    locale === 'en'
      ? { saved: 'Settings saved', save: 'Save changes', saving: 'Saving...' }
      : { saved: 'تم حفظ الإعدادات', save: 'حفظ التغييرات', saving: 'جارٍ الحفظ...' };

  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === 'saved') toast.success(labels.saved);
    if (state.status === 'error') toast.error(state.message);
  }, [state, labels.saved]);

  return (
    <form action={action} className="space-y-6">
      <VoiceProfileFields defaults={defaults} locale={locale} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? labels.saving : labels.save}
      </button>
    </form>
  );
}
