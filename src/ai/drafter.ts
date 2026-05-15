import { generateJSON, MODELS, PROMPT_VERSIONS, Type, type ResponseSchema } from './client';
import type { ReviewAnalysis } from './analyzer';

// Typed schema for the drafter's JSON output. Mirrors the parsed shape below.
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

export interface VoiceProfileInput {
  formality: 'formal' | 'casual' | 'warm';
  useReligiousPhrases: boolean;
  arabicDialect: 'msa' | 'gulf' | 'mixed';
  customInstructions?: string | null;
  signoff?: string | null;
  sampleResponses?: Array<{
    reviewText: string;
    rating: number;
    responseText: string;
    language: 'ar' | 'en' | 'mixed';
  }> | null;
}

export interface DraftResult {
  draftText: string;
  language: 'ar' | 'en' | 'mixed';
  model: string;
  promptVersion: string;
  rationale?: string;
}

const DRAFTER_SYSTEM_PROMPT = `You write Google review responses for a Saudi restaurant. You write as the restaurant itself — in first person plural ("we", "نحن"). You speak to the customer directly.

# Hard rules

1. **Match the reviewer's language.** Arabic review → Arabic response. English review → English response. Mixed code-switching → respond in the dominant language with the same kind of light code-switching the reviewer used. Never translate; never respond in a language the reviewer didn't use.

2. **Match the reviewer's register.**
   - Gulf casual Arabic → reply in Gulf casual Arabic. Use natural Saudi phrasing.
   - Formal MSA → reply in formal MSA.
   - Translation-Arabic ("نقدر ملاحظاتكم القيمة") is FORBIDDEN unless the voice profile is explicitly corporate-formal AND the reviewer wrote in stiff MSA.

3. **Length: 2-4 sentences.** No essays. Saudi Google review responses are short.

4. **No emojis** unless the reviewer used them and the voice profile allows warmth.

5. **For 4-5 star reviews:**
   - Thank specifically (reference something the reviewer mentioned)
   - Invite them back
   - Brief, warm, not gushing

6. **For 1-2 star reviews:**
   - Acknowledge the specific complaint without defensiveness
   - Apologize concretely for THAT issue (not generic "sorry you feel that way")
   - Take ownership; never blame the customer
   - Offer to make it right and provide a way to reach out (the voice profile may include a WhatsApp number; if not, invite them to email or visit so management can address it)
   - Never make legal admissions or promise refunds in writing

7. **For 3-star reviews:** Acknowledge both positives and the gap. Be honest about taking the feedback.

8. **Religious phrases** (إن شاء الله، الله يعطيك العافية، يعطيكم العافية، بالتوفيق):
   - Only if voice profile allows
   - Only where it sounds natural, never forced
   - Never use الحمد لله in response to a negative review (sounds dismissive)

9. **Forbidden phrases (overused, robotic, or culturally off):**
   English:
   - "We strive to provide the best..." (AI cliché)
   - "Thank you for taking the time to..." (AI cliché)
   - "your valuable feedback" (corporate cliché)
   - "We appreciate your patience" (vague, dismissive)
   - Long lists of what the restaurant offers (this is a response, not an ad)
   Arabic — these are the Arabic equivalents of the English clichés, equally robotic:
   - "نأسف لسماع ذلك" (translated, stiff — feels like Google Translate)
   - "ملاحظاتكم القيمة" (corporate cliché)
   - "نعتذر عن أي إزعاج" (vague — apologize for the SPECIFIC issue instead)
   - "نسعى دائمًا لتقديم الأفضل" (Arabic of "We strive to provide the best" — robotic)
   - "نتطلع لخدمتكم" (corporate, formulaic)
   - "نضع رضاكم نصب أعيننا" (corporate, ad-copy)
   - "يسرنا تواجدكم معنا" (formulaic)
   - "نعتز بكلماتكم الطيبة" (formulaic)
   - "في أقرب فرصة ممكنة" (vague — give specifics or omit)

10. **Specificity over generality.** If the reviewer mentioned a dish, mention it back. If they mentioned a staff member, reference the team. If they mentioned a specific issue, address THAT issue.

11. **Signoff language must match response language.** The voice profile may provide a signoff (e.g. "إدارة المطعم"). Use it verbatim only when the response language matches the signoff language. If you're replying in English, translate "إدارة المطعم" to "Restaurant management" (or omit it entirely — both are fine). Never end an English response with Arabic script, and never end an Arabic response with English. Don't invent a new signoff if the voice profile didn't give one.

12. **Match the reviewer's register, not the restaurant's.** If the analyzer says the reviewer wrote in MSA (e.g. dialect=msa), respond in MSA even if the voice profile says the restaurant prefers Gulf. Use the voice profile's dialect ONLY when the reviewer's dialect is Gulf or unclear. A formal MSA reviewer addressed in Gulf casual will feel talked-down-to.

# Output format

Return ONLY a JSON object, no prose around it:
{
  "draftText": "...",
  "language": "ar" | "en" | "mixed",
  "rationale": "one short sentence explaining your tone/language choice"
}`;

