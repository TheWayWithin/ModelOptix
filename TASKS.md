# TASKS.md — Action Items

*Marvin maintains this. Jamie executes (or tells Marvin to).*

---

## 🔥 Today / This Week

- [ ] **📣 Daily WIP.co Progress Posts** 🔴 PRIORITY (ONGOING)
  *Capture everything we do each day, write pithy progress updates*
  - Track accomplishments throughout the day in memory files
  - End of day (or next morning): draft punchy WIP post
  - Post to wip.co with relevant hashtags
  - Keep it cool, not corporate — show the real work
  - Include wins AND fails (authenticity > perfection)

- [ ] **🔑 Set Up X API Access** 🔴 PRIORITY (PREREQUISITE)
  *Required for social engagement monitor*
  - [ ] Sign up for X API Basic tier ($200/mo) — or Free tier if sufficient
  - [ ] Generate API keys (API Key, API Secret, Access Token, Access Token Secret)
  - [ ] Store credentials securely (`.clawdbot/credentials/x-api.json`)
  - [ ] Test API connection (fetch recent posts, read replies)
  - [ ] Document rate limits and capabilities

- [ ] **💬 Social Engagement Monitor** 🔴 PRIORITY
  *Auto-check LinkedIn and X posts for new comments, suggest responses*
  **Prerequisites:**
  - [ ] X API access configured (see above)
  **Capability Build:**
  - [ ] LinkedIn comment detection (via browser automation)
  - [ ] X/Twitter reply/comment detection (via API)
  - [ ] Response suggestion engine (respectful, fun, on-brand)
  - [ ] Draft response review before posting (semi-autonomous)
  **Scheduled Checks (via cron):**
  - [ ] 6 AM UTC — morning check
  - [ ] 12 PM UTC — midday check  
  - [ ] 6 PM UTC — evening check
  **Deliverables:**
  - [ ] Script/skill for comment fetching
  - [ ] Response generation with tone guidelines
  - [ ] Cron jobs configured for 3x daily checks
  - [ ] Notification to Jamie when responses ready for review

- [ ] **📝 Review aisearchmastery.com Site Improvements** 🟡
  *Site reverted to original design. Recommendations doc created.*
  - [ ] Read `aisearchmastery/SITE_IMPROVEMENT_RECOMMENDATIONS.md`
  - [ ] Decide on Phase 1 priorities (hero rewrite, primary CTA)
  - [ ] Implement changes (Jamie coding)
  - [ ] Test on staging before production push

- [ ] **🚨 CI/CD Failures (Feb 9)** 🟡 PARTIALLY RESOLVED
  *Flagged in morning email review*
  - [x] **ModelOptix** — Railway build failed ✅ FIXED (Feb 10)
    - Build now working on staging
  - [ ] **llm-txt-mastery** — GitHub CI/CD failed on develop (2 workflow failures)
    - [ ] Check GitHub Actions → develop branch
    - [ ] Review workflow run logs for both failures
    - [ ] Likely causes: Node version, test failures, lint errors
    - [ ] Fix and push to develop

- [ ] **🔧 AImpactScanner — Sprint 8: API Access** 🔴 IN PROGRESS
  *Jamie working on this now (Feb 10)*
  **Phase 5 (Production Migration):** IN PROGRESS
  - [x] Railway backend built and tested on staging
  - [x] Backend DB live
  - [x] UAT testing complete
  - [ ] Enable `VITE_USE_RAILWAY_BACKEND=true` in Netlify production
  - [ ] Production smoke tests
  - [ ] Monitor analysis success rates
  - [ ] Edge Function deprecation (after 30 days stable)
  **Sprint 8 — API Access for Scale Tier:**
  - [ ] Expose API endpoints for programmatic scans
  - [ ] API authentication (Scale tier users)
  - [ ] Enable Ace to access AIS for outreach material generation
  **Phase 6.4 (Testing):** PENDING DEPLOYMENT
  - [ ] Test CSR site analysis with Scale tier + renderJs
  - [ ] Test validation endpoints on real sites
  - [ ] Test JS render quota tracking
  **Phase 6.5 (Documentation):** PENDING
  - [ ] Update architecture.md to v3.0
  - [ ] Create ADR-016 for Railway migration
  - [ ] Archive generate-llmstxt Edge Function
  - [ ] Update CLAUDE.md with new backend structure

