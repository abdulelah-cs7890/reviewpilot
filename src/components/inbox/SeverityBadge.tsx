import type { UiLocale } from '@/lib/locale';
import { AlertTriangle, MessageSquare, Eye, Ban } from 'lucide-react';

type Severity = 'urgent_action' | 'direct_reply' | 'monitor' | 'spam' | null | undefined;

const LABELS: Record<UiLocale, Record<NonNullable<Severity>, string>> = {
  ar: {
    urgent_action: 'إجراء عاجل',
    direct_reply: 'رد مباشر',
    monitor: 'متابعة',
    spam: 'مزعج',
  },
  en: {
    urgent_action: 'Urgent action',
    direct_reply: 'Direct reply',
    monitor: 'Monitor',
    spam: 'Spam',
  },
};

const CLASSES: Record<NonNullable<Severity>, string> = {
  urgent_action: 'bg-red-100 text-red-800 ring-1 ring-red-300',
  direct_reply: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  monitor: 'bg-ink-100 text-ink-600',
  spam: 'bg-ink-50 text-ink-400 line-through',
};

const ICONS: Record<NonNullable<Severity>, typeof AlertTriangle> = {
  urgent_action: AlertTriangle,
  direct_reply: MessageSquare,
  monitor: Eye,
  spam: Ban,
};

export function SeverityBadge({
  severity,
  locale = 'ar',
}: {
  severity: Severity;
  locale?: UiLocale;
}) {
  if (!severity) return null;
  const Icon = ICONS[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[severity]}`}
    >
      <Icon className="h-3 w-3" />
      {LABELS[locale][severity]}
    </span>
  );
}
