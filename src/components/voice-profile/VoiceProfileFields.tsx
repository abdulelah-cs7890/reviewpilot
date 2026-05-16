/**
 * The voice-profile portion of the form — just the fields, no <form> wrapper
 * and no submit button. Used by both onboarding (with extra restaurant-name
 * fields before it) and the settings page (alone).
 */

import type { VoiceProfile } from '@/db';

type Formality = 'warm' | 'formal' | 'casual';
type Dialect = 'gulf' | 'msa' | 'mixed';

export interface VoiceProfileDefaults {
  formality?: Formality;
  useReligiousPhrases?: boolean;
  arabicDialect?: Dialect;
  signoff?: string | null;
}

export function VoiceProfileFields({
  defaults,
  locale = 'ar',
}: {
  defaults?: VoiceProfileDefaults;
  locale?: 'ar' | 'en';
}) {
  const formality = defaults?.formality ?? 'warm';
  const dialect = defaults?.arabicDialect ?? 'gulf';
  const religious = defaults?.useReligiousPhrases ?? true;
  const signoff = defaults?.signoff ?? 'إدارة المطعم';

  const t =
    locale === 'en'
      ? {
          heading: 'Reply voice',
          formalityLabel: 'Reply tone',
          formality: { warm: 'Warm', formal: 'Formal', casual: 'Casual' },
          dialectLabel: 'Preferred Arabic dialect',
          dialect: { gulf: 'Gulf', msa: 'MSA', mixed: 'Mixed' },
          religious: 'Use religious phrases (الله يعطيك العافية, إن شاء الله...)',
          signoffLabel: 'Reply signoff (optional)',
        }
      : {
          heading: 'نغمة الردود',
          formalityLabel: 'طبيعة الردود',
          formality: { warm: 'ودودة', formal: 'رسمية', casual: 'عفوية' },
          dialectLabel: 'اللهجة العربية المفضلة',
          dialect: { gulf: 'خليجية', msa: 'فصحى', mixed: 'مختلطة' },
          religious: 'استخدام عبارات دينية (الله يعطيك العافية، إن شاء الله...)',
          signoffLabel: 'توقيع الردود (اختياري)',
        };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-ink-900">{t.heading}</h2>

      <div>
        <span className="mb-2 block text-sm text-ink-700">{t.formalityLabel}</span>
        <div className="flex gap-2">
          {(['warm', 'formal', 'casual'] as const).map((v) => (
            <label
              key={v}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark"
            >
              <input
                type="radio"
                name="formality"
                value={v}
                defaultChecked={v === formality}
                className="sr-only"
              />
              {t.formality[v]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm text-ink-700">{t.dialectLabel}</span>
        <div className="flex gap-2">
          {(['gulf', 'msa', 'mixed'] as const).map((v) => (
            <label
              key={v}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark"
            >
              <input
                type="radio"
                name="arabicDialect"
                value={v}
                defaultChecked={v === dialect}
                className="sr-only"
              />
              {t.dialect[v]}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="useReligiousPhrases"
          defaultChecked={religious}
          className="h-4 w-4 rounded border-ink-300"
        />
        {t.religious}
      </label>

      <div>
        <label htmlFor="signoff" className="mb-1 block text-sm text-ink-700">
          {t.signoffLabel}
        </label>
        <input
          id="signoff"
          name="signoff"
          type="text"
          defaultValue={signoff ?? ''}
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
    </section>
  );
}

/** Helper for callers that have a full VoiceProfile row and want to feed defaults. */
export function defaultsFromRow(row: VoiceProfile): VoiceProfileDefaults {
  return {
    formality: row.formality,
    useReligiousPhrases: row.useReligiousPhrases,
    arabicDialect: row.arabicDialect,
    signoff: row.signoff,
  };
}
