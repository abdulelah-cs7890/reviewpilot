'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, Check, X, Loader2, FileText, Download } from 'lucide-react';
import {
  parseImportCsv,
  type ParsedRow,
  type ImportError,
  type ParseResult,
  MAX_ROWS,
} from '@/lib/csv-import';

type RowStatus =
  | { phase: 'queued' }
  | { phase: 'analyzing' }
  | { phase: 'done'; reviewId: string }
  | { phase: 'failed'; reason?: string }
  | { phase: 'quota' };

interface Labels {
  heading: string;
  sub: string;
  fileLabel: string;
  fileBtn: string;
  parsed: (rows: number, errors: number) => string;
  detectedColumns: string;
  reviewTextCol: string;
  ratingCol: string;
  authorCol: string;
  dateCol: string;
  languageCol: string;
  notDetected: string;
  errorsHeading: string;
  importBtn: (n: number) => string;
  importing: string;
  progress: (done: number, total: number) => string;
  done: (analyzed: number, failed: number, total: number) => string;
  viewInbox: string;
  quotaToast: string;
  formatHeading: string;
  formatDesc: string;
  required: string;
  optional: string;
  sampleDownload: string;
  reset: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    heading: 'استيراد ملف CSV',
    sub: 'حمّل ملف تقييماتك من Google Takeout أو أي مصدر آخر. الأعمدة المطلوبة: نص التقييم + التقييم.',
    fileLabel: 'اختر ملف CSV',
    fileBtn: 'اختيار ملف',
    parsed: (rows, errors) =>
      errors > 0
        ? `${rows} صف جاهز · ${errors} خطأ`
        : `${rows} صف جاهز للاستيراد`,
    detectedColumns: 'الأعمدة المكتشفة',
    reviewTextCol: 'نص التقييم',
    ratingCol: 'التقييم',
    authorCol: 'اسم العميل',
    dateCol: 'التاريخ',
    languageCol: 'اللغة',
    notDetected: 'غير موجود',
    errorsHeading: 'أخطاء في الصفوف',
    importBtn: (n) => `استيراد ${n} تقييم`,
    importing: 'جارٍ الاستيراد...',
    progress: (done, total) => `جارٍ التحليل ${done}/${total}`,
    done: (a, f, t) =>
      `تم تحليل ${a} من ${t}${f > 0 ? ` · فشل ${f}` : ''}`,
    viewInbox: 'افتح الصندوق',
    quotaToast: 'الحصة اليومية لـ Gemini انتهت. الباقي محفوظ كـ"بالانتظار" — يمكنك إنشاء مسوداتها لاحقاً.',
    formatHeading: 'صيغة الملف',
    formatDesc: 'الأسماء الإنجليزية لأي عمود تعمل (case-insensitive).',
    required: 'مطلوب',
    optional: 'اختياري',
    sampleDownload: 'تحميل ملف نموذجي',
    reset: 'إعادة',
  },
  en: {
    heading: 'Import CSV',
    sub: 'Upload your reviews export from Google Takeout or any source. Required columns: review text + rating.',
    fileLabel: 'Choose a CSV file',
    fileBtn: 'Choose file',
    parsed: (rows, errors) =>
      errors > 0 ? `${rows} valid rows · ${errors} errors` : `${rows} rows ready to import`,
    detectedColumns: 'Detected columns',
    reviewTextCol: 'Review text',
    ratingCol: 'Rating',
    authorCol: 'Author',
    dateCol: 'Date',
    languageCol: 'Language',
    notDetected: 'not detected',
    errorsHeading: 'Row errors',
    importBtn: (n) => `Import ${n} reviews`,
    importing: 'Importing...',
    progress: (done, total) => `Analyzing ${done}/${total}`,
    done: (a, f, t) =>
      `Analyzed ${a} of ${t}${f > 0 ? ` · ${f} failed` : ''}`,
    viewInbox: 'Go to inbox',
    quotaToast:
      'Daily Gemini quota exhausted. The rest is saved as "pending" — you can generate drafts for them later.',
    formatHeading: 'File format',
    formatDesc: 'Any of these column names works (case-insensitive).',
    required: 'required',
    optional: 'optional',
    sampleDownload: 'Download sample CSV',
    reset: 'Reset',
  },
};

