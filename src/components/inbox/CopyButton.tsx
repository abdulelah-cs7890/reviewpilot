'use client';

import { useState } from 'react';

const LABELS = {
  ar: { copy: 'نسخ', copied: '✓ تم النسخ' },
  en: { copy: 'Copy', copied: '✓ Copied' },
} as const;

export function CopyButton({
  text,
  locale = 'ar',
  label,
}: {
  text: string;
  locale?: 'ar' | 'en';
  /** Optional override; falls back to locale-default. */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = LABELS[locale];
  const idleLabel = label ?? t.copy;

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 transition hover:bg-ink-800"
    >
      {copied ? t.copied : idleLabel}
    </button>
  );
}
