/**
 * Reply policy generator: reads N (review, final-draft) pairs from the
 * restaurant's history and extracts the implicit response policies the
 * owner is following. Returns 3–6 structured policies that the owner can
 * inspect + selectively save into voice profile customInstructions.
 *
 * One Flash-Lite call. Output schema is strict.
 */

import {
  generateJSON,
  MODELS,
  Type,
  type ResponseSchema,
} from './client';

export interface PolicyExample {
  reviewText: string;
  rating: number;
  language: 'ar' | 'en' | 'mixed';
  finalDraftText: string;
}

export interface ReplyPolicy {
  scenario: string;
  conditions: string;
  actions: string[];
  evidenceCount: number;
}

const policySchema: ResponseSchema = {
  type: Type.OBJECT,
  properties: {
    policies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          conditions: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidenceCount: { type: Type.INTEGER },
        },
        required: ['scenario', 'conditions', 'actions', 'evidenceCount'],
        propertyOrdering: ['scenario', 'conditions', 'actions', 'evidenceCount'],
      },
    },
  },
  required: ['policies'],
  propertyOrdering: ['policies'],
};

const SYSTEM_PROMPT = `You analyze a restaurant owner's actual review-response history and extract the implicit POLICIES they follow when replying.

Input: a list of (customer review, restaurant's final reply) pairs.

Your job: spot recurring patterns and turn them into 3–6 named policies. Each policy describes:
- "scenario": a one-line label like "1-2★ delivery complaints" or "5★ rave with specific dish mentioned"
- "conditions": when this policy applies (one sentence — e.g. "Reviewer mentions a delivery-related issue (late, missing items, undercooked) and rating ≤ 2")
- "actions": the concrete things the owner does in these cases — bullet-style. Examples:
  - "Apologize specifically for the issue mentioned"
  - "Offer WhatsApp follow-up at 0500000000"
  - "Mention the chef's name when possible"
  - "Stay in Gulf casual Arabic"
- "evidenceCount": how many examples in the input support this policy

Rules:
- Only include policies with at least 2 supporting examples. Skip one-off patterns.
- Policies should be ACTIONABLE — things a draft writer could literally do. Avoid vague platitudes.
- Don't restate the obvious ("reply in Arabic when reviewer writes Arabic" is already a base rule — skip).
- Prefer policies that capture the owner's PERSONALITY: how they apologize, what they offer, which staff they name, how formal they get.
- If the input has fewer than 5 examples, return at most 2 policies.

Output JSON only, no prose.`;

function formatExamplesForPrompt(examples: PolicyExample[]): string {
  return examples
    .map(
      (e, i) => `Example ${i + 1} (${e.rating}★, ${e.language}):
- Review: "${e.reviewText}"
- Owner's reply: "${e.finalDraftText}"`
    )
    .join('\n\n');
}

export async function generatePolicies(params: {
  examples: PolicyExample[];
}): Promise<ReplyPolicy[]> {
  if (params.examples.length < 2) return [];

  const userPrompt = `Here are ${params.examples.length} (review, owner's reply) pairs from this restaurant:

${formatExamplesForPrompt(params.examples)}

Extract the implicit reply policies. Return JSON only.`;

  const result = await generateJSON<{ policies: ReplyPolicy[] }>({
    model: MODELS.fast,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2048,
    temperature: 0.3,
    responseSchema: policySchema,
  });

  return result.policies;
}
