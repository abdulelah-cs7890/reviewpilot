/**
 * Profile tuner: reads the owner's recent edits + their current voice profile,
 * proposes structured changes the owner can apply per-field.
 *
 * One Flash-Lite call. Returns an array of suggestions with rationales.
 * The UI shows them as cards with Apply / Skip buttons.
 */

import { generateJSON, MODELS } from './client';
import type { VoiceProfileInput } from './drafter';
import type { OwnerEditExample } from './owner-edits';

export type ProfileField =
  | 'formality'
  | 'arabicDialect'
  | 'useReligiousPhrases'
  | 'signoff'
  | 'customInstructions';

export interface ProfileSuggestion {
  field: ProfileField;
  currentValue: string;
  proposedValue: string;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

const suggestionSchema = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['formality', 'arabicDialect', 'useReligiousPhrases', 'signoff', 'customInstructions'],
          },
          currentValue: { type: 'string' },
          proposedValue: { type: 'string' },
          rationale: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['field', 'currentValue', 'proposedValue', 'rationale', 'confidence'],
      },
    },
  },
  required: ['suggestions'],
} as const;

const SYSTEM_PROMPT = `You are a voice-profile tuner for a Saudi restaurant's AI reply assistant. You compare:
  1. The restaurant's CURRENT voice profile settings (formality / arabic dialect / religious phrases / signoff / custom instructions)
  2. RECENT OWNER EDITS — pairs of (AI's original draft, owner's revision)

And you propose targeted changes to the voice profile that would make future AI drafts closer to what the owner consistently produces. Output 0–3 suggestions max — only when there's clear evidence.

Field rules:

- "formality" — one of "warm" / "formal" / "casual". Suggest a change only if the owner's edits consistently push toward a different register (e.g. they keep removing formal phrases and adding personal touches → casual).

- "arabicDialect" — one of "gulf" / "msa" / "mixed". Suggest a change only if the owner's edits consistently substitute one dialect for another.

- "useReligiousPhrases" — boolean ("true" / "false" as strings). Suggest only if the owner consistently adds or removes religious phrases (الله يعطيك العافية, إن شاء الله, etc.).

- "signoff" — short text. Suggest a different signoff only if the owner has used a different one consistently in their edits.

- "customInstructions" — a free-form text rule the AI should follow. Use this to capture style preferences that don't fit the structured fields above. Examples: "Always mention specific staff by name when the reviewer mentioned them", "Avoid the phrase 'نسعى دائمًا'", "Sign off with restaurant owner's first name when responding to repeat customers". Keep each instruction concise (one sentence).

Rationale: one sentence citing the EVIDENCE — what pattern you saw in the owner's edits. Avoid vague reasoning.

Confidence:
- "high" when 3+ edits show the same pattern
- "medium" when 2 edits show it
- "low" when only 1 edit hints at it (mention but flag as low)

If the edits don't reveal any consistent pattern (or there are 0 edits), return suggestions: [].

Output JSON only.`;

function formatProfileForPrompt(profile: VoiceProfileInput): string {
  return `Current voice profile:
- formality: ${profile.formality}
- arabicDialect: ${profile.arabicDialect}
- useReligiousPhrases: ${profile.useReligiousPhrases}
- signoff: ${profile.signoff ?? '(none)'}
- customInstructions: ${profile.customInstructions ?? '(none)'}`;
}

function formatEditsForTuner(edits: OwnerEditExample[]): string {
  if (edits.length === 0) return 'No recent owner edits available.';
  return edits
    .map(
      (e, i) => `Edit ${i + 1} (review ${e.rating}★):
- Review: "${e.reviewText}"
- AI original: "${e.originalDraft}"
- Owner edit:  "${e.ownerEdit}"`
    )
    .join('\n\n');
}

export async function tuneVoiceProfile(params: {
  currentProfile: VoiceProfileInput;
  recentEdits: OwnerEditExample[];
}): Promise<ProfileSuggestion[]> {
  const userPrompt = `${formatProfileForPrompt(params.currentProfile)}

Recent owner edits:
${formatEditsForTuner(params.recentEdits)}

Analyze the edits against the current profile. Propose 0–3 voice-profile changes that would make future drafts match the owner's pattern. Return JSON only.`;

  const result = await generateJSON<{ suggestions: ProfileSuggestion[] }>({
    model: MODELS.fast,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 1500,
    temperature: 0.3,
    schema: suggestionSchema,
  });

  return result.suggestions;
}
