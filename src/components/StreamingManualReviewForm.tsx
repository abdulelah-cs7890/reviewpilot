'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ReviewAnalysis } from '@/ai/analyzer';

interface Labels {
  rating: string;
  authorLabel: string;
  authorPlaceholder: string;
  textLabel: string;
  textPlaceholder: string;
  submit: string;
  analyzing: string;
  drafting: string;
  checking: string;
  analysisHeading: string;
  draftHeading: string;
  qualityHeading: string;
  quotaToast: string;
  errorToast: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    rating: 'التقييم *',
    authorLabel: 'اسم العميل (اختياري)',
    authorPlaceholder: 'مثلاً: فهد',
    textLabel: 'نص التقييم *',
    textPlaceholder: 'انسخ نص التقييم هنا...',
    submit: 'حلّل وأنشئ مسودة',
    analyzing: 'جارٍ التحليل...',
    drafting: 'يكتب الذكاء الاصطناعي الرد...',
    checking: 'جارٍ تقييم الجودة...',
    analysisHeading: 'تحليل التقييم',
    draftHeading: 'مسودة الرد',
    qualityHeading: 'جودة الرد',
    quotaToast: 'الحصة اليومية انتهت',
    errorToast: 'حدث خطأ، حاول مرة ثانية',
  },
  en: {
    rating: 'Rating *',
    authorLabel: 'Customer name (optional)',
    authorPlaceholder: 'e.g. Fahad',
    textLabel: 'Review text *',
    textPlaceholder: 'Paste the review text here…',
    submit: 'Analyze + draft',
    analyzing: 'Analyzing…',
    drafting: 'AI is writing the reply…',
    checking: 'Grading quality…',
    analysisHeading: 'Review analysis',
    draftHeading: 'Reply draft',
    qualityHeading: 'Quality',
    quotaToast: 'Daily quota exhausted',
    errorToast: 'Something went wrong, try again',
  },
};

type Phase = 'idle' | 'analyzing' | 'drafting' | 'checking' | 'done' | 'error';

interface QualityResult {
  checks: Array<{ issue: string; addressed: boolean; note?: string }>;
  overallScore: number;
  language: 'ar' | 'en';
}

export function StreamingManualReviewForm({
  locale = 'ar',
  editsCount = 0,
}: {
  locale?: 'ar' | 'en';
  editsCount?: number;
}) {
  const router = useRouter();
  const t = LABELS[locale];
  const [phase, setPhase] = useState<Phase>('idle');
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [draftText, setDraftText] = useState('');
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      rating: Number(fd.get('rating')),
      authorName: (fd.get('authorName') as string) || undefined,
      reviewText: fd.get('reviewText') as string,
    };

    setPhase('analyzing');
    setAnalysis(null);
    setDraftText('');
    setQuality(null);

    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      setPhase('error');
      toast.error(t.errorToast);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const eventLine = block.split('\n').find((l) => l.startsWith('event: '));
        const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.slice('event: '.length);
        const payload = JSON.parse(dataLine.slice('data: '.length));

        if (eventType === 'analysis') {
          setAnalysis(payload as ReviewAnalysis);
          setPhase('drafting');
        } else if (eventType === 'chunk') {
          setDraftText((prev) => prev + (payload as { text: string }).text);
        } else if (eventType === 'draft') {
          setPhase('checking');
        } else if (eventType === 'quality') {
          setQuality(payload as QualityResult);
        } else if (eventType === 'done') {
          setPhase('done');
          router.push(`/inbox/${(payload as { reviewId: string }).reviewId}`);
        } else if (eventType === 'error') {
          setPhase('error');
          const err = payload as { reason: 'quota' | 'error' };
          if (err.reason === 'quota') toast.warning(t.quotaToast);
          else toast.error(t.errorToast);
        }
      }
    }
  }

  const pending = phase !== 'idle' && phase !== 'error';

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm text-ink-700">{t.rating}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-3 text-lg has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark"
              >
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  defaultChecked={n === 5}
                  className="sr-only"
                />
                {'★'.repeat(n)}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="authorName" className="mb-1 block text-sm text-ink-700">
            {t.authorLabel}
          </label>
          <input
            id="authorName"
            name="authorName"
            type="text"
            placeholder={t.authorPlaceholder}
            disabled={pending}
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="reviewText" className="mb-1 block text-sm text-ink-700">
            {t.textLabel}
          </label>
          <textarea
            id="reviewText"
            name="reviewText"
            required
            rows={6}
            disabled={pending}
            placeholder={t.textPlaceholder}
            className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
        >
          {phase === 'analyzing'
            ? t.analyzing
            : phase === 'drafting'
              ? t.drafting
              : phase === 'checking'
                ? t.checking
                : t.submit}
        </button>
        {editsCount > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <Sparkles className="h-3 w-3 text-accent-dark" />
            {locale === 'en'
              ? `Learning from ${editsCount} past edit${editsCount === 1 ? '' : 's'}`
              : `يتعلّم من ${editsCount} تعديل سابق`}
          </p>
        )}
      </form>

      {analysis && (
        <section className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">
            {t.analysisHeading}
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.topics.map((tp) => (
              <span key={tp} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                {tp}
              </span>
            ))}
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
              {analysis.language}
              {analysis.dialect ? ` · ${analysis.dialect}` : ''}
            </span>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
              {locale === 'en' ? 'sentiment' : 'مشاعر'}: {analysis.sentiment}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                analysis.urgency === 'high'
                  ? 'bg-red-50 text-red-700'
                  : analysis.urgency === 'medium'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-ink-100 text-ink-700'
              }`}
            >
              {analysis.urgency}
            </span>
          </div>
        </section>
      )}

      {(phase === 'drafting' || draftText) && (
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-dark" />
            <p className="text-xs uppercase tracking-wider text-accent-dark">
              {t.draftHeading}
            </p>
          </div>
          <p
            dir={analysis?.language === 'en' ? 'ltr' : 'rtl'}
            className="whitespace-pre-wrap text-lg leading-relaxed text-ink-900"
          >
            {draftText}
            {phase === 'drafting' && (
              <span className="ms-1 inline-block h-5 w-2 animate-pulse bg-accent" />
            )}
          </p>
        </section>
      )}

      {quality && (
        <section className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">
            {t.qualityHeading}: {quality.overallScore}/100
          </p>
          {quality.checks.length > 0 && (
            <ul className="space-y-1 text-sm text-ink-700">
              {quality.checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={
                      c.addressed
                        ? 'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700'
                        : 'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-700'
                    }
                    aria-hidden="true"
                  >
                    {c.addressed ? '✓' : '✗'}
                  </span>
                  <span>{c.issue}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
