/**
 * Gemini provider adapter.
 *
 * Wraps @google/genai behind the project's ModelProvider interface. Two
 * extra responsibilities versus the call into the SDK:
 *
 * 1. Translate plain JSON Schema (the project's new schema format) into
 *    Gemini's Type-enum-based Schema shape.
 * 2. Honor retryDelay parsed from 429 error messages instead of fixed backoff.
 *
 * Reads GEMINI_API_KEY at module load.
 */

import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  GenerateJSONOpts,
  ModelProvider,
  ModelTier,
  StreamTextOpts,
} from '../client';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'gemini-2.5-flash-lite',
  smart: 'gemini-2.5-flash',
};

const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayFromError(err: unknown, attempt: number): number {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  }
  return Math.min(60_000, 1000 * 2 ** attempt);
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429');
}

// Plain JSON Schema → Gemini Schema (Type enum + nullable boolean).
function toGeminiSchema(node: unknown): Schema {
  if (!node || typeof node !== 'object') {
    return { type: Type.STRING };
  }
  const s = node as Record<string, unknown>;

  // Handle "type": ["string", "null"] → string + nullable: true
  let typeStr: string | undefined;
  let nullable = false;
  if (Array.isArray(s.type)) {
    const nonNull = (s.type as string[]).find((t) => t !== 'null');
    nullable = (s.type as string[]).includes('null');
    typeStr = nonNull;
  } else if (typeof s.type === 'string') {
    typeStr = s.type;
  }

  const result: Schema = {} as Schema;

  switch (typeStr) {
    case 'object':
      result.type = Type.OBJECT;
      break;
    case 'array':
      result.type = Type.ARRAY;
      break;
    case 'string':
      result.type = Type.STRING;
      break;
    case 'integer':
      result.type = Type.INTEGER;
      break;
    case 'number':
      result.type = Type.NUMBER;
      break;
    case 'boolean':
      result.type = Type.BOOLEAN;
      break;
    default:
      result.type = Type.STRING;
  }
  if (nullable) result.nullable = true;
  if (Array.isArray(s.enum)) {
    result.enum = s.enum as string[];
  }
  if (typeof s.description === 'string') {
    result.description = s.description;
  }
  if (s.properties && typeof s.properties === 'object') {
    const props: Record<string, Schema> = {};
    for (const [k, v] of Object.entries(s.properties as Record<string, unknown>)) {
      props[k] = toGeminiSchema(v);
    }
    result.properties = props;
  }
  if (Array.isArray(s.required)) {
    result.required = s.required as string[];
  }
  if (s.items) {
    result.items = toGeminiSchema(s.items);
  }
  return result;
}

async function callGemini(opts: GenerateJSONOpts, asJSON: boolean): Promise<string> {
  if (!ai) throw new Error('GEMINI_API_KEY not set');
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const config: Record<string, unknown> = {
        systemInstruction: opts.systemPrompt,
        maxOutputTokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? (asJSON ? 0.3 : 0.7),
      };
      if (asJSON) {
        config.responseMimeType = 'application/json';
        if (opts.schema) {
          config.responseSchema = toGeminiSchema(opts.schema);
        }
      }
      const response = await ai.models.generateContent({
        model: MODEL_MAP[opts.model],
        contents: opts.userPrompt,
        config,
      });
      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
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

async function generateJSON<T>(opts: GenerateJSONOpts): Promise<T> {
  const text = await callGemini(opts, true);
  const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse Gemini JSON: ${cleaned.slice(0, 200)}...`);
  }
}

async function* streamText(opts: StreamTextOpts): AsyncGenerator<{ text: string }> {
  if (!ai) throw new Error('GEMINI_API_KEY not set');
  const streamResp = await ai.models.generateContentStream({
    model: MODEL_MAP[opts.model],
    contents: opts.userPrompt,
    config: {
      systemInstruction: opts.systemPrompt,
      maxOutputTokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
    },
  });
  for await (const chunk of streamResp) {
    if (chunk.text) yield { text: chunk.text };
  }
}

export const geminiAdapter: ModelProvider = {
  name: 'gemini',
  generateJSON,
  streamText,
};
