/**
 * Provider abstraction.
 *
 * All AI calls in this codebase go through generateJSON or streamText below.
 * The underlying provider (Anthropic Haiku or Gemini Flash) is selected via
 * the AI_PROVIDER env var, or implicitly by which API key is set.
 *
 * To swap providers, change AI_PROVIDER. To add a new provider, add an
 * adapter file under src/ai/providers/ implementing ModelProvider.
 */

export type ModelTier = 'fast' | 'smart';

export interface GenerateJSONOpts {
  model: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  schema: object;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamTextOpts {
  model: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export type ProviderName = 'anthropic' | 'gemini' | 'groq';

export interface ModelProvider {
  name: ProviderName;
  generateJSON<T>(opts: GenerateJSONOpts): Promise<T>;
  streamText(opts: StreamTextOpts): AsyncGenerator<{ text: string }>;
}

// Bump when prompts change materially — surfaces in drafts.promptVersion so we
// know which iteration of the prompt produced which draft.
export const PROMPT_VERSIONS = {
  analyze: 'analyze-v1',
  draft: 'draft-v1',
  digest: 'digest-v1',
} as const;

// Tier names used by call sites. Each adapter resolves to its provider's
// concrete model id.
export const MODELS = {
  fast: 'fast',
  smart: 'smart',
} as const;

let cachedProvider: ModelProvider | null = null;

export function getProvider(): ModelProvider {
  if (cachedProvider) return cachedProvider;

  const explicit = process.env.AI_PROVIDER;
  const haveAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const haveGemini = !!process.env.GEMINI_API_KEY;
  const haveGroq = !!process.env.GROQ_API_KEY;

  let choice: ProviderName | null = null;
  if (explicit === 'anthropic' || explicit === 'gemini' || explicit === 'groq') {
    choice = explicit;
  } else if (haveGroq) {
    // Default to Groq when available: truly free tier, no card needed.
    choice = 'groq';
  } else if (haveAnthropic) {
    choice = 'anthropic';
  } else if (haveGemini) {
    choice = 'gemini';
  }

  if (!choice) {
    throw new Error(
      'No AI provider configured. Set GROQ_API_KEY (recommended), ANTHROPIC_API_KEY, or GEMINI_API_KEY.'
    );
  }

  // Lazy-load the adapter so the unselected provider's SDK never initializes
  // (avoids errors when only one key is set).
  if (choice === 'anthropic') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedProvider = require('./providers/anthropic').anthropicAdapter as ModelProvider;
  } else if (choice === 'groq') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedProvider = require('./providers/groq').groqAdapter as ModelProvider;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedProvider = require('./providers/gemini').geminiAdapter as ModelProvider;
  }
  return cachedProvider;
}

export function generateJSON<T>(opts: GenerateJSONOpts): Promise<T> {
  return getProvider().generateJSON<T>(opts);
}

export function streamText(opts: StreamTextOpts): AsyncGenerator<{ text: string }> {
  return getProvider().streamText(opts);
}

/**
 * Returns the active provider's name. Used by the benchmark renderer.
 */
export function getProviderName(): ProviderName {
  return getProvider().name;
}
