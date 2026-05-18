/**
 * Anthropic Claude provider adapter.
 *
 * JSON via tool-use: we define one tool whose input_schema is the caller's
 * JSON Schema and force tool_choice to that tool. The model's tool_use block's
 * `input` field is the parsed structured response.
 *
 * Streaming uses messages.stream() and translates content_block_delta events
 * into the project's common { text } chunk shape.
 *
 * Reads ANTHROPIC_API_KEY at module load.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerateJSONOpts,
  ModelProvider,
  ModelTier,
  StreamTextOpts,
} from '../client';

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// Both tiers map to Haiku 4.5 in Phase 11. We could split smart → Sonnet later.
const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'claude-haiku-4-5-20251001',
  smart: 'claude-haiku-4-5-20251001',
};

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; error?: { type?: string } };
    if (e.status === 429) return true;
    if (e.error?.type === 'rate_limit_error') return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.includes('rate_limit');
}

function retryDelayMs(err: unknown, attempt: number): number {
  // Anthropic sometimes returns retry-after header; SDK surfaces as err.headers
  if (err && typeof err === 'object' && 'headers' in err) {
    const h = (err as { headers?: Record<string, string> }).headers;
    const ra = h?.['retry-after'];
    if (ra && !isNaN(Number(ra))) {
      return Math.ceil(Number(ra) * 1000) + 500;
    }
  }
  return Math.min(30_000, 1000 * 2 ** attempt);
}

async function generateJSON<T>(opts: GenerateJSONOpts): Promise<T> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not set');
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: MODEL_MAP[opts.model],
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.3,
        system: opts.systemPrompt,
        messages: [{ role: 'user', content: opts.userPrompt }],
        tools: [
          {
            name: 'emit_response',
            description: 'Emit the structured response.',
            input_schema: opts.schema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: 'emit_response' },
      });
      const toolUse = resp.content.find((b) => b.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new Error('No tool_use block in Anthropic response');
      }
      return toolUse.input as T;
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = retryDelayMs(err, attempt);
      console.warn(`   ⏳ Anthropic rate limited, waiting ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function* streamText(opts: StreamTextOpts): AsyncGenerator<{ text: string }> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not set');
  const stream = anthropic.messages.stream({
    model: MODEL_MAP[opts.model],
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userPrompt }],
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield { text: event.delta.text };
    }
  }
}

export const anthropicAdapter: ModelProvider = {
  name: 'anthropic',
  generateJSON,
  streamText,
};
