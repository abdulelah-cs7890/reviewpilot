import Link from 'next/link';
import { MessageSquare, BarChart3 } from 'lucide-react';

const LABELS = {
  ar: { policies: 'السياسات', quality: 'جودة المسودات' },
  en: { policies: 'Policies', quality: 'Draft quality' },
};

export function InsightsTabs({
  current,
  locale,
}: {
  current: 'policies' | 'quality';
  locale: 'ar' | 'en';
}) {
  const t = LABELS[locale];
  return (
    <nav className="mb-6 flex gap-1 border-b border-ink-100">
      <TabLink href="/insights" active={current === 'policies'} icon={<MessageSquare className="h-4 w-4" />} label={t.policies} />
      <TabLink href="/insights?tab=quality" active={current === 'quality'} icon={<BarChart3 className="h-4 w-4" />} label={t.quality} />
    </nav>
  );
}

function TabLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition ${
        active
          ? 'border-accent-dark text-ink-900'
          : 'border-transparent text-ink-500 hover:text-ink-800'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
