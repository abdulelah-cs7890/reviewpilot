import { Sparkles } from 'lucide-react';

export function AiDraftedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-dark"
      title="هذه المسودة من اقتراح الذكاء الاصطناعي — راجعها قبل النشر"
    >
      <Sparkles className="h-3 w-3" />
      بمساعدة الذكاء الاصطناعي
    </span>
  );
}