- [ ] **🚀 LLM.txt Mastery Marketing Launch** 🔴 ← TOP PRIORITY
  *Goal: First 10 paying customers*
  - [ ] Test staging before production merge
  - [ ] Merge develop → main (production deploy)
  - [ ] Post on Indie Hackers (launch post)
  - [ ] Tweet thread about AI search visibility
  - [ ] Find 10 Webflow designers/agencies, DM them
  - [ ] Find 10 custom site founders, DM them
  - [ ] Write blog post about launch process (jamiewatters.work)
  - [ ] Prep Product Hunt launch (after 5+ customers)

- [ ] **Build Prospecting System** 🟡
  *Carter Klein is prospect #1 — need a system to track and nurture leads*
  - [ ] Design prospect tracking (CRM-lite): name, company, source, status, next action, notes
  - [ ] Integrate with email protocol (`_Filed/Leads` → prospect record)
  - [ ] Define prospect stages: Lead → Contacted → Engaged → Opportunity → Won/Lost
  - [ ] Track follow-up cadence (7-day rule for pending responses)
  - [ ] Location: `data/prospects.csv` or Notion?

- [ ] **Complete ModelOptix MVP** 🔴
  **Phases 0-5:** ✅ COMPLETE (Landing, Waitlist, Foundation, Portfolio+Catalog, Core Value Loop, Monetization, Polish+Admin+Launch)
  **Phase 6 — OpenRouter Integration (8/11 tasks done):**
  ✅ OpenRouter API key in Railway, Admin sync API + dashboard controls, User import service/API/UI wizard, Onboarding choice
  **✅ Build fixed (Feb 10):** Staging build now working
  **🔧 Next step:** End-to-end testing
  **Remaining (4 tasks):**
  - [ ] 6.0.2 — Manually trigger model catalog sync, verify data flows
  - [ ] 6.0.3 — Verify database has 200+ models after sync
  - [ ] 6.3.1 — Test complete end-to-end user journey (signup → connect OpenRouter → import → recommendations) ← NEXT
  - [ ] 6.3.2 — Verify error handling (invalid key, rate limit, no data)
  **Quality Gates:**
  - [x] Build passes ✅
  - [ ] Test coverage >= 80%, lint passes
  - [ ] npm audit — no high/critical vulns
  - [ ] Dashboard loads < 3s
- [ ] **Complete PlebTest MVP** 🔴
  **Phase 0 (Landing Page):** ✅ COMPLETE
  **Phase 1 (Core Loop MVP):** ~75% done
  ✅ Database & Infrastructure (1.1), Authentication (1.2 partial), Quick Fire (1.3), Idea Management (1.4), Proposal & ICP Management (1.5), Persona Generation (1.6), Validation Tests & Workers (1.7), Interactive Sessions (1.8), Spectator Sessions (1.9), Active Test View (1.10), Reports (1.11 partial), Anti-Sycophancy QA (1.16), Billing checkout/webhooks/subscription view/upgrade-downgrade (1.13)
  **🔧 Currently fixing (Known Issues):**
  - [ ] Landing page sign-in/sign-up navigation missing
  - [ ] User record not auto-created on OAuth (Google OAuth creates auth user but not users table row)
  - [ ] Remove diagnostic endpoints before production (/api/stripe-diag, /api/sync-subscription)
  **P0 — Last blocker for launch:**
  - [ ] task-1.14.1 — Tier limit checking: enforce ideas/tests limits per billing period
  **P1 — Important for launch:**
  - [ ] task-1.2.5 — Profile management (edit name, email, country, VAT)
  - [ ] task-1.11.4 — Download Report (JSON export)
  - [ ] task-1.12.1 — Onboarding Flow
  - [ ] task-1.13.6 — Manage Payment Method (Stripe portal)
  - [ ] task-1.13.7 — Cancel Subscription
  - [ ] task-1.14.2 — Billing lock states (soft/hard lock for past due)
  - [ ] task-1.14.4 — Cost alerting (daily spend tracking)
  - [ ] task-1.15.3 — Sentry error tracking
  - [ ] task-1.15.4 — Resend email templates
  - [ ] task-1.15.6 — Jest/Playwright tests
  - [ ] task-1.15.7 — Analytics event taxonomy + funnel dashboard
  - [ ] task-1.17.1 — Delete my account flow
  - [ ] task-1.17.2 — Data retention policy
  - [ ] task-1.17.3 — Secret scanning + CI security
