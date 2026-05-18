# ReviewPilot — Benchmark results

This file accumulates results from running the AI pipeline against the golden set in `samples/reviews.ts`. Each section is one `npm run benchmark` invocation.

**What's scored:**
- `language`: exact match against expected
- `dialect`: exact match when applicable (only for Arabic samples)
- `sentiment`: scored value within the documented range (e.g. expected `-2..-1` accepts -2 or -1)
- `urgency` / `severity`: exact match
- `topics`: at least one expected substring appears in the analyzer's emitted topic list (substring, case-insensitive)
- `quality`: 0–100 from the meta-grader (compares the generated draft against the original review)

**Tolerances are deliberate** — model outputs vary between runs. Sentiment ranges and topic-substring matching reduce false negatives without letting through wrong classifications.

**Self-grading bias caveat (Phase 11+):** when the meta-grader (`fast` tier) and the drafter (`smart` tier) use the same model — which is the case on `groq` (both = Llama 3.3 70B) and `anthropic` (both = Haiku 4.5) — the quality score is inflated because the grader is judging output from a model with identical biases. `gemini` provider splits tiers (`flash-lite` grader vs `flash` drafter) so its quality numbers are cleaner cross-checks.

**Llama 3.3 70B foreign-token leak (Groq runs):** Llama is heavily multilingual and occasionally bleeds non-Arabic tokens into Arabic responses (e.g. `μας` Greek "our", `особенно` Russian "especially" mixed into Saudi-Arabic drafts). The current meta-grader prompt focuses on issue-coverage so these slip through scored high. Document the artifact; a future grader prompt could check for language purity.


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

## Run — 2026-05-17T10:22:57.709Z

**Samples:** 10 · **Models:** `gemini-2.5-flash-lite` (analyzer + quality), `gemini-2.5-flash` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-rave-1` | ✓ ar | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `gulf-complaint-mild` | ✓ ar | ✓ 0 (exp -1..0) | ✓ medium | ✓ direct_reply | ✓ | — |
| `gulf-angry` | ✓ ar | ✓ -2 (exp -2..-1) | ✓ high | ✗ urgent_action | ✓ | 95 |
| `msa-formal` | ✓ ar | ✓ 1 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `english-positive` | ✓ en | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | — |
| `english-complaint` | ✓ en | ✓ -1 (exp -2..-1) | ✗ medium | ✓ direct_reply | ✓ | — |
| `mixed-codeswitch` | ✗ FAILED | ✗ FAILED (exp 1..2) | ✗ FAILED | ✗ FAILED | — | — |
| `urgent-hygiene` | ✗ FAILED | ✗ FAILED (exp -2..-2) | ✗ FAILED | ✗ FAILED | — | — |
| `short-positive` | ✗ FAILED | ✗ FAILED (exp 1..2) | ✗ FAILED | ✗ FAILED | — | — |
| `vague-negative` | ✗ FAILED | ✗ FAILED (exp -2..0) | ✗ FAILED | ✗ FAILED | — | — |

**Aggregate:** language 6/10 · sentiment 6/10 · urgency 5/10 · severity 5/10 · topics 6/6 · dialect 6/6 · quality mean 95 / min 95

<details><summary>Draft excerpts</summary>

- `gulf-rave-1` (ar): أخوي فهد، ألف شكر على كلامك الطيب وإطرائك على الكبسة والخدمة السريعة. يسعدنا جداً إنك زرتنا ثلاث مرا
- `gulf-complaint-mild` (ar): يا هلا سارة، يسعدنا جداً إن الأكل عجبك وكان طيب. نعتذر عن طول مدة الانتظار اللي صارت، وملاحظتك عن ال
- `gulf-angry` (ar): يا أخ محمد، نعتذر جداً على التجربة السيئة اللي مريت فيها. أبداً ما يرضينا إن الأكل وصلك بارد، والأهم
- `msa-formal` (ar): د. عبدالعزيز، نشكرك جزيلاً على إشادتك بمطعمنا وأجوائه الراقية وجودة طعامنا. ملاحظتك حول الأسعار مقار
- `english-positive` (en): Thank you, Reem, for your wonderful review! We're so happy you enjoyed the perfectly seasoned mixed 
- `english-complaint` (en): Ahmed, we are very sorry to hear about the problems with your recent delivery order. A 90-minute del
- `mixed-codeswitch` (?): (skipped)
- `urgent-hygiene` (?): (skipped)
- `short-positive` (?): (skipped)
- `vague-negative` (?): (skipped)

</details>

<details><summary>Errors</summary>

- `gulf-complaint-mild`: quality: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
- `english-positive`: quality: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 59.628721472s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-2.5-flash-lite","location":"global"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"59s"}]}}
- `english-complaint`: quality: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 59.303715337s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-2.5-flash-lite"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"59s"}]}}
- `mixed-codeswitch`: analyzer: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 59.157079028s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-2.5-flash-lite"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"59s"}]}}
- `urgent-hygiene`: analyzer: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 58.948258784s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-2.5-flash-lite"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"58s"}]}}
- `short-positive`: analyzer: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 59.893094471s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-2.5-flash-lite"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"59s"}]}}
- `vague-negative`: analyzer: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 59.896201424s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-2.5-flash-lite"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"59s"}]}}

</details>

## Run — 2026-05-18T08:29:26.096Z

**Samples:** 10 · **Models:** `gemini-2.5-flash-lite` (analyzer + quality), `gemini-2.5-flash` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-angry` | ✓ ar | ✓ -2 (exp -2..-1) | ✓ high | ✓ direct_reply | ✓ | 95 |
| `english-complaint` | ✓ en | ✓ -1 (exp -2..-1) | ✓ medium | ✓ direct_reply | ✓ | 95 |
| `mixed-codeswitch` | ✓ mixed | ✓ 1 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 85 |
| `urgent-hygiene` | ✓ ar | ✓ -2 (exp -2..-2) | ✓ high | ✓ urgent_action | ✓ | 95 |
| `short-positive` | ✓ ar | ✓ 2 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `vague-negative` | ✓ en | ✓ -1 (exp -2..0) | ✗ medium | ✓ monitor | — | 45 |
| `staff-complaint-described` | ✓ en | ✓ -1 (exp -2..-1) | ✓ medium | ✓ direct_reply | ✓ | 95 |
| `allergy-reaction` | ✓ en | ✓ -2 (exp -2..-2) | ✓ high | ✓ urgent_action | ✓ | 95 |
| `dietary-confusion-ar` | ✓ ar | ✓ -2 (exp -2..-1) | ✓ high | ✓ urgent_action | ✓ | 95 |
| `competitor-better` | ✓ ar | ✓ 0 (exp 0..1) | ✓ low | ✓ direct_reply | ✓ | 85 |

