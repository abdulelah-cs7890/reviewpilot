'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

type Group = {
  key: 'urgency' | 'sentiment' | 'language' | 'status';
  label: string;
  options: Array<{ value: string; label: string }>;
};

const groups: Group[] = [
  {
    key: 'urgency',
    label: 'الإلحاح',
    options: [
      { value: 'high', label: 'عاجل' },
      { value: 'medium', label: 'مهم' },
      { value: 'low', label: 'عادي' },
    ],
  },
  {
    key: 'sentiment',
    label: 'المشاعر',
    options: [
      { value: 'positive', label: 'إيجابي' },
      { value: 'neutral', label: 'محايد' },
      { value: 'negative', label: 'سلبي' },
    ],
  },
  {
    key: 'language',
    label: 'اللغة',
    options: [
      { value: 'ar', label: 'عربي' },
      { value: 'en', label: 'English' },
      { value: 'mixed', label: 'مختلط' },
    ],
  },
  {
    key: 'status',
    label: 'الحالة',
    options: [
      { value: 'pending', label: 'بانتظار' },
      { value: 'drafted', label: 'بمسودة' },
      { value: 'responded', label: 'تم الرد' },
    ],
  },
];

export function InboxFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

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
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}
