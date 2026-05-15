# ReviewPilot launch roadmap

Goal: launch to Riyadh restaurants in 4 weeks, online-only acquisition.

## Week 1: Foundation + AI engine ✅ in progress

- [x] Repo scaffolding (Next.js 15 + TS + Drizzle + Tailwind)
- [x] Database schema
- [x] AI engine: analyzer + drafter with Saudi-specific prompts
- [x] Sample reviews for prompt iteration
- [x] Local test harness (`npm run ai:test`)
- [ ] Submit Google Business Profile API application
- [ ] Meta Business account + WhatsApp Cloud API setup
- [ ] Domain + DNS (reviewpilot.sa or similar)
- [ ] Vercel project + Neon database
- [ ] Landing page (Arabic + English) with waitlist
- [ ] First waitlist signups via X/LinkedIn/Instagram

## Week 2: Auth + inbox UI

- [ ] BetterAuth setup with email magic links
- [ ] Onboarding flow: voice profile picker (60-second wizard)
- [ ] Review inbox UI (RTL-first, Arabic-first)
- [ ] Manual review paste/import (so the product works without GBP API)
- [ ] Approve/edit/copy-to-clipboard workflow
- [ ] Sentiment + topic visualization in the inbox

## Week 3: Background jobs + daily digest

- [ ] Inngest setup
- [ ] On-new-review job: analyze → generate draft → notify
- [ ] Daily WhatsApp digest at 9am Riyadh time
- [ ] Dashboard: review velocity chart + topic-sentiment heatmap
- [ ] Polish pass on Arabic typography and RTL bugs
- [ ] Demo video recording (Arabic) for marketing

## Week 4: Launch + first customers

- [ ] WhatsApp cold outreach to ~50 Riyadh restaurants
- [ ] Instagram/TikTok demo videos in Arabic
- [ ] X/LinkedIn launch posts
- [ ] First 3-5 free pilot customers onboarded
- [ ] Fix top friction issues in real use
- [ ] Soft launch with the technical blog post

## Parallel: long-lead items

- Google Business Profile API approval (2-6 weeks) — apply day 1
- WhatsApp Business verification (1-2 weeks)
- Commercial registration if going live with payments (later)

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| GBP API not approved in time | Plan B: manual paste / scrape + copy-to-clipboard flow |
| AI drafts feel "off" in Arabic | The sample review test harness — iterate daily on prompts |
| No restaurant signups | Pivot acquisition: paid Instagram/TikTok ads, food influencer partnerships |
| Restaurants want to pay but can't yet | First 5 free for 3 months — feedback over revenue |
