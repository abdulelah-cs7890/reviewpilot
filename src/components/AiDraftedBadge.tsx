import { Sparkles } from 'lucide-react';

export function AiDraftedBadge({ label = 'AI-assisted draft' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-dark"
      title={label}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}
