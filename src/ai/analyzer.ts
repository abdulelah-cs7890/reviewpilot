import { generateJSON, MODELS, PROMPT_VERSIONS } from './client';

// Plain JSON Schema. The provider adapter translates as needed (Gemini's
// Type enum, Anthropic's tool input_schema).
const analysisSchema = {
  type: 'object',
  properties: {
    language: { type: 'string', enum: ['ar', 'en', 'mixed'] },
    dialect: {
      type: ['string', 'null'],
      enum: ['gulf', 'msa', 'levantine', 'egyptian', 'other'],
    },
    sentiment: { type: 'integer' },
    topics: { type: 'array', items: { type: 'string' } },
    urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
    severity: {
      type: 'string',
      enum: ['urgent_action', 'direct_reply', 'monitor', 'spam'],
    },
    mentions: {
      type: 'object',
      properties: {
        dishes: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        praise: { type: 'array', items: { type: 'string' } },
      },
      required: ['dishes', 'issues', 'praise'],
    },
    ownerSummary: { type: 'string' },
  },
  required: ['language', 'sentiment', 'topics', 'urgency', 'severity', 'mentions', 'ownerSummary'],
} as const;

export type ReviewLanguage = 'ar' | 'en' | 'mixed';
export type Urgency = 'low' | 'medium' | 'high';
export type Severity = 'urgent_action' | 'direct_reply' | 'monitor' | 'spam';

export interface ReviewAnalysis {
  language: ReviewLanguage;
  dialect?: 'msa' | 'gulf' | 'levantine' | 'egyptian' | 'other' | null;
  sentiment: -2 | -1 | 0 | 1 | 2;
  topics: string[];
  urgency: Urgency;
  severity: Severity;
  mentions: {
    dishes?: string[];
    issues?: string[];
    praise?: string[];
  };
  ownerSummary: string;
}

const ANALYZER_SYSTEM_PROMPT = `You analyze restaurant reviews from Saudi Arabia. Reviews come in Arabic (often Gulf/Saudi dialect), English, or a mix. Your output is JSON only — no prose, no markdown fences.

Detect the language carefully:
- "ar" = primarily Arabic
- "en" = primarily English
- "mixed" = significant code-switching between Arabic and English (more than just a single loanword)

For dialect, infer from the REVIEWER's own vocabulary and phrasing (NOT from
the restaurant's context — many MSA-writing reviewers eat at Saudi restaurants):
- "gulf" = clear Saudi/Gulf colloquial markers (وش، عاد، يا أخوي، كذا، الحين، مره،
  ترا، خرافي، بس بمعنى "لكن"، بيكون، شو، ليش، جلسنا، طيب بمعنى "جيد")
- "msa" = formal Modern Standard Arabic with no colloquial markers. Indicators:
  full case endings, MSA-only words (نسبياً، إطلاقاً، سأعود، نقطة الملاحظة، الكمية،
  مرتفعة، مقارنة)، honorifics like د./أ./م.، subjunctive (سـ + verb) constructions.
  Formal MSA reviews are very common from professional/older reviewers.
- Default rule: if you see ZERO colloquial Gulf markers AND the text reads as
  written formal Arabic, return "msa". Don't infer Gulf from author name or topic.
- Other dialects ("levantine", "egyptian") only when clearly identifiable.

Sentiment scale:
- -2: hostile, angry, threatening to never return or warn others
- -1: disappointed, dissatisfied, listing complaints
-  0: neutral, mixed, or factual without strong feeling
-  1: positive, satisfied
-  2: enthusiastic, glowing, will return

Topics — pick from this taxonomy (return as array, can be multiple):
food_quality, food_taste, food_presentation, food_temperature, portion_size,
service_speed, service_attitude, staff_friendliness, staff_knowledge,
wait_time, reservation_issue, seating, cleanliness, ambiance, music_noise,
price_value, hygiene, parking, delivery, packaging, payment_issue, other

Urgency rules:
- "high": rating ≤ 2 AND (food safety, hygiene, discrimination, harassment, allegation of theft, threat to escalate publicly/legally)
- "medium": rating ≤ 2 without urgent flags, OR a 3-star with serious specific complaints
- "low": 4-5 star reviews, or 3-star without serious issues

Severity classifies WHAT KIND of attention is needed (independent from urgency):
- "urgent_action": the customer needs OFFLINE action beyond a public reply.
  Triggers: allergen reaction, food-poisoning illness, hair / insect / foreign object in food,
  harassment or discrimination by staff, threat to escalate to regulator (هيئة الغذاء، vendor authority),
  threat to call legal counsel, mention of medical or emergency-services involvement.
  Often (but not always) coincides with urgency=high.
- "direct_reply": standard case — a public reply on Google suffices. Default for most reviews.
- "monitor": vague, low-signal text ("not good", "okay", short ambiguous), or a pattern-y
  complaint about a topic that's been raised before. Worth a brief reply, but mostly observation value.
- "spam": obvious troll, competitor smear, off-topic, or auto-generated. Owner should consider
  flagging on Google instead of responding.

CRITICAL — rude / impolite staff is NOT harassment.
- "rude cashier", "the waiter was dismissive", "قليل أدب", "ما رد علي بطريقة لائقة"
  → direct_reply (a public apology is the right response)
- Harassment / discrimination means hostile, threatening, slur-using, refusing service based
  on identity, or behavior that would warrant HR/legal intervention.
  → urgent_action (requires offline contact + management investigation)

Similarly: a "threat to never return" or "I'll warn everyone" is NOT a regulator threat.
Only mentions of هيئة الغذاء / consumer authority / lawyer / police / SFDA / ministry count.

Pick exactly ONE severity. When unsure between urgent_action and direct_reply, prefer urgent_action
ONLY for the specific triggers above — not just for any angry 1-star review.

Extract specific mentions:
- dishes: actual menu items named (e.g. "كبسة", "shawarma", "مندي")
- issues: concrete problems mentioned (e.g. "cold food", "rude waiter")
- praise: concrete positives (e.g. "fresh juice", "fast service")

ownerSummary: ONE line in the SAME LANGUAGE as the review, telling the owner the gist. Max 15 words.

Return ONLY this JSON shape (no markdown, no commentary):
{
  "language": "ar" | "en" | "mixed",
  "dialect": "gulf" | "msa" | "levantine" | "egyptian" | "other" | null,
  "sentiment": -2 | -1 | 0 | 1 | 2,
  "topics": string[],
  "urgency": "low" | "medium" | "high",
  "severity": "urgent_action" | "direct_reply" | "monitor" | "spam",
  "mentions": {
    "dishes": string[],
    "issues": string[],
    "praise": string[]
  },
  "ownerSummary": string
}`;

export async function analyzeReview(params: {
  reviewText: string;
  rating: number;
  authorName?: string;
}): Promise<ReviewAnalysis> {
  const userPrompt = `Rating: ${params.rating}/5
${params.authorName ? `Reviewer: ${params.authorName}\n` : ''}Review:
"""
${params.reviewText}
"""

Return the JSON analysis.`;

  return generateJSON<ReviewAnalysis>({
    model: MODELS.fast,
    systemPrompt: ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 1024,
    temperature: 0.2,
    schema: analysisSchema,
  });
}

export const ANALYZER_PROMPT_VERSION = PROMPT_VERSIONS.analyze;
