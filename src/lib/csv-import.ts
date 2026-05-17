/**
 * CSV import for restaurant reviews.
 *
 * Hand-rolled parser to avoid a dep. Handles quoted fields, embedded commas,
 * embedded newlines inside quotes (common in Google Takeout exports with
 * multi-line review bodies), CR/LF/CRLF line endings, and a leading BOM.
 *
 * Header matching is alias-based + case-insensitive so owners with exports
 * from various sources don't have to rename columns by hand.
 */

export interface ParsedRow {
  rowIndex: number; // 1-based row number in source (excluding header)
  reviewText: string;
  rating: number;
  authorName?: string;
  postedAt?: Date;
  language?: 'ar' | 'en' | 'mixed';
}

export interface ImportError {
  rowIndex: number;
  reason: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ImportError[];
  totalRows: number; // raw row count including bad rows
  detectedColumns: {
    reviewText: string | null;
    rating: string | null;
    authorName: string | null;
    postedAt: string | null;
    language: string | null;
  };
}

export const MAX_ROWS = 500;
export const MIN_REVIEW_LENGTH = 5;

const ALIASES = {
  reviewText: ['review_text', 'review', 'text', 'comment', 'body', 'content'],
  rating: ['rating', 'stars', 'star_rating', 'starrating', 'score'],
  authorName: ['author', 'author_name', 'reviewer', 'reviewer_display_name', 'reviewerdisplayname', 'name'],
  postedAt: ['posted_at', 'date', 'create_time', 'createtime', 'created_at', 'time', 'timestamp'],
  language: ['language', 'lang', 'locale'],
} as const;

function parseCsv(input: string): string[][] {
  // Strip leading BOM if present (common in Google/Excel exports)
  let src = input;
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  // Normalize CRLF to LF; standalone CR -> LF
  src = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote: "" -> "
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Flush trailing field/row if file didn't end with newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop trailing empty rows (single empty field counts as empty)
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0].trim() === '') rows.pop();
    else break;
  }
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function matchHeader(
  headers: string[],
  aliases: readonly string[]
): { index: number; original: string } | null {
  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeHeader(headers[i]);
    if (aliases.includes(norm)) return { index: i, original: headers[i] };
  }
  return null;
}

function parseRating(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // "★★★★★" → 5; "5 stars" → 5; "5" → 5; "5.0" → 5
  const stars = (trimmed.match(/★/g) || []).length;
  if (stars >= 1 && stars <= 5) return stars;
  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;
  const n = Math.round(parseFloat(numMatch[1]));
  if (n < 1 || n > 5) return null;
  return n;
}

function parseDate(raw: string): Date | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

function parseLanguage(raw: string): 'ar' | 'en' | 'mixed' | undefined {
  const norm = raw.trim().toLowerCase();
  if (norm === 'ar' || norm === 'arabic') return 'ar';
  if (norm === 'en' || norm === 'english') return 'en';
  if (norm === 'mixed' || norm === 'both') return 'mixed';
  return undefined;
}

export function parseImportCsv(input: string): ParseResult {
  const rows = parseCsv(input);
  if (rows.length === 0) {
    return {
      rows: [],
      errors: [{ rowIndex: 0, reason: 'empty file' }],
      totalRows: 0,
      detectedColumns: {
        reviewText: null,
        rating: null,
        authorName: null,
        postedAt: null,
        language: null,
      },
    };
  }
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const reviewTextCol = matchHeader(headers, ALIASES.reviewText);
  const ratingCol = matchHeader(headers, ALIASES.rating);
  const authorCol = matchHeader(headers, ALIASES.authorName);
  const dateCol = matchHeader(headers, ALIASES.postedAt);
  const langCol = matchHeader(headers, ALIASES.language);

  const detectedColumns = {
    reviewText: reviewTextCol?.original ?? null,
    rating: ratingCol?.original ?? null,
    authorName: authorCol?.original ?? null,
    postedAt: dateCol?.original ?? null,
    language: langCol?.original ?? null,
  };

  const errors: ImportError[] = [];

  if (!reviewTextCol) {
    errors.push({
      rowIndex: 0,
      reason: `missing review text column (expected one of: ${ALIASES.reviewText.join(', ')})`,
    });
  }
  if (!ratingCol) {
    errors.push({
      rowIndex: 0,
      reason: `missing rating column (expected one of: ${ALIASES.rating.join(', ')})`,
    });
  }
  if (errors.length > 0) {
    return { rows: [], errors, totalRows: dataRows.length, detectedColumns };
  }

  if (dataRows.length > MAX_ROWS) {
    errors.push({
      rowIndex: 0,
      reason: `too many rows (${dataRows.length}); max ${MAX_ROWS} per import`,
    });
    return { rows: [], errors, totalRows: dataRows.length, detectedColumns };
  }

  const parsedRows: ParsedRow[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i];
    const rowIndex = i + 1; // 1-based, excluding header
    const reviewText = (cells[reviewTextCol!.index] ?? '').trim();
    const ratingRaw = cells[ratingCol!.index] ?? '';
    const authorName = authorCol ? (cells[authorCol.index] ?? '').trim() : '';
    const dateRaw = dateCol ? (cells[dateCol.index] ?? '') : '';
    const langRaw = langCol ? (cells[langCol.index] ?? '') : '';

    if (!reviewText) {
      errors.push({ rowIndex, reason: 'empty review text' });
      continue;
    }
    if (reviewText.length < MIN_REVIEW_LENGTH) {
      errors.push({ rowIndex, reason: `review too short (<${MIN_REVIEW_LENGTH} chars)` });
      continue;
    }
    const rating = parseRating(ratingRaw);
    if (rating === null) {
      errors.push({ rowIndex, reason: `invalid rating "${ratingRaw}"` });
      continue;
    }
    parsedRows.push({
      rowIndex,
      reviewText: reviewText.slice(0, 4000),
      rating,
      authorName: authorName || undefined,
      postedAt: parseDate(dateRaw),
      language: parseLanguage(langRaw),
    });
  }

  return {
    rows: parsedRows,
    errors,
    totalRows: dataRows.length,
    detectedColumns,
  };
}