**Aggregate:** language 10/10 · sentiment 10/10 · urgency 9/10 · severity 10/10 · topics 9/9 · dialect 8/9 · quality mean 88 / min 45

<details><summary>Draft excerpts</summary>

- `gulf-angry` (ar): يا أخوي محمد، نعتذر لك بشدة على التجربة السيئة اللي ذكرتها، خصوصًا بخصوص وصول الأكل بارد وتعامل الكا
- `english-complaint` (en): We're truly sorry your delivery was 90 minutes late and the rice was undercooked, Ahmed. It's also u
- `mixed-codeswitch` (ar): أهلاً نورة، فرحنا كثير إن الكباب أعجبك والأجواء كانت ممتازة لموعدكم. بخصوص الموقف، كلامك صحيح، ندري 
- `urgent-hygiene` (ar): نأسف جداً لما حدث بخصوص وجود شعرة في الطعام، ونعتذر بشدة عن رد المدير غير المقبول والذي يتعارض تماما
- `short-positive` (ar): الله يعافيك يا علي، ويسعدنا كثير كلامك الحلو عن أكلنا الممتاز. نتمنى نشوفك قريب مرة ثانية.
- `vague-negative` (en): We're really sorry to hear your experience wasn't good. We'd love to understand what went wrong so w
- `staff-complaint-described` (en): We're glad to hear you found the food decent, Hessa. However, we are truly sorry that our cashier ma
- `allergy-reaction` (en): Layla, we are truly shocked and deeply sorry to hear about your son's allergic reaction after our wa
- `dietary-confusion-ar` (ar): يا أم سلطان، نأسف جداً لسماع اللي صار معاك، وفعلاً هذا خطأ غير مقبول أبداً إن المعلومة عن الثوم في ا
- `competitor-better` (ar): أهلًا بك يا سعد، يسعدنا إن كبستنا أعجبتك وإن الجو عندنا راق لك. ملاحظتك على البهارات وصلتنا وبنشتغل 

</details>

## Run — 2026-05-18T08:55:42.560Z

**Samples:** 1 · **Provider:** `anthropic` · **Models:** `anthropic:fast` (analyzer + quality), `anthropic:smart` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-rave-1` | ✗ FAILED | ✗ FAILED (exp 2..2) | ✗ FAILED | ✗ FAILED | — | — |

**Aggregate:** language 0/1 · sentiment 0/1 · urgency 0/1 · severity 0/1

<details><summary>Draft excerpts</summary>

- `gulf-rave-1` (?): (skipped)

</details>

<details><summary>Errors</summary>

- `gulf-rave-1`: analyzer: 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011Cb9kjt9UMhKYtrSLmHwSU"}

</details>

## Run — 2026-05-18T09:01:13.972Z

**Samples:** 1 · **Provider:** `groq` · **Models:** `groq:fast` (analyzer + quality), `groq:smart` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-rave-1` | ✓ ar | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |

