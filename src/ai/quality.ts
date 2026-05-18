/**
 * Meta-grading step. After the drafter produces a response, this AI call
 * compares the draft against the original review and decides:
 *
 * 1. What concrete issues did the reviewer raise? (skip vague stuff like "not good")
 * 2. For each issue, does the draft acknowledge / address it specifically?
 * 3. Overall score 0-100 reflecting how well the draft handles the review
 *
 * Output language matches the review language so the issue strings render
 * correctly in the inbox detail view.
 *
 * Uses Flash-Lite (cheap, focused JSON task). Failure-tolerant: the calling
 * action wraps this in try/catch — if 429 or schema error, the draft saves
 * without the check and the UI hides the card.
 */

import { generateJSON, MODELS, PROMPT_VERSIONS } from './client';
import type { ReviewAnalysis } from './analyzer';
import type { QualityCheckResult } from '@/db';

const qualitySchema = {
  type: 'object',
  properties: {
    checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'string' },
          addressed: { type: 'boolean' },
          note: { type: ['string', 'null'] },
        },
        required: ['issue', 'addressed'],
      },
    },
    overallScore: { type: 'integer' },
    language: { type: 'string', enum: ['ar', 'en'] },
  },
  required: ['checks', 'overallScore', 'language'],
} as const;

const QUALITY_SYSTEM_PROMPT = `You are a quality reviewer for restaurant review responses. Given a customer review, an analysis of it, and a draft response, you decide:

1. What CONCRETE issues did the reviewer raise? Only count specific complaints — cold food, rude staff named or described, long wait time with a number, allergen mistake, missing item, broken delivery, hygiene issue. Skip vague statements like "not good" or "wasn't great." Skip praise unless asking about whether praise was acknowledged.

2. For each concrete issue, does the draft ADDRESS it specifically?
   - addressed=true: the draft acknowledges THAT issue (mentions the cold food, the wait, the missing item — by name or clearly enough that the reviewer would feel heard)
   - addressed=false: the draft is generic, blames the customer, ignores the issue, or only addresses other things. Include a short "note" explaining what's missing.

3. For 5-star or 4-star positive reviews with NO concrete issues: return an empty checks array. The overall score should reflect warmth, specificity (does the draft reference what the reviewer praised?), and absence of generic AI clichés.

4. overallScore guide:
   - 90-100: every issue addressed specifically, warm, no clichés, references the reviewer's actual words
   - 70-89: most issues addressed, mostly warm, maybe one generic line
   - 40-69: some issues missed, somewhat generic, but no actively bad moves
   - <40: blames customer, ignores all complaints, full of clichés, or worse

5. The "issue" strings go to the restaurant owner in the inbox. Write them in the SAME LANGUAGE as the review (ar or en), as short noun phrases:
   - Arabic example: "الأكل بارد", "تأخر التوصيل ساعتين"
   - English example: "cold food", "delivery 90 min late"

Return JSON only — no prose, no markdown fences.`;

export async function qualityCheck(params: {
  reviewText: string;
  rating: number;
  analysis: ReviewAnalysis;
  draftText: string;
}): Promise<QualityCheckResult> {
  const userPrompt = `# Original review
Rating: ${params.rating}/5
Review language: ${params.analysis.language}
Sentiment: ${params.analysis.sentiment} (scale -2 to 2)
Topics: ${params.analysis.topics.join(', ') || 'none'}
Issues already extracted by the analyzer: ${
    params.analysis.mentions.issues?.join(', ') || 'none'
  }

Review text:
"""
${params.reviewText}
"""

# Draft response (the thing being graded)
"""
${params.draftText}
"""

Grade it. Return the JSON only.`;

  return generateJSON<QualityCheckResult>({
    model: MODELS.fast,
    systemPrompt: QUALITY_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 1024,
    temperature: 0.2,
    schema: qualitySchema,
  });
}

export const QUALITY_PROMPT_VERSION = `${PROMPT_VERSIONS.analyze}-quality-v1`;