export function CsvImportForm({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const router = useRouter();
  const t = LABELS[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string>('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [statuses, setStatuses] = useState<RowStatus[]>([]);
  const [importing, setImporting] = useState(false);
  const [completed, setCompleted] = useState<{ analyzed: number; failed: number; total: number } | null>(
    null
  );

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setCompleted(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = parseImportCsv(text);
      setParsed(result);
      setStatuses(result.rows.map(() => ({ phase: 'queued' })));
    };
    reader.readAsText(file, 'utf-8');
  }

  function reset() {
    setFilename('');
    setParsed(null);
    setStatuses([]);
    setCompleted(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function onImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);

    const payload = parsed.rows.map((r: ParsedRow) => ({
      reviewText: r.reviewText,
      rating: r.rating,
      authorName: r.authorName,
      postedAt: r.postedAt?.toISOString(),
      language: r.language,
    }));

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: payload }),
    });
    if (!res.ok || !res.body) {
      toast.error(`HTTP ${res.status}`);
      setImporting(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
        const data = JSON.parse(dataLine.slice('data: '.length));
        if (eventType === 'progress') {
          const { index, reviewId, ok, reason } = data as {
            index: number;
            reviewId: string;
            ok: boolean;
            reason?: string;
          };
          setStatuses((prev) => {
            const next = [...prev];
            next[index] = ok ? { phase: 'done', reviewId } : { phase: 'failed', reason };
            // Mark next row as analyzing if it's still queued
            if (index + 1 < next.length && next[index + 1]?.phase === 'queued') {
              next[index + 1] = { phase: 'analyzing' };
            }
            return next;
          });
        } else if (eventType === 'done') {
          setCompleted(data as { analyzed: number; failed: number; total: number });
        } else if (eventType === 'error') {
          const err = data as { reason: string; message: string };
          if (err.reason === 'quota') {
            toast.warning(t.quotaToast);
            setStatuses((prev) =>
              prev.map((s) => (s.phase === 'queued' || s.phase === 'analyzing' ? { phase: 'quota' } : s))
            );
          } else {
            toast.error(err.message);
          }
        } else if (eventType === 'inserted') {
          // Kick off animation on row 0
          setStatuses((prev) => {
            const next = [...prev];
            if (next[0]?.phase === 'queued') next[0] = { phase: 'analyzing' };
            return next;
          });
        }
      }
    }
    setImporting(false);
  }

  const previewRows = parsed?.rows.slice(0, 10) ?? [];
  const remaining = parsed ? parsed.rows.length - previewRows.length : 0;

  return (
    <div className="space-y-6">
      {/* File picker */}
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-1 text-base font-medium text-ink-900">{t.heading}</h2>
        <p className="mb-4 text-sm text-ink-600">{t.sub}</p>

        {!parsed ? (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-700 hover:bg-ink-100">
              <Upload className="h-4 w-4" />
              <span>{t.fileBtn}</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
                className="sr-only"
              />
            </label>
            <p className="mt-2 text-xs text-ink-400">
              {locale === 'en' ? `Max ${MAX_ROWS} rows per upload.` : `حد أقصى ${MAX_ROWS} صف للملف الواحد.`}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-ink-500" />
              <span className="font-medium text-ink-900">{filename}</span>
              <span className="text-ink-500">
                · {t.parsed(parsed.rows.length, parsed.errors.length)}
              </span>
              <button
                type="button"
                onClick={reset}
                disabled={importing}
                className="ms-auto rounded-lg border border-ink-200 bg-white px-3 py-1 text-xs text-ink-600 hover:bg-ink-100 disabled:opacity-50"
              >
                {t.reset}
              </button>
            </div>

            {/* Detected columns */}
            <div className="rounded-2xl border border-ink-100 bg-ink-50/40 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                {t.detectedColumns}
              </p>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <DetectedCol label={t.reviewTextCol} value={parsed.detectedColumns.reviewText} notDetected={t.notDetected} required />
                <DetectedCol label={t.ratingCol} value={parsed.detectedColumns.rating} notDetected={t.notDetected} required />
                <DetectedCol label={t.authorCol} value={parsed.detectedColumns.authorName} notDetected={t.notDetected} />
                <DetectedCol label={t.dateCol} value={parsed.detectedColumns.postedAt} notDetected={t.notDetected} />
                <DetectedCol label={t.languageCol} value={parsed.detectedColumns.language} notDetected={t.notDetected} />
              </dl>
            </div>

            {parsed.errors.length > 0 && (
              <ErrorList errors={parsed.errors} heading={t.errorsHeading} />
            )}

            {parsed.rows.length > 0 && (
              <>
                <RowPreview
                  rows={previewRows}
                  statuses={statuses}
                  remaining={remaining}
                  locale={locale}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onImport}
                    disabled={importing || !!completed}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {(() => {
                          const doneCount = statuses.filter(
                            (s) => s.phase === 'done' || s.phase === 'failed'
                          ).length;
                          return t.progress(doneCount, parsed.rows.length);
                        })()}
                      </>
                    ) : (
                      t.importBtn(parsed.rows.length)
                    )}
                  </button>
                  {completed && (
                    <>
                      <span className="text-sm text-emerald-700">
                        {t.done(completed.analyzed, completed.failed, completed.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push('/inbox')}
                        className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-emerald-50 hover:bg-emerald-800"
                      >
                        {t.viewInbox}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Format docs */}
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-1 text-base font-medium text-ink-900">{t.formatHeading}</h2>
        <p className="mb-4 text-sm text-ink-600">{t.formatDesc}</p>
        <FormatTable t={t} />
        <a
          href="/sample-import.csv"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
        >
          <Download className="h-4 w-4" />
          {t.sampleDownload}
        </a>
      </div>
    </div>
  );
}

function DetectedCol({
  label,
  value,
  notDetected,
  required,
}: {
  label: string;
  value: string | null;
  notDetected: string;
  required?: boolean;
}) {
  return (
    <>
      <dt className="text-xs text-ink-500">
        {label}
        {required && <span className="ms-1 text-red-500">*</span>}
      </dt>
      <dd className="text-sm">
        {value ? (
          <code className="rounded bg-white px-1.5 py-0.5 text-xs text-ink-800">{value}</code>
        ) : (
          <span className={required ? 'text-red-600' : 'text-ink-400'}>{notDetected}</span>
        )}
      </dd>
    </>
  );
}

function ErrorList({ errors, heading }: { errors: ImportError[]; heading: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-medium text-amber-900">
        {heading} ({errors.length})
      </p>
      <ul className="space-y-1 text-xs text-amber-800">
        {errors.slice(0, 10).map((er, i) => (
          <li key={i}>
            {er.rowIndex > 0 ? `Row ${er.rowIndex}: ` : ''}
            {er.reason}
          </li>
        ))}
        {errors.length > 10 && (
          <li className="text-amber-700">… +{errors.length - 10} more</li>
        )}
      </ul>
    </div>
  );
}

function RowPreview({
  rows,
  statuses,
  remaining,
  locale,
}: {
  rows: ParsedRow[];
  statuses: RowStatus[];
  remaining: number;
  locale: 'ar' | 'en';
}) {
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => {
        const s = statuses[i] ?? { phase: 'queued' as const };
        return (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-white p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs text-ink-500">
                #{r.rowIndex} · {'★'.repeat(r.rating)}
                {r.authorName ? ` · ${r.authorName}` : ''}
              </div>
              <p
                dir={r.language === 'en' ? 'ltr' : r.language === 'ar' ? 'rtl' : 'auto'}
                className="line-clamp-2 text-sm text-ink-800"
              >
                {r.reviewText}
              </p>
            </div>
            <RowBadge status={s} locale={locale} />
          </li>
        );
      })}
      {remaining > 0 && (
        <li className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-3 text-center text-xs text-ink-500">
          {locale === 'en' ? `… +${remaining} more rows` : `… ${remaining} صف إضافي`}
        </li>
      )}
    </ul>
  );
}

