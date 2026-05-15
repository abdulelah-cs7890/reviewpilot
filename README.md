# ReviewPilot

**AI review response drafts for Saudi restaurants — in their actual voice, in their actual dialect.**

Most Riyadh restaurants live and die by their Google reviews, but the existing tools (Birdeye, Podium, even Google's auto-suggestions) butcher Gulf Arabic and produce robotic translation-Arabic that no Saudi customer would accept. ReviewPilot reads each review, drafts a culturally-correct response in the same language and register, and lets the owner approve it in seconds.

---

## Why this exists

Google Maps reviews are the single biggest driver of foot traffic for independent Saudi restaurants. The owner-side reality:

- Reviews arrive in Saudi/Gulf Arabic, English, and code-switched mixes
- Owners are busy and respond inconsistently or not at all
- Generic review tools were built for the US market and produce stiff, translated-feeling Arabic
- A bad public response can do more damage than no response

ReviewPilot is built for this specific gap. One restaurant, one inbox, one tap to approve.

## What it does

- **Pulls reviews** from Google Business Profile (or weekly scrape as fallback)
- **Analyzes** each review for sentiment, topics, urgency, and language
- **Drafts** a response in the same language and register as the review — Gulf casual stays Gulf casual; formal MSA stays formal MSA; code-switched English-Arabic stays code-switched
- **Voice profile** built in 60 seconds from sample responses the owner picks
- **Daily WhatsApp digest** with everything that came in overnight, drafts pre-generated

## Interesting engineering decisions

### Dialect-aware prompting, not fine-tuning
Saudi/Gulf Arabic data is scarce and noisy. Instead of fine-tuning, ReviewPilot uses carefully-engineered system prompts plus restaurant-specific few-shot examples picked during onboarding. This gets a usable voice in 60 seconds instead of weeks of training data collection.

### Two-model pipeline
- Gemini 2.5 Flash-Lite for review analysis (sentiment, topics, urgency, language) — cheap, fast, runs on every new review
- Gemini 2.5 Flash for response drafting — quality matters here

Splitting these keeps cost minimal (free tier covers ~125 fully-processed reviews/day) while keeping draft quality high. The provider abstraction makes it easy to swap to Claude Sonnet for production-grade Arabic quality.

### Voice profile via sample selection
Asking an owner to write brand guidelines doesn't work — you get something unusable. Asking them to pick 2-3 sample responses that feel like their brand gets you a usable system prompt addendum in under a minute. The selected samples become few-shot examples in every draft.

### Forbidden phrase list
The system prompt explicitly bans the most common AI-translation tells in Arabic ("نقدر ملاحظاتكم القيمة", "نأسف لسماع ذلك") and the most common AI-English tells ("We strive to provide...", "Thank you for taking the time..."). This single constraint did more for output quality than any other prompt tweak.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres on Neon + Drizzle ORM
- **Gemini API** (free tier for dev, easy swap to Claude for production)
- BetterAuth
- Inngest for background jobs
- WhatsApp Cloud API for daily digest
- Tailwind + shadcn/ui with RTL support
- Vercel

The AI layer is built with a provider abstraction (`src/ai/client.ts`) so the
LLM provider can be swapped in one file. Currently using Gemini 2.5 Flash for
drafts and Flash-Lite for analysis. Swap to Claude when budget allows for
better Arabic quality.

## Local development

```bash
# Install
npm install

# Set up env (copy .env.example to .env.local and fill in)
cp .env.example .env.local

# Run prompt iteration loop — this is the core dev tool
npm run ai:test                       # run all sample reviews
npm run ai:test -- --id=gulf-angry    # just one
npm run ai:test -- --profile=formal   # try a different voice profile

# Database
npm run db:generate    # generate migrations from schema
npm run db:migrate     # apply migrations
npm run db:studio      # browse data

# Dev server
npm run dev
```

## Project structure

```
src/
  ai/              # the prompt engine — the heart of the product
    client.ts      # Anthropic client + model + version constants
    analyzer.ts    # sentiment + topics + urgency + language detection
    drafter.ts    # response draft generation (the headline feature)
  db/              # Drizzle schema + client
  app/             # Next.js routes
  components/
  inngest/         # background jobs
samples/           # realistic Saudi review samples for prompt iteration
scripts/           # CLI tooling (test-ai.ts, seed.ts)
```

## Status

In active development. See [docs/roadmap.md](docs/roadmap.md) for the launch plan.
