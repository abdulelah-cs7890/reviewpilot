# ReviewPilot — Benchmark results

This file accumulates results from running the AI pipeline against the golden set in `samples/reviews.ts`. Each section is one `npm run benchmark` invocation.

**What's scored:**
- `language`: exact match against expected
- `dialect`: exact match when applicable (only for Arabic samples)
- `sentiment`: scored value within the documented range (e.g. expected `-2..-1` accepts -2 or -1)
- `urgency` / `severity`: exact match
- `topics`: at least one expected substring appears in the analyzer's emitted topic list (substring, case-insensitive)
- `quality`: 0–100 from the meta-grader (compares the generated draft against the original review)

**Tolerances are deliberate** — Gemini outputs vary between runs. Sentiment ranges and topic-substring matching reduce false negatives without letting through wrong classifications.


## Run — 2026-05-17T09:27:19.346Z

**Samples:** 2 · **Models:** `gemini-2.5-flash-lite` (analyzer + quality), `gemini-2.5-flash` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-rave-1` | ✓ ar | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `gulf-complaint-mild` | ✓ ar | ✓ 0 (exp -1..0) | ✓ medium | ✓ direct_reply | ✓ | 95 |

**Aggregate:** language 2/2 · sentiment 2/2 · urgency 2/2 · severity 2/2 · topics 2/2 · dialect 2/2 · quality mean 95 / min 95

<details><summary>Draft excerpts</summary>

- `gulf-rave-1` (ar): يا هلا والله فيك أخوي فهد، كلامك هذا يسعدنا كثير ويشجعنا. ونفرح إن الكبسة عجبتك، وخدمتنا كانت سريعة 
- `gulf-complaint-mild` (ar): أهلاً سارة، يسعدنا إن الأكل أعجبك. نعتذر جداً على طول فترة الانتظار اللي صارت ٤٥ دقيقة، وهذا الشيء م

</details>