- [ ] **Roll Out Plausible Analytics Across All Sites** 🟡
  *Goal: Unified analytics dashboard for entire portfolio*
  - [ ] Sign up for Plausible ($9/mo for 10K pageviews, unlimited sites)
  - [ ] Add to jamiewatters.work (replace/complement Vercel Analytics)
  - [ ] Add to llmtxtmastery.com
  - [ ] Add to aimpactscanner.com
  - [ ] Add to freecalchub.com (if live)
  - [ ] Add to modeloptix.com (when live)
  - [ ] Add to plebtest.com (when live)
  - [ ] Verify all sites reporting in Plausible dashboard
  - [ ] Review: Remove Google Analytics if present (privacy + simplicity)

- [x] ~~Check DKIM status for all domains (24-72h wait from Jan 28)~~ ✅ Jan 30 — DKIM records added to all 9 domains, authentication started in Google Admin
- [ ] Check solomarket.work Google domain recovery (reference #67359302)
- [ ] Check freecalchub.com nameserver propagation to Netlify
- [ ] **Transfer Squarespace domains to Namecheap** — theawarenessorganization.com + theaware.org (just auto-renewed Jan 27, so we have ~1 year)
- [ ] Post LinkedIn + X for Article 2 (AWS setup guide)
- [x] ~~Change jamiewatters.work admin password~~ ✅ Jan 31
- [x] ~~Rotate Supabase access token~~ ✅ Jan 31
- [x] ~~Establish secure credential sharing method~~ ✅ Jan 31
- [ ] **Stripe cleanup (AIsearchmastery account):**
  - [ ] Audit all products — identify active vs defunct
  - [ ] Archive/delete old products (old ISO Tracker, etc.)
  - [ ] Confirm only LLMtxt + AImpactScanner remain
  - [ ] Create separate webhook endpoint for AImpactScanner
  - [ ] Create separate webhook endpoint for LLMtxtMastery
  - [ ] Remove old shared webhook
  - [ ] Test both webhook endpoints

## 🌐 JamieWatters.work

- [ ] **Build /metrics page** 🔴 NEW
  *Public scoreboard for Jamie, Marvin, and Ace*
  - [ ] Create `/app/metrics/page.tsx`
  - [ ] Create `/public/data/metrics.json` with initial data
  - [ ] Build team cards (3 columns: Jamie, Marvin, Ace)
  - [ ] Add weekly trends chart
  - [ ] Add monthly goal progress bars
  - [ ] Style with existing Tailwind theme
  - [ ] Connect daily cron to update JSON
  - Spec: `drafts/metrics-page-spec.md`

- [ ] Review project metrics — ensure correct metrics per project
  - [ ] Automate MRR feed from Stripe API
  - [ ] Automate user/signup counts
  - [ ] Remove manual "last updated" — make it live data
- [ ] Update content creation: make "Write Manual Post" the primary option, remove daily update and progress report generation (unused)
- [ ] Add project plan / task pipeline dashboard (public, build-in-public transparency)

## 📝 Content Pipeline

### Distribution Strategy (Multi-Platform)
- [ ] **WIP.co daily updates** — automate posting, build solopreneur reputation
  - [ ] Check WIP.co API for automation
  - [ ] Daily progress updates
  - [ ] Cross-post salient posts from other platforms
- [ ] **Reddit social credit building** — ask good questions, share learnings
  - [ ] Post in r/ClaudeAI, r/ChatGPT, r/SideProject, r/indiehackers
  - [ ] Start with genuine questions about AI agent experiences
  - [ ] Share "I broke prod" story as learning post
- [ ] **Grow X/Twitter followers** — strategy TBD
  - [ ] Engage more with #buildinpublic community
  - [ ] Regular posting cadence
  - [ ] Reply to influential accounts
- [ ] **LinkedIn prospecting** — getting 10x more views there
  - [ ] Find LLMtxt prospects on LinkedIn
  - [ ] Build connections with ICP founders

### Posts in Pipeline
- [ ] **Blog: Ace Training & Day 1** — Setting up Ace in product role, training on the product, Day 1 achievements, roadmap
- [ ] **Blog: Funding Arbitrage Investigation** — Research into funding rate arbitrage as Trader-7 profit strategy
- [ ] Cross-post updates to wip.co
- [ ] Article 3: "How we built and deployed a product in a weekend"
- [ ] Article 4: "The AI agent's daily routine (heartbeats, proactive checks, memory management)"
- [ ] Article 5: "When AI agents fail (and what to do about it)"
- [ ] Write LinkedIn + X posts for each article as published

## 🛠️ Infrastructure

- [ ] **🔄 Mac Mini Agent Migration** 🔴 NEW
  *Move sub-agents to Mac Mini M4, keep Marvin on AWS*
  **See:** `docs/MAC-MINI-MIGRATION-PLAN.md`
  **Day 1:**
  - [ ] Install Clawdbot on Mac Mini
  - [ ] Install Tailscale on both AWS and Mac Mini
  - [ ] Configure Mac Mini to stay awake (pmset)
  - [ ] Create backup of current AWS agent state
  - [ ] Test Tailscale connectivity AWS ↔ Mac Mini
  **Day 2:**
  - [ ] Copy agent files to Mac Mini
  - [ ] Create Clawdbot config on Mac Mini
  - [ ] Authenticate Ace with Anthropic on Mac Mini
  - [ ] Test Ace responds in AI Search HQ
  - [ ] Remove Ace from AWS config
  **Day 3:**
  - [ ] Set up automated backup cron on AWS
  - [ ] Set up health check script
  - [ ] Document and test failover procedure

- [ ] **Update GitHub PAT** *(tonight)* — add `workflow` scope so Marvin can push CI/workflow changes
  - Then push pending llm-txt-mastery CI fix (Node 18→20, audit level fix)

- [ ] **Standardize LLM usage across all apps** — use OpenRouter + env vars for model selection
  - No hardcoded model names in code
  - Model set via Railway env var (prod) or .env.local (dev)
  - Easier to change models, easier to see what's used
  - **Start with:** llmtxtmastery.com *(tonight)*
    - [ ] Create OpenRouter API key for LLMtxt
    - [ ] Fix Railway API token (current one expired)
    - [ ] Add Railway env vars: `OPENROUTER_API_KEY`, `LLM_MODEL`
    - [ ] Code changes ready — just needs vars
  - [ ] AImpactScanner
  - [ ] PlebTest
  - [ ] ModelOptix (if applicable)
  - [ ] Any other apps with LLM calls

- [x] ~~DKIM records for all 10 domains (cron set for Jan 29 4pm UTC)~~ ✅ Jan 30 — All 9 active domains done (solomarket.work pending domain recovery)
- [ ] **Test email receive on all domains** — send test to each alias, confirm delivery:
  - [ ] jamie@aimpactscanner.com
  - [ ] jamie@llmtxtmastery.com
  - [ ] jamie@plebtest.com
  - [ ] jamie@modeloptix.com
  - [ ] jamie@agent-11.com
  - [ ] jamie@freecalchub.com
  - [ ] jamie@evolve-7.com
  - [ ] jamie@jamiewatters.work
  - [ ] jamie@solomarket.work (pending domain recovery)
- [ ] Set up daily email check cron
- [x] ~~Supabase security vulnerabilities (59 errors → 0)~~ ✅ Fixed Jan 30 — RLS enabled on all tables
- [ ] Set up Google Search Console for jamiewatters.work

## 🚀 Growth / Revenue

- [ ] **Set up traffic analytics:**
  - [ ] llmtxtmastery.com — add analytics
  - [ ] jamiewatters.work — add analytics
  - [ ] aimpactscanner.com — add analytics
  - [ ] aisearchmastery.com — add analytics
  - [ ] Decide on tool: privacy-friendly vs full-featured (PostHog? Plausible? GA?)

- [ ] **LLMtxt API integration test:**
  - [ ] Verify LLMtxt API endpoint is live and callable
  - [ ] Test end-to-end: AImpactScanner user triggers llms.txt generation
  - [ ] Confirm file output is valid llms.txt format
  - [ ] Verify tier-gating: user's AImpactScanner tier determines LLMtxt output tier (e.g. Growth tier → Growth-level llms.txt)
  - [ ] Check error handling / edge cases
- [ ] **AImpactScanner user journey mapping:**
  - [ ] Map full lifecycle: Discovery → Scan → Results → Remediation Plan → Fix Issues → Maintenance
  - [ ] Identify feature gaps at each stage
  - [ ] Define free vs paid boundaries
  - [ ] Design retention loop (re-scan, monitoring, alerts)
- [ ] Set up basic analytics on jamiewatters.work
- [ ] Create landing page CTAs for email capture

## 🤖 Agent-11

- [ ] Fix/update MCP function so it works
- [ ] Add architecture.md to foundations command — also generate a YAML version of the architecture
- [ ] Add single-doc update to foundations command (e.g. `/foundations vision` regenerates just the vision YAML)

## 🏪 SoloMarket

- [ ] Add the Launch Pad — feature for launching new products
- [ ] Auto-registration tool: automatically submit new products to multiple launch sites

## 🔭 ISO Tracker

- [ ] Add Stripe payments integration (own Stripe account)
- [ ] Add Avi Loeb assessment content
- [ ] Add 3D plotting of ISOs (currently 2D only) — consider paid-tier-only (TBC)
- [ ] Complete phase 14.2

## 💹 Trader-7

- [ ] **🔍 Major Strategy Review** 🔴 IN PROGRESS (Feb 10)
  *Evaluating arbitrage funding as a profit strategy*
  - [ ] Research funding rate arbitrage mechanics
  - [ ] Assess risk/reward vs current trading approach
  - [ ] Define implementation requirements if proceeding
  - [ ] Update architecture docs with new strategy
- [ ] Add funding arbitrage capability
- [ ] Create segregated dev-staging vs prod environments
  - [ ] Paper trading in staging to prove new features before promoting to prod
- [ ] Externalize model selection: move hardcoded OpenRouter model to Railway env variable (swap models without code changes)
- [ ] Add Grok sentiment feed — use Grok to analyze X/Twitter for crypto sentiment insights
- [ ] Consolidate Supabase data migrations

## 💰 Costs & Financial Tracking

- [x] ~~Full cost audit~~ ✅ Done Jan 30 — all 13 months of card statements extracted
- [x] ~~Document monthly cost per service~~ ✅ COSTS.md created with vendor breakdown
- [x] ~~Set up ongoing cost tracking~~ ✅ Statements in `statements/`, auto-labeled in Gmail
- [x] ~~Kit.com cancelled~~ ✅ Saving ~$42/mo
- [ ] **Replace Enzuzo ($29/mo)** with native GDPR components:
  - [x] Build shared cookie consent banner (React component) ✅ Jan 30 — `/shared-components/gdpr/CookieConsent.tsx`
  - [x] Build privacy policy page template ✅ Jan 30 — `/shared-components/gdpr/PrivacyPolicy.tsx`
  - [x] Build terms of service page template ✅ Jan 30 — `/shared-components/gdpr/TermsOfService.tsx`
  - [ ] Deploy to all apps (AImpactScanner, LLMtxtMastery, PlebTest, ModelOptix, FreeCalcHub, SoloMarket)
  - [ ] Cancel Enzuzo after migration
- [ ] Review Manus AI ROI (Feb 2026)
- [ ] Allocate shared costs proportionally across products
- [ ] Map costs to projects/products (which product uses what)

## 📋 Strategic (from STRATEGY.md analysis — Jan 30)

- [ ] **AImpactScanner: Define paywall** — Free (1 scan/mo) vs Pro ($29/mo) vs Agency ($99/mo)
- [ ] **AImpactScanner: Wire Stripe Checkout** — Subscription flow for paid tiers
- [ ] **AImpactScanner: Landing page overhaul** — Hero, pricing table, free scan CTA
- [ ] **AImpactScanner: Distribution sprint** — 20 cold DMs, 5 community posts, 3 free site audits
- [ ] **AImpactScanner: First paying customer** 🎯 — Target: within 30 days
- [ ] **Cost audit: Review Manus AI ROI** ($199/mo) — Cancel if not used regularly
- [ ] **Cost audit: Review WIP.co** ($29/mo) — Cancel if not actively using
- [ ] **Cost audit: Evaluate Claude Max vs API** ($218/mo) — Could save $100+/mo
- [ ] **Read STRATEGY.md** — Full portfolio triage and 90-day revenue plan created overnight

## 🧊 Backlog

- [ ] Weekly review cron job (Monday morning summary)
- [ ] Portfolio dashboard metrics automation
- [ ] Playwright tests for key products
- [ ] SEO audit across all domains

---

## ✅ Done

- [x] Google Workspace email for 10 domains (Jan 28)
- [x] DNS records (MX, SPF, TXT verification) for all domains (Jan 28)
- [x] Article 1: "I Gave an AI Agent Full Access to My Infrastructure" (Jan 28)
- [x] Article 2: "How to Set Up Your Own AI Agent on AWS for Free" (Jan 28)
- [x] LinkedIn + X posts for Article 1 (Jan 28)
- [x] LinkedIn + X posts for Article 2 (Jan 28)
- [x] Published both articles to jamiewatters.work (Jan 28)
- [x] Project tracker + task system set up (Jan 28)

## 📣 AI Search Mastery Brand & Growth (Ace Owns)

*Last updated: 2026-02-11 07:11 UTC by Ace*

### Performance Metrics ✅ CREATED
- [x] Metrics framework: `aisearch/METRICS.md`
- [x] Tracking directory: `aisearch/metrics/`
- [ ] Weekly report automation (every Monday)
- [ ] Connect to Stripe for revenue data

### Social Media Setup 🔴 BLOCKED (waiting on Jamie)
- [ ] **Create @aisearchmastery on X** (Jamie to create, Ace to operate)
  - Bios/profiles ready: `aisearch/brand/SOCIAL_PROFILES.md`
  - Need: X API credentials after account created
- [ ] **Create AI Search Mastery LinkedIn company page**
  - Company page ID exists: 111834980
  - Need: Admin access for Ace to post
- [ ] Set up X API ($200/mo Basic tier) for autonomous posting
  - Share across all agents (Ace, Marvin, future product agents)

### Outreach Infrastructure ✅ DONE
- [x] Resend API configured (Feb 10)
- [x] Verified domains: llmtxtmastery.com, aimpactscanner.com, plebtest.com, modeloptix.com
- [x] Credentials stored: `.clawdbot/credentials/resend.json` + `aisearch/.env`
- [x] Shared script: `scripts/send-email.sh`

### Outreach Campaign 🔴 NEXT UP
- [ ] **Find email addresses for high-priority prospects**
  - 6 broken-file prospects (highest priority)
  - 2 bloated-file prospects (high priority)
- [ ] **A/B test email templates**
  - Segment A: Broken file messaging
  - Segment B: Bloated file messaging
  - Segment C: No file (awareness-first)
  - Strategy doc: `aisearch/campaigns/OUTREACH_STRATEGY.md`
- [ ] Send first batch (10 emails) to broken/bloated segment
- [ ] Track: open rate >40%, reply rate >10%

### Prospect System
- [x] Prospect database exists: `llm-txt-mastery/prospects/prospects.json` (41 prospects)
- [x] Segmented by: broken (6), bloated (2), no-file (23), decent (10)
- [ ] Add email addresses to prospects
- [ ] Build automated prospect scanner (find more broken/bloated files)
- [ ] Expand beyond Webflow → general solopreneurs (not WordPress)

### Content Pipeline
- [ ] Draft first week content calendar for @aisearchmastery
- [ ] Create educational content: "How to create and add an llms.txt file"
- [ ] Content pillars: 60% education, 20% social proof, 10% product, 10% founder journey

### Previous Outreach (Feb 8) — Zero Responses
| Prospect | Method | Status |
|----------|--------|--------|
| Paper Tiger | DM | No response |
| Flow Ninja | Twitter reply | No response |
| Veza Digital | DM | No response |
| BRIX Agency | DM | No response |
| Grafit Agency | Twitter reply | No response |

*Pivot: Webflow agencies may not be ideal ICP. Targeting solopreneurs directly.*

### Blockers for Autonomous Growth
| Blocker | Status | Solution |
|---------|--------|----------|
| X posting | ❌ Blocked | Need X API after account created |
| LinkedIn posting | ❌ Blocked | Need admin access |
| Email outreach | ✅ Ready | Resend configured |
| Prospect emails | ❌ Missing | Need to find email addresses |

---

### Archive: Original Tasks
- [ ] **Review aisearchmastery.com** — audit current state
  - [ ] Check messaging alignment with LLMtxt Mastery & AImpactScanner
  - [ ] Identify outdated content or positioning
  - [ ] Propose homepage/landing page improvements
  - [ ] Ensure product links and CTAs are current
  - [ ] Review SEO and AI search optimization (eat our own dogfood)