function RowBadge({ status, locale }: { status: RowStatus; locale: 'ar' | 'en' }) {
  const ar = locale === 'ar';
  switch (status.phase) {
    case 'queued':
      return <span className="text-xs text-ink-400">{ar ? 'بالانتظار' : 'queued'}</span>;
    case 'analyzing':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-accent-dark">
          <Loader2 className="h-3 w-3 animate-spin" />
          {ar ? 'تحليل...' : 'analyzing...'}
        </span>
      );
    case 'done':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
          <Check className="h-3 w-3" />
          {ar ? 'تم' : 'done'}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-700">
          <X className="h-3 w-3" />
          {ar ? 'فشل' : 'failed'}
        </span>
      );
    case 'quota':
      return (
        <span className="text-xs text-amber-700">{ar ? 'الحصة انتهت' : 'quota'}</span>
      );
  }
}

function FormatTable({ t }: { t: Labels }) {
  const rows = [
    { label: t.reviewTextCol, aliases: 'review_text · review · text · comment · body', required: true },
    { label: t.ratingCol, aliases: 'rating · stars · star_rating · score', required: true },
    { label: t.authorCol, aliases: 'author · reviewer · reviewer_display_name · name', required: false },
    { label: t.dateCol, aliases: 'posted_at · date · create_time · timestamp', required: false },
    { label: t.languageCol, aliases: 'language · lang · locale', required: false },
  ];
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-ink-100 first:border-t-0">
            <td className="py-2 pe-3 font-medium text-ink-900">{r.label}</td>
            <td className="py-2 pe-3 text-ink-600">
              <code className="text-xs">{r.aliases}</code>
            </td>
            <td className="py-2 text-xs text-ink-500">
              {r.required ? <span className="text-red-600">{t.required}</span> : t.optional}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
