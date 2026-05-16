/**
 * Rewrite a draft according to a free-form owner instruction.
 *
 * Different from regenerate (which produces an alternative draft at higher
 * temperature) — this one takes the OWNER's intent into account, e.g.
 * "make it shorter", "more apologetic", "offer a free dessert".
 *
 * Reuses the drafter's responseSchema + voice profile context so the rewrite
 * stays within the same rules (language matching, no forbidden phrases,
 * signoff handling, etc.). The system prompt explicitly tells the model to
 * REWRITE the original draft, not write from scratch.
 */

import {
  generateJSON,
  MODELS,
  PROMPT_VERSIONS,
  Type,
  type ResponseSchema,
} from './client';
import type { ReviewAnalysis } from './analyzer';
import type { VoiceProfileInput, DraftResult } from './drafter';
import { buildVoiceProfileSection } from './drafter';
import { formatEditsForPrompt, type OwnerEditExample } from './owner-edits';

const draftSchema: ResponseSchema = {
  type: Type.OBJECT,
  properties: {
    draftText: { type: Type.STRING },
    language: { type: Type.STRING, enum: ['ar', 'en', 'mixed'] },
    rationale: { type: Type.STRING, nullable: true },
  },
  required: ['draftText', 'language'],
  propertyOrdering: ['draftText', 'language', 'rationale'],
};

const IMPROVE_SYSTEM_PROMPT = `You revise an existing Google review response according to an OWNER INSTRUCTION.

Your output must be a REWRITE of the original draft — preserve the parts the instruction does not touch. Don't start from scratch; treat the original as a baseline.

You still follow ALL the rules from the original drafter:
- Match the reviewer's language (Arabic / English / mixed). Do NOT change the language unless the owner instruction explicitly asks for it.
- Match the reviewer's register (Gulf casual / MSA / etc.) unless the instruction changes it.
- 2–4 sentences unless the owner asks for more or less.
- No emojis unless the reviewer used them.
- Forbidden phrases — NEVER use these (Arabic):
  "نأسف لسماع ذلك", "ملاحظاتكم القيمة", "نعتذر عن أي إزعاج",
  "نسعى دائمًا لتقديم الأفضل", "نتطلع لخدمتكم", "نضع رضاكم نصب أعيننا",
  "يسرنا تواجدكم معنا", "نعتز بكلماتكم الطيبة", "في أقرب فرصة ممكنة"
- Forbidden phrases (English):
  "We strive to provide the best...", "Thank you for taking the time to...",
  "your valuable feedback", "We appreciate your patience"
- Signoff: keep the original's signoff style unless the owner instruction asks to change it.

If the owner instruction is unclear, contradictory, or would violate the rules above (e.g. "make it longer than 10 sentences" or "use English"), prefer the safer interpretation that stays on-rules.

Return ONLY this JSON:
{
  "draftText": "<the rewritten response>",
  "language": "ar" | "en" | "mixed",
  "rationale": "<one short sentence explaining what you changed>"
}`;

export async function improveDraft(params: {
  originalDraftText: string;
  instruction: string;
  reviewText: string;
  rating: number;
  analysis: ReviewAnalysis;
  voiceProfile: VoiceProfileInput;
  restaurantName: string;
  /** Past owner edits to learn from. Empty/undefined disables the feature. */
  ownerEdits?: OwnerEditExample[];
}): Promise<DraftResult> {
  const voiceSection = buildVoiceProfileSection(params.voiceProfile);

  const userPrompt = `Restaurant: ${params.restaurantName}

${voiceSection}

# Original review (for context)
Rating: ${params.rating}/5
"""
${params.reviewText}
"""

# Analyzer notes
- Language: ${params.analysis.language}${
    params.analysis.dialect ? ` (${params.analysis.dialect})` : ''
  }
- Sentiment: ${params.analysis.sentiment}
- Topics: ${params.analysis.topics.join(', ') || 'none'}
- Issues: ${params.analysis.mentions.issues?.join(', ') || 'none'}

# The current draft (the thing to REWRITE)
"""
${params.originalDraftText}
"""

# Owner instruction
"""
${params.instruction}
"""

Rewrite the draft accordingly. Return JSON only.`;

  const systemPrompt =
    IMPROVE_SYSTEM_PROMPT + formatEditsForPrompt(params.ownerEdits ?? []);

  const result = await generateJSON<{
    draftText: string;
    language: 'ar' | 'en' | 'mixed';
    rationale?: string;
  }>({
    model: MODELS.smart,
    systemPrompt,
    userPrompt,
    maxTokens: 2048,
    temperature: 0.6,
    responseSchema: draftSchema,
  });

  return {
    draftText: result.draftText,
    language: result.language,
    rationale: result.rationale,
    model: MODELS.smart,
    promptVersion: `${PROMPT_VERSIONS.draft}-improve-v1`,
  };
}
