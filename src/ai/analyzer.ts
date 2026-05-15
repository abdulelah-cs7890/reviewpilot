import { generateJSON, MODELS, PROMPT_VERSIONS, Type, type ResponseSchema } from './client';

// Typed schema so Gemini enforces field names + types server-side. Mirrors
// the ReviewAnalysis interface below.
const analysisSchema: ResponseSchema = {
  type: Type.OBJECT,
  properties: {
    language: { type: Type.STRING, enum: ['ar', 'en', 'mixed'] },
    dialect: {
      type: Type.STRING,
      enum: ['gulf', 'msa', 'levantine', 'egyptian', 'other'],
      nullable: true,
    },
    sentiment: { type: Type.INTEGER },
    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
    urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
    mentions: {
      type: Type.OBJECT,
      properties: {
        dishes: { type: Type.ARRAY, items: { type: Type.STRING } },
        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
        praise: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      propertyOrdering: ['dishes', 'issues', 'praise'],
    },
    ownerSummary: { type: Type.STRING },
  },
  required: ['language', 'sentiment', 'topics', 'urgency', 'mentions', 'ownerSummary'],
  propertyOrdering: [
    'language',
    'dialect',
    'sentiment',
    'topics',
    'urgency',
    'mentions',
    'ownerSummary',
  ],
};

export type ReviewLanguage = 'ar' | 'en' | 'mixed';
export type Urgency = 'low' | 'medium' | 'high';

export interface ReviewAnalysis {
  language: ReviewLanguage;
  dialect?: 'msa' | 'gulf' | 'levantine' | 'egyptian' | 'other' | null;
  sentiment: -2 | -1 | 0 | 1 | 2;
  topics: string[];
  urgency: Urgency;
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
    responseSchema: analysisSchema,
  });
}

export const ANALYZER_PROMPT_VERSION = PROMPT_VERSIONS.analyze;
