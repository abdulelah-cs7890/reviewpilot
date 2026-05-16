'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

type GroupKey = 'urgency' | 'sentiment' | 'language' | 'status' | 'severity';

interface FiltersCopy {
  urgency: string;
  sentiment: string;
  language: string;
  status: string;
  severity: string;
  clear: string;
  urgent: string;
  important: string;
  normal: string;
  positive: string;
  neutral: string;
  negative: string;
  arabic: string;
  english: string;
  mixed: string;
  pending: string;
  drafted: string;
  responded: string;
  sevUrgentAction: string;
  sevDirectReply: string;
  sevMonitor: string;
  sevSpam: string;
}

export function InboxFilters({ t }: { t: FiltersCopy }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const groups: Array<{
    key: GroupKey;
    label: string;
    options: Array<{ value: string; label: string }>;
  }> = [
    {
      key: 'urgency',
      label: t.urgency,
      options: [
        { value: 'high', label: t.urgent },
        { value: 'medium', label: t.important },
        { value: 'low', label: t.normal },
      ],
    },
    {
      key: 'sentiment',
      label: t.sentiment,
      options: [
        { value: 'positive', label: t.positive },
        { value: 'neutral', label: t.neutral },
        { value: 'negative', label: t.negative },
      ],
    },
    {
      key: 'language',
      label: t.language,
      options: [
        { value: 'ar', label: t.arabic },
        { value: 'en', label: t.english },
        { value: 'mixed', label: t.mixed },
      ],
    },
    {
      key: 'status',
      label: t.status,
      options: [
        { value: 'pending', label: t.pending },
        { value: 'drafted', label: t.drafted },
        { value: 'responded', label: t.responded },
      ],
    },
    {
      key: 'severity',
      label: t.severity,
      options: [
        { value: 'urgent_action', label: t.sevUrgentAction },
        { value: 'direct_reply', label: t.sevDirectReply },
        { value: 'monitor', label: t.sevMonitor },
        { value: 'spam', label: t.sevSpam },
      ],
    },
  ];

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const hasAnyFilter = groups.some((g) => params.get(g.key));

  return (
    <div className={`space-y-3 ${pending ? 'opacity-60' : ''}`}>
      {groups.map((g) => {
        const current = params.get(g.key);
        return (
          <div key={g.key} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-500 min-w-[64px]">{g.label}:</span>
            {g.options.map((opt) => {
              const active = current === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(g.key, active ? null : opt.value)}
                  className={
                    'rounded-full px-3 py-1 text-xs transition ' +
                    (active
                      ? 'bg-ink-900 text-ink-50'
                      : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100')
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      })}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(pathname))}
          className="text-xs text-ink-500 underline hover:text-ink-700"
        >
          {t.clear}
        </button>
      )}
    </div>
  );
}
