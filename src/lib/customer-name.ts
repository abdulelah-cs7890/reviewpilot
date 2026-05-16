/**
 * Customer/author name normalization for the timeline-by-author feature.
 *
 * Used in two places that must agree:
 *   1. Building the URL slug: /customer/[encodeURIComponent(normalized)]
 *   2. Querying the DB: WHERE lower(trim(author_name)) = lower(trim(passed))
 *
 * Intentionally conservative: trims + lowercases + collapses inner whitespace.
 * Does NOT try to merge "فهد" with "فهد القرني" — they could be different
 * people. If two customers genuinely have the same trimmed-lowercased name,
 * they'll appear together on the same timeline. Acceptable trade-off for v1.
 */

export function normalizeAuthorName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

/** Convenience: returns the URL-safe slug for use in <Link> href. */
export function customerHref(authorName: string | null | undefined): string | null {
  const normalized = normalizeAuthorName(authorName);
  if (!normalized) return null;
  return `/customer/${encodeURIComponent(normalized)}`;
}
