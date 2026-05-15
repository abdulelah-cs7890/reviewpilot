/**
 * Provider abstraction.
 *
 * Why this exists: we're using Gemini free tier to start. When we have paying
 * customers, we may want to switch to Claude for better Arabic quality, or
 * route different tasks to different providers (e.g. Claude for drafts,
 * Gemini for cheap classification).
 *
 * Every AI call in this codebase goes through generateJSON or generateText
 * below. To swap providers, change ONE file.
 */

import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Bump prompt versions when prompts change materially — used for tracking
// which drafts came from which iteration of the prompt.
export const PROMPT_VERSIONS = {
  analyze: 'analyze-v1',
  draft: 'draft-v1',
  digest: 'digest-v1',
} as const;

// Two-model pipeline:
// - Flash-Lite for cheap, high-volume analysis (sentiment/topics/urgency)
// - Flash for response drafting where quality matters more
export const MODELS = {
  fast: 'gemini-2.5-flash-lite',
  smart: 'gemini-2.5-flash',
} as const;

export type ModelName = (typeof MODELS)[keyof typeof MODELS];

interface GenerateOptions {
  model: ModelName;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

// Gemini free tier rate limits are tight (gemini-2.5-flash is 5 RPM).
// When we hit 429, the API returns a retryDelay we should honor — much better
// than fixed exponential backoff because it tells us the exact wait.
const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Parse the retryDelay (e.g. "37s") from a 429 error. Falls back to a default.
function retryDelayFromError(err: unknown, attempt: number): number {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500; // +500ms safety buffer
  }
  return Math.min(60_000, 1000 * 2 ** attempt); // exponential fallback, cap 60s
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429');
}

async function callGemini(opts: GenerateOptions, asJSON: boolean): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: opts.model,
        contents: opts.userPrompt,
        config: {
          systemInstruction: opts.systemPrompt,
          maxOutputTokens: opts.maxTokens ?? 2048,
          temperature: opts.temperature ?? (asJSON ? 0.3 : 0.7),
          ...(asJSON ? { responseMimeType: 'application/json' } : {}),
        },
      });
      const text = response.text;
      if (!text) {
        throw new Error('Empty response from model');
      }
      return text;
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = retryDelayFromError(err, attempt);
      console.warn(`   ⏳ rate limited, waiting ${(delay / 1000).toFixed(1)}s before retry (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Generate plain text from the model.
 */
export async function generateText(opts: GenerateOptions): Promise<string> {
  return callGemini(opts, false);
}

/**
 * Generate and parse a JSON response. The system prompt MUST instruct the
 * model to output JSON only. responseMimeType=application/json forces this
 * server-side. We still strip markdown fences defensively.
 */
export async function generateJSON<T>(opts: GenerateOptions): Promise<T> {
  const text = await callGemini(opts, true);
  const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`Failed to parse JSON output: ${cleaned.slice(0, 200)}...`);
  }
}