**Aggregate:** language 1/1 · sentiment 1/1 · urgency 1/1 · severity 1/1 · topics 1/1 · dialect 1/1 · quality mean 95 / min 95

<details><summary>Draft excerpts</summary>

- `gulf-rave-1` (ar): شكراً جزيلاً لفهد على كلماته الجميلة، يسعدنا أن نسمع أن الكبسة لذتلكم، ونتمنى لكم زيارات أكثر وخدمة 

</details>

## Run — 2026-05-18T09:08:40.577Z

**Samples:** 25 · **Provider:** `groq` · **Models:** `groq:fast` (analyzer + quality), `groq:smart` (drafter)

| id | lang | sentiment | urgency | severity | topics | quality |
|---|---|---|---|---|---|---|
| `gulf-rave-1` | ✓ ar | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `gulf-complaint-mild` | ✓ ar | ✓ 0 (exp -1..0) | ✗ low | ✓ direct_reply | ✓ | 90 |
| `gulf-angry` | ✓ ar | ✓ -2 (exp -2..-1) | ✗ medium | ✓ direct_reply | ✓ | 95 |
| `msa-formal` | ✓ ar | ✓ 1 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 90 |
| `english-positive` | ✓ en | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `english-complaint` | ✓ en | ✓ -1 (exp -2..-1) | ✓ medium | ✓ direct_reply | ✓ | 95 |
| `mixed-codeswitch` | ✓ mixed | ✓ 1 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 90 |
| `urgent-hygiene` | ✓ ar | ✓ -2 (exp -2..-2) | ✓ high | ✓ urgent_action | ✓ | 90 |
| `short-positive` | ✓ ar | ✓ 2 (exp 1..2) | ✓ low | ✓ direct_reply | ✓ | 90 |
| `vague-negative` | ✓ en | ✓ -1 (exp -2..0) | ✓ medium | ✓ monitor | — | 40 |
| `staff-praise-named` | ✓ ar | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `staff-complaint-described` | ✓ en | ✓ -1 (exp -2..-1) | ✓ medium | ✓ direct_reply | ✓ | 95 |
| `allergy-reaction` | ✓ en | ✓ -2 (exp -2..-2) | ✓ high | ✓ urgent_action | ✓ | 95 |
| `dietary-confusion-ar` | ✓ ar | ✓ -2 (exp -2..-1) | ✓ high | ✓ urgent_action | ✓ | 90 |
| `jahez-delivery-bad` | ✓ ar | ✓ -1 (exp -2..-1) | ✗ medium | ✓ direct_reply | ✓ | 95 |
| `hungerstation-positive` | ✓ en | ✓ 2 (exp 2..2) | ✓ low | ✓ direct_reply | ✓ | 95 |
| `mrsool-driver` | ✓ mixed | ✓ 0 (exp -1..1) | ✓ low | ✓ direct_reply | ✓ | 90 |
| `competitor-better` | ✓ ar | ✓ 1 (exp 0..1) | ✓ low | ✓ direct_reply | ✓ | 90 |
| `prayer-time-closed` | ✓ ar | ✓ -1 (exp -1..0) | ✓ medium | ✓ direct_reply | ✓ | 90 |
| `family-section-issue` | ✓ ar | ✓ -1 (exp -1..0) | ✓ medium | ✓ direct_reply | ✓ | 95 |
| `buried-complaint` | ✓ en | ✓ 1 (exp 1..2) | ✗ low | ✓ direct_reply | ✓ | 95 |
| `long-detailed` | ✗ FAILED | ✗ FAILED (exp 1..2) | ✗ FAILED | ✗ FAILED | — | — |
| `food-good-service-bad` | ✗ FAILED | ✗ FAILED (exp -1..0) | ✗ FAILED | ✗ FAILED | — | — |
| `sheikh-formal` | ✗ FAILED | ✗ FAILED (exp 2..2) | ✗ FAILED | ✗ FAILED | — | — |
| `expat-english` | ✗ FAILED | ✗ FAILED (exp 2..2) | ✗ FAILED | ✗ FAILED | — | — |

**Aggregate:** language 21/25 · sentiment 21/25 · urgency 17/25 · severity 21/25 · topics 20/20 · dialect 15/19 · quality mean 90.2 / min 40