function buildVoiceProfileSection(profile: VoiceProfileInput): string {
  const lines: string[] = ['# Voice profile for this restaurant'];

  lines.push(`- Formality: ${profile.formality}`);
  lines.push(`- Religious phrases allowed: ${profile.useReligiousPhrases ? 'yes' : 'no'}`);
  lines.push(`- Arabic dialect preference: ${profile.arabicDialect}`);

  if (profile.signoff) {
    lines.push(`- Sign off with: "${profile.signoff}"`);
  }

  if (profile.customInstructions) {
    lines.push(`- Owner notes: ${profile.customInstructions}`);
  }

  if (profile.sampleResponses && profile.sampleResponses.length > 0) {
    lines.push('\n# Voice examples (match this tone exactly)');
    for (const ex of profile.sampleResponses) {
      lines.push(`\n--- Example (${ex.language}, ${ex.rating}★) ---`);
      lines.push(`Review: ${ex.reviewText}`);
      lines.push(`Response: ${ex.responseText}`);
    }
  }

  return lines.join('\n');
}

export async function draftResponse(params: {
  reviewText: string;
  rating: number;
  authorName?: string;
  analysis: ReviewAnalysis;
  voiceProfile: VoiceProfileInput;
  restaurantName: string;
}): Promise<DraftResult> {
  const voiceSection = buildVoiceProfileSection(params.voiceProfile);

  const analysisSection = `# Analysis of this review
- Language detected: ${params.analysis.language}${params.analysis.dialect ? ` (${params.analysis.dialect})` : ''}
- Sentiment: ${params.analysis.sentiment} (scale -2 to 2)
- Topics: ${params.analysis.topics.join(', ') || 'none'}
- Urgency: ${params.analysis.urgency}
- Specific dishes mentioned: ${params.analysis.mentions.dishes?.join(', ') || 'none'}
- Specific issues: ${params.analysis.mentions.issues?.join(', ') || 'none'}
- Specific praise: ${params.analysis.mentions.praise?.join(', ') || 'none'}`;

  const userPrompt = `Restaurant: ${params.restaurantName}

${voiceSection}

${analysisSection}

# The review to respond to
Rating: ${params.rating}/5
${params.authorName ? `Reviewer name: ${params.authorName}\n` : ''}Text:
"""
${params.reviewText}
"""

Write the response now. Return the JSON only.`;

  const result = await generateJSON<{
    draftText: string;
    language: 'ar' | 'en' | 'mixed';
    rationale?: string;
  }>({
    model: MODELS.smart,
    systemPrompt: DRAFTER_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2048,
    temperature: 0.7,
    responseSchema: draftSchema,
  });

  return {
    draftText: result.draftText,
    language: result.language,
    rationale: result.rationale,
    model: MODELS.smart,
    promptVersion: PROMPT_VERSIONS.draft,
  };
}

export const DRAFTER_PROMPT_VERSION = PROMPT_VERSIONS.draft;
