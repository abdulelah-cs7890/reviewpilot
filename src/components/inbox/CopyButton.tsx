'use client';

import { useState } from 'react';

export function CopyButton({ text, label = 'نسخ' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in some contexts; fall back to a textarea select trick
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
      {copied ? '✓ تم النسخ' : label}
    </button>
  );
}
