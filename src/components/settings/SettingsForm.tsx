'use client';

import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { updateVoiceProfile, type SettingsState } from '@/app/(app)/settings/actions';
import { VoiceProfileFields, type VoiceProfileDefaults } from '@/components/voice-profile/VoiceProfileFields';

const initial: SettingsState = { status: 'idle' };

export function SettingsForm({ defaults }: { defaults: VoiceProfileDefaults }) {
  const [state, action, pending] = useActionState(updateVoiceProfile, initial);
  const lastStatus = useRef(state.status);

  // Toast on terminal states (saved / error). Compares against last seen status
  // to avoid duplicate toasts on re-render.
  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === 'saved') toast.success('تم حفظ الإعدادات');
    if (state.status === 'error') toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <VoiceProfileFields defaults={defaults} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  );
}
