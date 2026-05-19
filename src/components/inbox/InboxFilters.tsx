'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search } from 'lucide-react';

type GroupKey = 'urgency' | 'sentiment' | 'language' | 'status' | 'severity';

interface FiltersCopy {
  urgency: string;
  sentiment: string;
  language: string;
  status: string;
  severity: string;
  clear: string;
  searchPlaceholder?: string;
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

export function InboxFilters({ t, locale = 'ar' }: { t: FiltersCopy; locale?: 'ar' | 'en' }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const initialQ = params.get('q') ?? '';
  const [searchValue, setSearchValue] = useState(initialQ);

  // Sync local search state with URL when query param changes externally
  useEffect(() => {
    setSearchValue(initialQ);
  }, [initialQ]);

  // Debounce search input → URL
  useEffect(() => {
    const trimmed = searchValue.trim();
    if (trimmed === initialQ) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

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

  const hasAnyFilter = groups.some((g) => params.get(g.key)) || !!params.get('q');

  const searchPlaceholder =
    t.searchPlaceholder ??
    (locale === 'en' ? 'Search reviews or author…' : 'ابحث في التقييمات أو الاسم...');

  return (
    <div className={`space-y-3 ${pending ? 'opacity-60' : ''}`}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          style={locale === 'ar' ? { right: '12px' } : { left: '12px' }}
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full rounded-xl border border-ink-200 bg-white py-2.5 text-sm text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            locale === 'ar' ? 'pe-10 ps-4' : 'ps-10 pe-4'
          }`}
        />
      </div>
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
