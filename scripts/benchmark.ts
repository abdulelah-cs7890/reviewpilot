/**
 * Benchmark the AI pipeline against a held-out golden set.
 *
 * For each sample with an `expected` block in `samples/reviews.ts`, runs:
 *   1. analyzer  (gemini-2.5-flash-lite)
 *   2. drafter   (gemini-2.5-flash)
 *   3. qualityCheck (gemini-2.5-flash-lite)
 *
 * Compares analyzer output to `expected` using documented tolerances and
 * appends a run section to benchmark-results.md.
 *
 * Usage:
 *   npm run benchmark                    # default 5 reviews
 *   npm run benchmark -- --count=10      # specify N
 *
 * Quota: each review burns 2 flash-lite + 1 flash. Default 5 = 10 + 5 calls.
 * Free tier is 20 RPD/model, so 5/run is safe. Run multiple times across days
 * if you want larger samples.
 */

import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sampleReviews, type SampleReview } from '../samples/reviews';
import { analyzeReview } from '../src/ai/analyzer';
import { draftResponse, type VoiceProfileInput } from '../src/ai/drafter';
import { qualityCheck } from '../src/ai/quality';

const DEFAULT_COUNT = 5;
const OUTPUT_FILE = join(process.cwd(), 'benchmark-results.md');

