/**
 * Groq provider adapter.
 *
 * Truly-free tier with ~14k RPD on Llama 3.3 70B. No credit card needed.
 * OpenAI-compatible API — uses groq-sdk under the hood.
 *
 * JSON via tool/function calling: define one function whose `parameters` is
 * the caller's JSON Schema, force `tool_choice` to that function. The model
 * fills the function args, we return them as the typed response.
 *
 * Streaming uses standard OpenAI-style chunk events.
 *
 * Reads GROQ_API_KEY at module load.
 */

import Groq from 'groq-sdk';
import type {
  GenerateJSONOpts,
  ModelProvider,
  ModelTier,
  StreamTextOpts,
} from '../client';

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

// Both tiers use the 70B model for now. The 8B instant model is much faster
// but lower quality on Gulf Arabic — defer to a later tier-split if needed.
const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'llama-3.3-70b-versatile',
  smart: 'llama-3.3-70b-versatile',
};

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { status?: number };
    if (e.status === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.includes('rate_limit');
}

function retryDelayMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** attempt);
}

async function generateJSON<T>(opts: GenerateJSONOpts): Promise<T> {
  if (!groq) throw new Error('GROQ_API_KEY not set');
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resp = await groq.chat.completions.create({
        model: MODEL_MAP[opts.model],
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.3,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'emit_response',
              description: 'Emit the structured response.',
              parameters: opts.schema as Record<string, unknown>,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'emit_response' } },
      });
      const choice = resp.choices[0];
      const toolCall = choice?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error('No function tool_call in Groq response');
      }
      const args = toolCall.function.arguments;
      try {
        return JSON.parse(args) as T;
      } catch {
        throw new Error(`Failed to parse Groq tool_call args: ${args.slice(0, 200)}...`);
      }
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = retryDelayMs(attempt);
      console.warn(`   ⏳ Groq rate limited, waiting ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function* streamText(opts: StreamTextOpts): AsyncGenerator<{ text: string }> {
  if (!groq) throw new Error('GROQ_API_KEY not set');
  const stream = await groq.chat.completions.create({
    model: MODEL_MAP[opts.model],
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    stream: true,
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield { text };
  }
}

export const groqAdapter: ModelProvider = {
  name: 'groq',
  generateJSON,
  streamText,
};
