/**
 * Bulk-paste parser. Accepts a textarea blob like:
 *
 *   5 stars - فهد
 *   والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية.
 *   ---
 *   1 star - محمد
 *   تجربة سيئة جداً. الأكل وصل بارد.
 *   ---
 *   3 - (anonymous)
 *   الأكل عادي.
 *
 * Returns the parsed entries OR an array of inline error diagnostics so the
 * caller can render them per-block. We intentionally don't throw — bulk
 * imports often have one bad entry and we want to surface that without
 * aborting the rest.
 */

export interface BulkEntry {
  rating: number;
  authorName: string | null;
  reviewText: string;
}

export interface BulkParseError {
  blockIndex: number;
  blockText: string;
  reason: string;
}

export interface BulkParseResult {
  entries: BulkEntry[];
  errors: BulkParseError[];
}

const ANONYMOUS_TOKENS = new Set([
  '',
  'anonymous',
  '(anonymous)',
  'مجهول',
  '(مجهول)',
  '-',
  '—',
]);

// Match: digit (1-5), optional "stars"/"star", optional dash, optional author.
// Examples that match:  "5 stars - فهد"  /  "1 - محمد"  /  "3"  /  "4 star Yara"
const HEADER_RE = /^(\d) ?stars? ?-?\s*(.*)$/i;

export function parseBulkInput(raw: string): BulkParseResult {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return { entries: [], errors: [] };

  const blocks = text.split(/^---\s*$/m).map((b) => b.trim()).filter(Boolean);
  const entries: BulkEntry[] = [];
  const errors: BulkParseError[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const headerLine = lines[0]?.trim();
    if (!headerLine) {
      errors.push({ blockIndex: index, blockText: block, reason: 'empty header line' });
      return;
    }
    const m = headerLine.match(HEADER_RE);
    if (!m) {
      errors.push({
        blockIndex: index,
        blockText: block,
        reason: `header doesn't match "N stars - author" (got: "${headerLine}")`,
      });
      return;
    }
    const rating = Number(m[1]);
    if (rating < 1 || rating > 5) {
      errors.push({
        blockIndex: index,
        blockText: block,
        reason: `rating must be 1–5 (got ${rating})`,
      });
      return;
    }

    const authorRaw = (m[2] ?? '').trim();
    const authorName = ANONYMOUS_TOKENS.has(authorRaw.toLowerCase())
      ? null
      : authorRaw || null;

    const reviewText = lines.slice(1).join('\n').trim();
    if (!reviewText) {
      errors.push({
        blockIndex: index,
        blockText: block,
        reason: 'review text is empty',
      });
      return;
    }
    if (reviewText.length < 5) {
      errors.push({
        blockIndex: index,
        blockText: block,
        reason: 'review text too short (min 5 chars)',
      });
      return;
    }

    entries.push({ rating, authorName, reviewText });
  });

  return { entries, errors };
}