function parseArgs(argv: string[]): { count: number; ids: string[] | null } {
  let count = DEFAULT_COUNT;
  let ids: string[] | null = null;
  for (const arg of argv) {
    const c = arg.match(/^--count=(\d+)$/);
    if (c) count = parseInt(c[1], 10);
    const i = arg.match(/^--ids=(.+)$/);
    if (i) ids = i[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return { count, ids };
}

interface FieldResult {
  ok: boolean;
  expected: string;
  actual: string;
}

interface SampleResult {
  id: string;
  language: FieldResult;
  dialect: FieldResult | null;
  sentiment: FieldResult;
  urgency: FieldResult;
  severity: FieldResult;
  topics: FieldResult | null;
  qualityScore: number | null;
  draftExcerpt: string;
  draftLanguage: string;
  errors: string[];
}

function scoreSample(
  sample: SampleReview & { expected: NonNullable<SampleReview['expected']> },
  analysis: Awaited<ReturnType<typeof analyzeReview>>
): Omit<SampleResult, 'qualityScore' | 'draftExcerpt' | 'draftLanguage' | 'errors'> {
  const e = sample.expected;

  // Language: exact match
  const language: FieldResult = {
    ok: analysis.language === e.language,
    expected: e.language,
    actual: analysis.language,
  };

  // Dialect: exact match when expected; null/undefined means we don't check
  const dialect: FieldResult | null =
    e.dialect === undefined
      ? null
      : {
          ok: (analysis.dialect ?? null) === (e.dialect ?? null),
          expected: String(e.dialect),
          actual: String(analysis.dialect ?? 'null'),
        };

  // Sentiment: within range
  const sentiment: FieldResult = {
    ok: analysis.sentiment >= e.sentimentRange[0] && analysis.sentiment <= e.sentimentRange[1],
    expected: `${e.sentimentRange[0]}..${e.sentimentRange[1]}`,
    actual: String(analysis.sentiment),
  };

  // Urgency: exact match
  const urgency: FieldResult = {
    ok: analysis.urgency === e.urgency,
    expected: e.urgency,
    actual: analysis.urgency,
  };

  // Severity: exact match
  const severity: FieldResult = {
    ok: analysis.severity === e.severity,
    expected: e.severity,
    actual: analysis.severity,
  };

  // Topics: at least one expected substring matches some analyzer topic
  const topics: FieldResult | null = e.topicMustInclude
    ? (() => {
        const haystack = analysis.topics.join(' ').toLowerCase();
        const matched = e.topicMustInclude.find((needle) =>
          haystack.includes(needle.toLowerCase())
        );
        return {
          ok: !!matched,
          expected: `≥1 of [${e.topicMustInclude.join(', ')}]`,
          actual: analysis.topics.length > 0 ? analysis.topics.join(', ') : '(none)',
        };
      })()
    : null;

  return { id: sample.id, language, dialect, sentiment, urgency, severity, topics };
}

function check(r: FieldResult | null): string {
  if (r === null) return '—';
  return r.ok ? '✓' : '✗';
}

function tally(results: SampleResult[]): {
  language: number;
  sentiment: number;
  urgency: number;
  severity: number;
  topics: { total: number; pass: number };
  dialect: { total: number; pass: number };
  meanQuality: number | null;
  minQuality: number | null;
} {
  const n = results.length;
  let lang = 0;
  let sent = 0;
  let urg = 0;
  let sev = 0;
  let topicTotal = 0;
  let topicPass = 0;
  let dialectTotal = 0;
  let dialectPass = 0;
  const qualities: number[] = [];

  for (const r of results) {
    if (r.language.ok) lang++;
    if (r.sentiment.ok) sent++;
    if (r.urgency.ok) urg++;
    if (r.severity.ok) sev++;
    if (r.topics) {
      topicTotal++;
      if (r.topics.ok) topicPass++;
    }
    if (r.dialect) {
      dialectTotal++;
      if (r.dialect.ok) dialectPass++;
    }
    if (r.qualityScore !== null) qualities.push(r.qualityScore);
  }

  return {
    language: lang,
    sentiment: sent,
    urgency: urg,
    severity: sev,
    topics: { total: topicTotal, pass: topicPass },
    dialect: { total: dialectTotal, pass: dialectPass },
    meanQuality:
      qualities.length === 0
        ? null
        : Math.round((qualities.reduce((s, x) => s + x, 0) / qualities.length) * 10) / 10,
    minQuality: qualities.length === 0 ? null : Math.min(...qualities),
  };
}

function renderRunMarkdown(results: SampleResult[], modelInfo: { fast: string; smart: string }) {
  const t = tally(results);
  const n = results.length;
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('');
  lines.push(`## Run — ${now}`);
  lines.push('');
  lines.push(`**Samples:** ${n} · **Models:** \`${modelInfo.fast}\` (analyzer + quality), \`${modelInfo.smart}\` (drafter)`);
  lines.push('');
  lines.push('| id | lang | sentiment | urgency | severity | topics | quality |');
  lines.push('|---|---|---|---|---|---|---|');

  for (const r of results) {
    const q = r.qualityScore === null ? '—' : String(r.qualityScore);
    lines.push(
      `| \`${r.id}\` | ${check(r.language)} ${r.language.actual} | ${check(r.sentiment)} ${r.sentiment.actual} (exp ${r.sentiment.expected}) | ${check(r.urgency)} ${r.urgency.actual} | ${check(r.severity)} ${r.severity.actual} | ${check(r.topics)} | ${q} |`
    );
  }
  lines.push('');
  lines.push(
    `**Aggregate:** language ${t.language}/${n} · sentiment ${t.sentiment}/${n} · urgency ${t.urgency}/${n} · severity ${t.severity}/${n}` +
      (t.topics.total > 0 ? ` · topics ${t.topics.pass}/${t.topics.total}` : '') +
      (t.dialect.total > 0 ? ` · dialect ${t.dialect.pass}/${t.dialect.total}` : '') +
      (t.meanQuality !== null ? ` · quality mean ${t.meanQuality} / min ${t.minQuality}` : '')
  );
  lines.push('');
  lines.push('<details><summary>Draft excerpts</summary>');
  lines.push('');
  for (const r of results) {
    lines.push(`- \`${r.id}\` (${r.draftLanguage}): ${r.draftExcerpt}`);
  }
  lines.push('');
  lines.push('</details>');
  lines.push('');
  if (results.some((r) => r.errors.length > 0)) {
    lines.push('<details><summary>Errors</summary>');
    lines.push('');
    for (const r of results) {
      if (r.errors.length === 0) continue;
      lines.push(`- \`${r.id}\`: ${r.errors.join('; ')}`);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
  return lines.join('\n');
}

function ensureHeader() {
  if (existsSync(OUTPUT_FILE)) return;
  const header = `# ReviewPilot — Benchmark results

This file accumulates results from running the AI pipeline against the golden set in \`samples/reviews.ts\`. Each section is one \`npm run benchmark\` invocation.

**What's scored:**
- \`language\`: exact match against expected
- \`dialect\`: exact match when applicable (only for Arabic samples)
- \`sentiment\`: scored value within the documented range (e.g. expected \`-2..-1\` accepts -2 or -1)
- \`urgency\` / \`severity\`: exact match
- \`topics\`: at least one expected substring appears in the analyzer's emitted topic list (substring, case-insensitive)
- \`quality\`: 0–100 from the meta-grader (compares the generated draft against the original review)

**Tolerances are deliberate** — Gemini outputs vary between runs. Sentiment ranges and topic-substring matching reduce false negatives without letting through wrong classifications.

`;
  writeFileSync(OUTPUT_FILE, header, 'utf8');
}

async function main() {
  const { count, ids } = parseArgs(process.argv.slice(2));

  const candidates = sampleReviews.filter(
    (s): s is SampleReview & { expected: NonNullable<SampleReview['expected']> } =>
      !!s.expected
  );
  if (candidates.length === 0) {
    console.error('No samples with an `expected` block. Add one to samples/reviews.ts and rerun.');
    process.exit(1);
  }
  let selected: typeof candidates;
  if (ids) {
    const idSet = new Set(ids);
    selected = candidates.filter((s) => idSet.has(s.id));
    const missing = ids.filter((id) => !candidates.some((s) => s.id === id));
    if (missing.length > 0) {
      console.warn(`Warning: ids not found in samples with expected blocks: ${missing.join(', ')}`);
    }
    if (selected.length === 0) {
      console.error('No matching ids. Aborting.');
      process.exit(1);
    }
    console.log(`Running benchmark on ${selected.length} targeted sample(s): ${selected.map((s) => s.id).join(', ')}`);
  } else {
    selected = candidates.slice(0, count);
    console.log(`Running benchmark on ${selected.length} sample(s)...`);
  }

  const voiceProfile: VoiceProfileInput = {
    formality: 'warm',
    useReligiousPhrases: true,
    arabicDialect: 'gulf',
    customInstructions: null,
    signoff: null,
    sampleResponses: null,
  };

  const results: SampleResult[] = [];
  let modelFast = '';
  let modelSmart = '';

  for (const sample of selected) {
    console.log(`\n→ ${sample.id}`);
    const errors: string[] = [];
    let analysis: Awaited<ReturnType<typeof analyzeReview>> | null = null;
    let draftExcerpt = '(skipped)';
    let draftLanguage = '?';
    let quality: number | null = null;

    try {
      analysis = await analyzeReview({
        reviewText: sample.reviewText,
        rating: sample.rating,
        authorName: sample.authorName,
      });
      console.log(`  analyzer: lang=${analysis.language} sent=${analysis.sentiment} urg=${analysis.urgency} sev=${analysis.severity}`);
    } catch (err) {
      errors.push(`analyzer: ${err instanceof Error ? err.message : String(err)}`);
      console.warn(`  analyzer failed: ${errors[errors.length - 1]}`);
    }

    if (analysis) {
      try {
        const draft = await draftResponse({
          reviewText: sample.reviewText,
          rating: sample.rating,
          authorName: sample.authorName,
          analysis,
          voiceProfile,
          restaurantName: 'Benchmark Restaurant',
        });
        draftExcerpt = draft.draftText.replace(/\s+/g, ' ').slice(0, 100);
        draftLanguage = draft.language;
        modelSmart = draft.model;
        console.log(`  drafter:  ${draftExcerpt}...`);

        try {
          const qc = await qualityCheck({
            reviewText: sample.reviewText,
            rating: sample.rating,
            analysis,
            draftText: draft.draftText,
          });
          quality = qc.overallScore;
          console.log(`  quality:  ${quality}/100 (${qc.checks.length} issues)`);
        } catch (err) {
          errors.push(`quality: ${err instanceof Error ? err.message : String(err)}`);
        }
      } catch (err) {
        errors.push(`drafter: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (analysis) {
      const scored = scoreSample(sample, analysis);
      // The analyzer module imports MODELS; we capture from the drafter's return for smart,
      // and infer fast from the analyzer (it always uses MODELS.fast).
      modelFast = 'gemini-2.5-flash-lite';
      results.push({
        ...scored,
        qualityScore: quality,
        draftExcerpt,
        draftLanguage,
        errors,
      });
    } else {
      // Couldn't analyze; still record row so the report shows the failure.
      results.push({
        id: sample.id,
        language: { ok: false, expected: sample.expected.language, actual: 'FAILED' },
        dialect: null,
        sentiment: {
          ok: false,
          expected: `${sample.expected.sentimentRange[0]}..${sample.expected.sentimentRange[1]}`,
          actual: 'FAILED',
        },
        urgency: { ok: false, expected: sample.expected.urgency, actual: 'FAILED' },
        severity: { ok: false, expected: sample.expected.severity, actual: 'FAILED' },
        topics: null,
        qualityScore: null,
        draftExcerpt,
        draftLanguage,
        errors,
      });
    }
  }

  ensureHeader();
  const md = renderRunMarkdown(results, {
    fast: modelFast || 'gemini-2.5-flash-lite',
    smart: modelSmart || 'gemini-2.5-flash',
  });
  appendFileSync(OUTPUT_FILE, md, 'utf8');
  console.log(`\n✓ Appended to ${OUTPUT_FILE}`);

  // Echo the aggregate so the developer sees it without opening the file
  const t = tally(results);
  const n = results.length;
  console.log('');
  console.log(`Aggregate: language ${t.language}/${n} · sentiment ${t.sentiment}/${n} · urgency ${t.urgency}/${n} · severity ${t.severity}/${n}` +
    (t.meanQuality !== null ? ` · quality mean ${t.meanQuality}` : ''));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// `samples/reviews.ts` is imported but its file structure should be the canonical source;
// hush the unused-import linter if any other check kicks in.
void readFileSync;
