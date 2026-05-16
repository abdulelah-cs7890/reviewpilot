# ReviewPilot

**AI-drafted Google review responses for Saudi restaurants — in the reviewer's language and the restaurant's voice.**

Reviews come in Arabic (Gulf or MSA), English, or code-switched. ReviewPilot reads each review, drafts a culturally-correct reply that **matches the reviewer's dialect and the restaurant's tone profile**, and gives the owner an inbox where they edit, copy, and mark-as-responded in seconds.

![Inbox screenshot](public/screenshots/inbox.png)

---

## ➡️ Try the live demo

**[reviewpilot.vercel.app](https://reviewpilot.vercel.app)** — click "Try the demo" on the login page. No signup, no setup. You'll land in a pre-seeded restaurant with 8 real-feel reviews already analyzed and draft replies ready to copy.

---

## What's built

| Surface | What it does |
|---|---|
| **Landing** (`/`, `/en`) | Bilingual (Arabic primary, English at `/en`) with waitlist form |
| **Auth** | BetterAuth magic-link via Resend (console-fallback in dev) + a portfolio-only "demo mode" cookie for visitors |
| **Onboarding** | Voice profile picker — formality, dialect, religious phrases, signoff |
| **Inbox** | RTL-first list, urgency-first sort, chip filters by urgency / sentiment / language / status |
| **Detail view** | Review + AI analysis tags + editable draft + copy to clipboard + mark-as-responded |
| **Regenerate** | Second AI call at higher temperature → alternative draft you can switch to |
| **AI quality check** | Third AI call after each draft scores it against each issue the reviewer raised (✓/✗ per issue, 0–100 overall) |
| **Manual paste** | Drop a review text in, get analysis + draft + quality check in ~10–15s |
| **Settings** | Edit the voice profile after onboarding; new drafts pick up the new voice |
| **Dashboard** | Sentiment-over-time line chart, topic×sentiment heatmap, urgency split, response-rate stat |

## Architecture

```
                ┌──────────────────────┐
   Reviewer ───►│  Next.js App Router  │
                │  (RTL-first, server- │
                │   actions for writes)│
                └──┬──────────────┬────┘
                   │              │
                   ▼              ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ Gemini Flash-Lite│  │ Gemini Flash    │
        │  (analyzer:     │  │  (drafter:      │
        │   sentiment,    │  │   in-voice      │
        │   topics,       │  │   reply, typed  │
        │   urgency,      │  │   responseSchema)│
        │   typed schema) │  │                 │
        └────────┬────────┘  └────────┬────────┘
                 │                    │
                 ▼                    ▼
              ┌──────────────────────────┐
              │  Drizzle ORM             │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  Neon Postgres (free)    │
              └──────────────────────────┘

Auth path (parallel):
  Email → BetterAuth magic-link → Resend (or console in dev)
  Demo button → signed cookie → seeded demo user (portfolio shim)
```

Every AI call goes through one file (`src/ai/client.ts`) — swap providers by changing that file. The two prompts (`src/ai/analyzer.ts`, `src/ai/drafter.ts`) carry all of the Saudi-specific logic: dialect detection rules, forbidden-phrase list in both English (`"We strive to..."`) and Arabic (`"نسعى دائمًا..."`, `"ملاحظاتكم القيمة"`), register-matching, signoff-language matching.

## Interesting AI choices

- **Two-tier model pipeline.** Flash-Lite for cheap fast analysis (sentiment / topics / urgency), Flash for drafts where quality matters. Both use Gemini's typed `responseSchema` so the model can't invent fields.
- **Reviewer-register matching, not restaurant-register matching.** A doctor writing formal MSA gets a formal MSA reply, even if the restaurant's profile says Gulf casual. Same rule for code-switched reviewers — the draft mirrors their mix.
- **Forbidden phrases.** Both English and Arabic AI clichés are explicitly blocked (`"We strive to provide..."`, `"Thank you for taking the time..."`, `"نسعى دائمًا"`, `"ملاحظاتكم القيمة"`, `"نتطلع لخدمتكم"`). Found and added these through iteration on real sample reviews.
- **Signoff language matching.** Voice profile signoff is `"إدارة المطعم"` by default — for English responses the drafter translates it to `"Restaurant management"` rather than producing a half-Arabic-half-English close.
- **Sample-driven prompt iteration.** [`samples/reviews.ts`](samples/reviews.ts) holds 25 realistic Saudi reviews (Gulf rave, hygiene complaint with regulator threat, delivery-app context, prayer-time issue, allergy reaction, expat writing English, formal sheikh, code-switched). `npm run ai:test` runs the engine against all of them.
- **Retry/backoff that honors Gemini's `retryDelay`** in 429 errors, instead of fixed exponential. Cuts wasted wait time when the API tells us exactly how long.
- **AI quality-check meta-grading.** After the drafter produces a response, a third Flash-Lite call grades the draft against each concrete issue the reviewer raised — does the draft acknowledge the cold food, the 90-minute delay, the rude staff? Stored alongside the draft and rendered inline as ✓/✗ per issue. Failure-tolerant: if the check 429s or fails to parse, the draft still saves and the UI hides the card. See `src/ai/quality.ts`.

## Run locally

```bash
git clone https://github.com/abdulelah-cs7890/reviewpilot
cd reviewpilot
npm install

# Copy env template and fill in your keys
cp .env.example .env.local
# At minimum, set GEMINI_API_KEY (free at aistudio.google.com/apikey)
# and DATABASE_URL (free at neon.tech)

npm run db:generate
npm run db:migrate
npm run db:seed      # creates the demo restaurant with 8 pre-analyzed reviews
npm run dev          # http://localhost:3000
```

Then click "Try the demo" on `/login` to skip the email step.

To exercise the AI engine directly without the UI:

```bash
npm run ai:test                          # all 25 sample reviews, warm voice profile
npm run ai:test -- --id=urgent-hygiene   # one specific review
npm run ai:test -- --profile=formal      # change voice profile
```

## Tech

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS**
- **Drizzle ORM** on **Neon Postgres** (free tier)
- **BetterAuth** with magic-link plugin + Resend
- **Gemini Flash-Lite** (analyzer) + **Gemini Flash** (drafter) via `@google/genai`, typed `responseSchema`
- **Zod** for server-action input validation
- **IBM Plex Sans Arabic** + **Inter** via `next/font`

## What's deferred (intentionally)

This is a portfolio project, not a real launch. The original product story includes integrations that need paid infra or business-identity verification — those are scoped out and documented as future work:

- **Google Business Profile API** integration (manual paste is the v1 review source; the schema already supports a `source: 'google'` enum value for narrative continuity)
- **WhatsApp Cloud API** daily digest (Meta Business verification is a 1–2 week dance)
- **Inngest background jobs** (manual paste fires the analyze+draft inline from the server action; ~6–10s is fine for a demo)
- **Real email digests** via Resend (the magic-link sender exists; periodic digests don't)
- **Multi-user / teams** — the schema models 1 user → 1 restaurant
- **Provider migration** — `src/ai/client.ts` is a one-file swap to Groq / Cohere / local Ollama if Gemini quotas ever bite. Not switched today because Gemini's Gulf-dialect quality is the validated baseline.

## Quota note

Gemini free tier is **20 requests/model/day** as of 2026-05-15. The demo button + seeded reviews use **zero** API calls so visitors can explore freely. Manual-paste and regenerate use ~2 calls each; if the daily quota hits, those flows surface a friendly Arabic "demo at capacity, try tomorrow" message instead of crashing.

## Notes for portfolio reviewers

- **The "demo mode" button is a deliberate shim** for portfolio reviewers — it's a signed cookie that bypasses the magic-link flow so you can explore without setting up email. In a real production deployment this would not exist; only the magic-link path would. See `src/lib/auth-utils.ts` for the implementation + the comment block explaining the trade-off.
- **The provider abstraction in `src/ai/client.ts`** was built on purpose — the original prompt iteration was against Claude, and the swap to Gemini was a one-file change. The abstraction stays as a hedge against rate-limit or quality changes from either vendor.
- **Sample reviews are deliberately diverse** — not just to look impressive but because each one exposes a real failure mode (dialect misclassification, signoff language mismatch, urgent-vs-medium scoring on allergy complaints). The `samples/reviews.ts` file is the source of truth for prompt iteration.

---

*Built solo as a portfolio project. Not affiliated with any restaurant or restaurant tech company.*