<details><summary>Draft excerpts</summary>

- `gulf-rave-1` (ar): شكراً جزيلاً لفهد على هذه الكلمات الجميلة، يسعدنا أن تكون خدمتنا السريعة واكبسة μας قد طاقت توقعاتك،
- `gulf-complaint-mild` (ar): شاكرين ليكم سارة على ملاحظاتكم، نحن نحترم وقتكم ونعتذر على الانتظار الطويل، سنعمل على تحسين خدمتنا ل
- `gulf-angry` (ar): نأسف لسماع أن تجربتك معنا كانت سيئة، особенно بخصوص الأكل البارد والكاشير الذي لم يكن على مستوى الأد
- `msa-formal` (ar): شكراً جزيلاً د. عبدالعزيز على تقييمك وتعليقك القيم. نحن سعداء بأن أجواءنا الراقية وطعامنا الجيد قد ل
- `english-positive` (en): Thank you, Reem, for your kind words about our mixed grill and attentive service. We're glad you enj
- `english-complaint` (en): Sorry to hear that your delivery experience was disappointing, Ahmed. We apologize for the late arri
- `mixed-codeswitch` (mixed): Thank you, Nora, for your kind words about our kebab and vibes! We're glad you enjoyed your date nig
- `urgent-hygiene` (ar): إن شاء الله نعتذر عن وجود الشعرة في الأكل، ونسأل الله أن يعطينا العافية. سنحقق في هذا الأمر على الفو
- `short-positive` (ar): شكراً لك على كلماتك الجميلة، يعطيكم العافية، نتمنى لكم زيارات متكررة إلى مطاعمنا لتجربة أطباقنا المم
- `vague-negative` (en): Sorry to hear that we didn't meet your expectations. We'd like to make it right - please email us so
- `staff-praise-named` (ar): شكراً جزيلاً منيرة على تقييمك الجميل، يسعدنا أن نسمع أن الأكل لذيذ والخدمة ممتازة، وخاصة تعاون الأخ 
- `staff-complaint-described` (en): Dear Hessa, we apologize for the poor service you received from our cashier. We're truly sorry that 
- `allergy-reaction` (en): Dear Layla, we're deeply sorry to hear that your son had a reaction to a dish at our restaurant desp
- `dietary-confusion-ar` (ar): نأسف لما حدث معك، أم سلطان، وندعم حقك في الحصول على معلومات دقيقة عن المكونات، особенно مع存在 حساسية.
- `jahez-delivery-bad` (ar): أنا آسف لما حدث معك في تجربتك الأخيرة معنا، خصوصاً أن الطلب كان ناقص قطعة الدجاج وعصير الليمون، ووصل
- `hungerstation-positive` (en): Thank you, Rakan, for your kind words about our mandi and chicken - we're thrilled you enjoyed the c
- `mrsool-driver` (mixed): شكراً لك فاطمة على ملاحظاتك. نحن سعداء لأنك استمتعت بالمشاوي، وبالنسبة لمشكلة السائق سنعمل على حلها 
- `competitor-better` (ar): شكراً لك سعد على تقييمك، يسعدنا أنك استمتعت بجو المطعم و كبستنا. سنعمل على تحسين الطعم و البهارات في
- `prayer-time-closed` (ar): أبو يوسف، آسف لما حدث، ونعتذر عن التأخير في فتح المحل بعد الصلاة. سنحاول جاهدين لتحسين هذا الأمر، وس
- `family-section-issue` (ar): نشكرك على ملاحظاتك حول القسم العائلي، أم ريم. نحن نعتذر لأن القسم كان مزدحمًا وطاولات قريبة من بعضها
- `buried-complaint` (en): Thank you, Yara, for sharing your evening with us. We're glad you enjoyed the lamb ouzi and dessert 
- `long-detailed` (?): (skipped)
- `food-good-service-bad` (?): (skipped)
- `sheikh-formal` (?): (skipped)
- `expat-english` (?): (skipped)

</details>

<details><summary>Errors</summary>

- `long-detailed`: analyzer: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_01krx50ycafn5rzmq9vn2ygpps` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 98485, Requested 1940. Please try again in 6m7.2s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}
- `food-good-service-bad`: analyzer: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_01krx50ycafn5rzmq9vn2ygpps` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 98481, Requested 1798. Please try again in 4m1.055999999s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}
- `sheikh-formal`: analyzer: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_01krx50ycafn5rzmq9vn2ygpps` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 98477, Requested 1786. Please try again in 3m47.232s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}
- `expat-english`: analyzer: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_01krx50ycafn5rzmq9vn2ygpps` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 98473, Requested 1811. Please try again in 4m5.376s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}

</details>
