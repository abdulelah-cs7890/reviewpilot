'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { parseBulkInput, type BulkEntry, type BulkParseError } from '@/lib/bulk-parser';

type EntryStatus =
  | { phase: 'queued' }
  | { phase: 'analyzing' }
  | { phase: 'drafting'; text: string }
  | { phase: 'checking'; draftText: string }
  | { phase: 'done'; reviewId: string }
  | { phase: 'quota' }
  | { phase: 'error'; message: string };

const PLACEHOLDER_AR = `5 stars - فهد
والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية والخدمة سريعة.
---
1 star - محمد
تجربة سيئة جداً. الأكل وصل بارد والكاشير ما رد.
---
3 - (مجهول)
الأكل عادي، لا أنصح بشدة ولا أحذر.`;

const PLACEHOLDER_EN = `5 stars - Fahad
Best Kabsa in Riyadh, fast service.
---
2 stars - Ahmed
Cold food, no response from staff.
---
3 - (anonymous)
Average. Not bad, not great.`;

export function BulkPasteForm({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [entries, setEntries] = useState<BulkEntry[]>([]);
  const [errors, setErrors] = useState<BulkParseError[]>([]);
  const [statuses, setStatuses] = useState<EntryStatus[]>([]);
  const [processing, setProcessing] = useState(false);

  const t =
    locale === 'en'
      ? {
          heading: 'Bulk paste reviews',
          sub: 'One entry per block, separated by --- on its own line. Format: "N stars - author" header, then review text.',
          placeholder: PLACEHOLDER_EN,
          parseBtn: 'Parse',
          submitBtn: (n: number) => `Process ${n} reviews`,
          processing: 'Processing...',
          parsed: (n: number) => `${n} entries ready`,
          errorsHeading: 'Errors',
          phaseQueued: 'queued',
          phaseAnalyzing: 'analyzing...',
          phaseDrafting: 'drafting...',
          phaseChecking: 'grading...',
          phaseDone: '✓ done',
          phaseQuota: 'quota exhausted',
          phaseError: 'error',
          allDone: 'All done — view in inbox',
          quotaHit: 'Daily Gemini quota exhausted. The remaining entries are queued for tomorrow.',
        }
      : {
          heading: 'إضافة دفعة من التقييمات',
          sub: 'كل تقييم في كتلة منفصلة، يفصل بينها --- في سطر مستقل. الصيغة: عنوان "N stars - الاسم" ثم نص التقييم.',
          placeholder: PLACEHOLDER_AR,
          parseBtn: 'تحليل النص',
          submitBtn: (n: number) => `معالجة ${n} تقييم`,
          processing: 'جارٍ المعالجة...',
          parsed: (n: number) => `${n} تقييم جاهز`,
          errorsHeading: 'أخطاء',
          phaseQueued: 'بالانتظار',
          phaseAnalyzing: 'تحليل...',
          phaseDrafting: 'كتابة المسودة...',
          phaseChecking: 'تقييم الجودة...',
          phaseDone: '✓ تم',
          phaseQuota: 'الحصة انتهت',
          phaseError: 'خطأ',
          allDone: 'انتهى — افتح الصندوق',
          quotaHit: 'الحصة اليومية لـ Gemini انتهت. التقييمات المتبقية محفوظة لليوم القادم.',
        };

  function onParse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = parseBulkInput(text);
    setEntries(result.entries);
    setErrors(result.errors);
    setStatuses(result.entries.map(() => ({ phase: 'queued' })));
  }

  async function processOne(entry: BulkEntry, idx: number): Promise<'ok' | 'quota' | 'error'> {
    const update = (s: EntryStatus) =>
      setStatuses((prev) => {
        const next = [...prev];
        next[idx] = s;
        return next;
      });

    update({ phase: 'analyzing' });

    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: entry.rating,
        authorName: entry.authorName ?? undefined,
        reviewText: entry.reviewText,
      }),
    });
    if (!res.ok || !res.body) {
      update({ phase: 'error', message: `HTTP ${res.status}` });
      return 'error';
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let savedDraftId = '';
    let reviewId = '';
    let outcome: 'ok' | 'quota' | 'error' = 'error';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const eventLine = block.split('\n').find((l) => l.startsWith('event: '));
        const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.slice('event: '.length);
        const payload = JSON.parse(dataLine.slice('data: '.length));
        if (eventType === 'analysis') {
          update({ phase: 'drafting', text: '' });
        } else if (eventType === 'chunk') {
          accumulated += (payload as { text: string }).text;
          update({ phase: 'drafting', text: accumulated });
        } else if (eventType === 'draft') {
          savedDraftId = (payload as { id: string }).id;
          update({ phase: 'checking', draftText: accumulated });
        } else if (eventType === 'quality') {
          // no-op for bulk progress UI — we only need to know it's done
        } else if (eventType === 'done') {
          reviewId = (payload as { reviewId: string }).reviewId;
          update({ phase: 'done', reviewId });
          outcome = 'ok';
        } else if (eventType === 'error') {
          const err = payload as { reason: 'quota' | 'error' };
          if (err.reason === 'quota') {
            update({ phase: 'quota' });
            outcome = 'quota';
          } else {
            update({ phase: 'error', message: t.phaseError });
            outcome = 'error';
          }
        }
      }
    }
    void savedDraftId;
    void reviewId;
    return outcome;
  }

  async function onProcessAll() {
    setProcessing(true);
    for (let i = 0; i < entries.length; i++) {
      const status = statuses[i];
      if (status?.phase === 'done') continue;
      const result = await processOne(entries[i], i);
      if (result === 'quota') {
        toast.warning(t.quotaHit);
        // Mark remaining as quota
        setStatuses((prev) =>
          prev.map((s, idx) => (idx > i && s.phase === 'queued' ? { phase: 'quota' } : s))
        );
        break;
      }
    }
    setProcessing(false);
  }

  const allDone =
    statuses.length > 0 && statuses.every((s) => s.phase === 'done' || s.phase === 'quota');

  return (
    <div className="space-y-6">
      <form onSubmit={onParse} className="space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-medium text-ink-900">{t.heading}</h2>
          <p className="mb-3 text-xs text-ink-500">{t.sub}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={processing}
            rows={14}
            placeholder={t.placeholder}
            dir={locale === 'en' ? 'ltr' : 'rtl'}
            className="w-full resize-y rounded-xl border border-ink-200 bg-white p-4 font-mono text-sm text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={processing || !text.trim()}
            className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            {t.parseBtn}
          </button>
          {entries.length > 0 && (
            <button
              type="button"
              disabled={processing}
              onClick={onProcessAll}
              className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
            >
              {processing ? t.processing : t.submitBtn(entries.length)}
            </button>
          )}
        </div>
      </form>

      {errors.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-900">{t.errorsHeading} ({errors.length})</p>
          <ul className="space-y-1 text-xs text-amber-800">
            {errors.map((er, i) => (
              <li key={i}>
                #{er.blockIndex + 1}: {er.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entries.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm text-ink-600">{t.parsed(entries.length)}</p>
          <ul className="space-y-2">
            {entries.map((e, i) => {
              const s = statuses[i] ?? { phase: 'queued' };
              return (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs text-ink-500">
                      #{i + 1} · {'★'.repeat(e.rating)}
                      {e.authorName ? ` · ${e.authorName}` : ''}
                    </div>
                    <p
                      dir={locale === 'en' ? 'ltr' : 'rtl'}
                      className="line-clamp-2 text-sm text-ink-800"
                    >
                      {s.phase === 'drafting' && s.text
                        ? s.text
                        : e.reviewText}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs">
                    {s.phase === 'queued' && (
                      <span className="text-ink-500">{t.phaseQueued}</span>
                    )}
                    {(s.phase === 'analyzing' || s.phase === 'drafting' || s.phase === 'checking') && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-accent-dark" />
                        <span className="text-accent-dark">
                          {s.phase === 'analyzing'
                            ? t.phaseAnalyzing
                            : s.phase === 'drafting'
                              ? t.phaseDrafting
                              : t.phaseChecking}
                        </span>
                      </>
                    )}
                    {s.phase === 'done' && (
                      <>
                        <Check className="h-3 w-3 text-emerald-700" />
                        <span className="text-emerald-700">{t.phaseDone}</span>
                      </>
                    )}
                    {s.phase === 'quota' && (
                      <>
                        <Sparkles className="h-3 w-3 text-amber-700" />
                        <span className="text-amber-700">{t.phaseQuota}</span>
                      </>
                    )}
                    {s.phase === 'error' && (
                      <>
                        <X className="h-3 w-3 text-red-700" />
                        <span className="text-red-700">{t.phaseError}</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {allDone && (
            <button
              type="button"
              onClick={() => router.push('/inbox')}
              className="mt-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-emerald-50 hover:bg-emerald-800"
            >
              {t.allDone}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
