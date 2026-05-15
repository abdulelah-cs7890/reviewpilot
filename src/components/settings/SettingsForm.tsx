'use client';

import { useActionState } from 'react';
import { updateVoiceProfile, type SettingsState } from '@/app/(app)/settings/actions';
import { VoiceProfileFields, type VoiceProfileDefaults } from '@/components/voice-profile/VoiceProfileFields';

const initial: SettingsState = { status: 'idle' };

export function SettingsForm({ defaults }: { defaults: VoiceProfileDefaults }) {
  const [state, action, pending] = useActionState(updateVoiceProfile, initial);

  return (
    <form action={action} className="space-y-6">
      <VoiceProfileFields defaults={defaults} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </button>
        {state.status === 'saved' && (
          <span className="text-sm text-emerald-700">✓ تم الحفظ</span>
        )}
        {state.status === 'error' && (
          <span className="text-sm text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  );
}
