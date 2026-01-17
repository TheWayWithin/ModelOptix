# ModelOptix Core - Product Requirements Document

**Version:** 2.0
**Status:** Ready for AGENT-11 Handoff
**Last Updated:** January 14, 2026
**Owner:** Jamie Watters

---

## Section 0: At-a-Glance

| Attribute | Value |
|-----------|-------|
| **Product Name** | ModelOptix Core |
| **Version** | 2.0 |
| **Last Updated** | January 14, 2026 |
| **Status** | Ready for AGENT-11 Handoff |
| **Owner** | Jamie Watters |

### Elevator Pitch

Stop overpaying for AI. ModelOptix helps you pick the right model, then alerts you when better options appear - with nothing to sell but the truth.

For developers and solopreneurs drowning in 400+ AI models with no unbiased guidance, ModelOptix is the independent AI advisor that delivers week 1 payback and 1000x returns - because we're structurally incapable of steering you wrong.

### Target Users

| Persona | Description |
|---------|-------------|
| **Primary** | Solopreneur Builders - solo founders building AI-powered products, bootstrapped, every dollar matters |
| **Secondary** | Indie Developers - technical builders with side projects, skeptical, want to see methodology |
| **Tertiary** | Startup CTOs - technical leaders at early-stage startups managing AI spend |

### Key Metrics

| Metric | Target |
|--------|--------|
| **Primary** | Trial → Paid conversion > 45% |
| **Secondary** | Week 1 payback achieved > 80% of users |
| **Secondary** | Monthly churn < 4% |

---

## Section 1: Product Foundation

### 1.1 Vision & Mission

**Vision:**
> To be the unbiased guide in a world where AI serves hidden interests.

**Mission:**
> Through radical transparency and independent analysis, we help developers optimize their AI stack today - building the foundation for AI truth everyone can trust tomorrow.

### 1.2 Problem Statement

**The Problem:**
Developers pick an AI model, ship it, and then 6 months later they're probably overpaying - but can't justify stopping to re-evaluate. Meanwhile, 400+ models are constantly changing with no unbiased source to cut through the noise.

**Evidence:**
- 400+ models and growing - impossible to track manually
- Constant price changes with no central notification system
- Every existing tool has hidden incentives (volume routing, affiliate deals, vendor relationships)
- Developers making decisions on 3-6 month old information

**Impact of Not Solving:**
- Financial: Quietly bleeding 20-40% overspend every month
- Competitive: Falling behind competitors who optimize their AI stack
- Emotional: Background anxiety about "am I doing this right?"
- Opportunity: Missing better models that could improve their product

### 1.3 Target Users

**Primary Persona: The Solopreneur Builder**

| Attribute | Detail |
|-----------|--------|
| Demographics | Solo founders, 1-3 person teams, bootstrapped |
| Goals | Ship fast, save money, stay competitive |
| Pain Points | Did research once, now months behind, can't justify time to re-evaluate |
| Tech Savviness | High |
| Willingness to Pay | High if ROI is immediate and clear |

**Secondary Persona: The Indie Developer**

| Attribute | Detail |
|-----------|--------|
| Demographics | Technical builders, side projects, open-source mindset |
| Goals | Best tool for job, understand methodology |
| Pain Points | Don't trust benchmarks, want to see the "why" |
| Tech Savviness | Very High |
| Willingness to Pay | Medium - needs proof first |

**Tertiary Persona: The Startup CTO**

| Attribute | Detail |
|-----------|--------|
| Demographics | Technical leaders at Seed-Series B startups |
| Goals | Team efficiency, risk reduction, cost optimization |
| Pain Points | No aggregate view of AI spend, can't prove ROI to leadership |
| Tech Savviness | High |
| Willingness to Pay | High if can justify to stakeholders |

### 1.4 Value Proposition

**For** developers and solopreneurs building AI-powered products

**Who** face an overwhelming, constantly-changing AI landscape with no unbiased guidance

**ModelOptix is** an independent AI model advisor

**That** helps you pick the right model and alerts you when better options appear - delivering week 1 payback and 1000x returns

**Unlike** leaderboards that give generic benchmarks or API gateways with volume incentives

**Our product** is structurally independent (no investors, no partners) so our only incentive is your savings

### 1.5 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial → Paid Conversion | > 45% | Stripe data |
| Week 1 Payback | > 80% of users | Savings Dashboard |
| Monthly Churn | < 4% | Subscription analytics |
| Time to First Insight | < 10 minutes | Product analytics |
| NPS | > 50 | Survey |
| Users Acting on Recommendations | > 30% | Product analytics |

### 1.6 Out of Scope (MVP)

| Item | Reason |
|------|--------|
| **Local/self-hosted models (Ollama, LocalAI)** | MVP uses OpenRouter as data source and execution layer. Local models aren't accessible via OpenRouter. May revisit in Phase 3+. |
| **Enterprise features (SSO, team management, audit logs)** | Targeting solopreneurs/indie devs for MVP. Enterprise features planned for Phase 4. |
| **Direct provider integrations** | MVP routes through OpenRouter. Direct OpenAI/Anthropic/Google integrations may be added post-MVP for reliability. |
| **Custom model fine-tuning tracking** | MVP focuses on base models available via OpenRouter. Fine-tuned model support is future scope. |
| **Usage prediction/forecasting** | MVP shows current state and opportunities. Predictive analytics is Phase 3+. |

---

## Section 2: System Skeleton

### 2.1 Glossary

| Term | Definition |
|------|------------|
| **Product** | An AI-powered application the user is monitoring (e.g., Trader-7) |
| **Function** | A distinct capability within a product that uses an LLM (e.g., Sentiment Analysis, Strategy) |
| **Use Case** | The specific context and requirements for a function - determines what model capabilities are needed |
| **Model** | An LLM (e.g., GPT-4, Claude 3.5 Sonnet, Llama 3) |
| **Model Maker** | The company that creates/trains the model (Anthropic, OpenAI, Meta, Mistral, Google) |
| **Provider** | The platform where you access the model (OpenAI API, AWS Bedrock, Azure, Together.ai, Groq) |
| **Capability** | What a model is good at (e.g., chain-of-thought, speed, large context window, multi-source synthesis) - used to match Use Cases to Models |
| **Trust Score** | Our assessment of a model/provider trustworthiness (0-100), composite of 8 dimensions (3 model + 5 provider) |
| **Trust Dimension** | One aspect of trustworthiness (e.g., Data Privacy, Model Provenance) |
| **Recommendation** | The actionable output we provide - which model to use for a specific function, with reasoning |
| **Opportunity** | A potential optimization - cost saving or performance improvement for a function |
| **Savings** | Cost reduction from acting on a Recommendation - difference between current and recommended model cost |
| **Savings to Date** | Cumulative savings since the user started using ModelOptix - proof of total value delivered |
| **Sanity Check** | Test your prompts against current vs. recommended model before switching |
| **Alert** | Notification when something changes or an opportunity appears |
| **Portfolio** | Collection of all products and functions a user monitors |

### 2.2 Conceptual Data Model

#### Entities

**Portfolio Hierarchy:**

| Entity | Key Attributes |
|--------|----------------|
| **User** | id, email, name, created_at |
| **Product** | id, user_id, name, description, created_at |
| **Function** | id, product_id, name, description, current_model_id, current_provider_id |
| **UseCase** | id, function_id, description (free text), primary_need (speed/accuracy/cost/context), monthly_spend ($ or null) |

**Model-related:**

| Entity | Key Attributes |
|--------|----------------|
| **ModelMaker** | id, name, website, description |
| **Model** | id, model_maker_id, name, version, model_family, release_date, context_window, training_cutoff, is_open_source, description |
| **Provider** | id, name, website, api_base_url |
| **ModelProviderPricing** | id, model_id, provider_id, input_price_per_1k, output_price_per_1k, is_available, latency_estimate_ms, rate_limit_rpm, last_updated |
| **Capability** | id, name, description |
| **ModelCapability** | id, model_id, capability_id, strength_score (1-10) |

**Trust-related:**

| Entity | Key Attributes |
|--------|----------------|
| **TrustDimension** | id, name, description, applies_to (model/provider) |
| **ModelTrustScore** | id, model_id, dimension_id, score (0-100), evidence, confidence_level, last_verified |
| **ProviderTrustScore** | id, provider_id, dimension_id, score (0-100), evidence, confidence_level, last_verified |

**Trust Dimensions (8 total - see Section 2.9 for methodology):**

| Dimension | Applies To | What We Assess |
|-----------|-----------|----------------|
| Output Quality | Model | Accuracy, consistency, benchmark performance |
| Output Safety | Model | Guardrails, jailbreak resistance, refusal rates |
| Training Transparency | Model | Openness about training data, methods, limitations |
| Uptime | Provider | Service availability, reliability |
| Data Privacy | Provider | Logging policy, data retention, training on inputs |
| API Stability | Provider | Error rates, deprecation history, breaking changes |
| Pricing Transparency | Provider | Clear pricing, no hidden fees, advance notice |
| Support Quality | Provider | Response times, documentation quality |

**Action-related:**

| Entity | Key Attributes |
|--------|----------------|
| **Opportunity** | id, function_id, type (cost/performance/trust), current_model_id, current_provider_id, primary_recommendation (model_id, provider_id, estimated_monthly_savings, reasoning, confidence_score), alternatives[], status (active/dismissed/acted_on/invalidated/expired), created_at |
| **SanityCheck** | id, user_id, function_id, opportunity_id, prompt_text, current_model_output, recommended_model_output, created_at |
| **Savings** | id, function_id, opportunity_id, previous_model_id, previous_provider_id, new_model_id, new_provider_id, monthly_savings_amount, switched_at |
| **Alert** | id, user_id, type (opportunity/price_change/trust_change/new_model), title, message, related_entity_type, related_entity_id, is_read, created_at |

**Account-related:**

| Entity | Key Attributes |
|--------|----------------|
| **Subscription** | id, user_id, tier (free/solo/growth/pro), status (trial/active/cancelled/past_due), stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, created_at |
| **NotificationPreferences** | id, user_id, email_alerts, slack_webhook_url, discord_webhook_url, alert_frequency |
| **UsageTracking** | id, user_id, month, products_count, functions_count, sanity_checks_used |

#### Tier Limits

| Tier | Products | Total Functions | Sanity Checks/mo |
|------|----------|-----------------|------------------|
| Free | 1 | 1 | 3 |
| Solo | 3 | 10 | 10 |
| Growth | 10 | 30 | 30 |
| Pro | 25 | 100 | 100 |

#### Key Relationships

```
User ||--o{ Product : "owns"
Product ||--o{ Function : "contains"
Function ||--|| UseCase : "has"
Function }o--|| Model : "currently uses"
Function }o--|| Provider : "accessed via"

ModelMaker ||--o{ Model : "creates"
Model ||--o{ ModelProviderPricing : "priced on"
Provider ||--o{ ModelProviderPricing : "offers"
Model ||--o{ ModelCapability : "has"
Capability ||--o{ ModelCapability : "applies to"

Model ||--o{ ModelTrustScore : "assessed on"
Provider ||--o{ ProviderTrustScore : "assessed on"
TrustDimension ||--o{ ModelTrustScore : "measures"
TrustDimension ||--o{ ProviderTrustScore : "measures"

Function ||--o{ Opportunity : "has"
Opportunity ||--o| Savings : "results in"
Opportunity ||--o{ SanityCheck : "validated by"
User ||--o{ Alert : "receives"

User ||--|| Subscription : "has"
User ||--|| NotificationPreferences : "configures"
User ||--o{ UsageTracking : "tracked by"
```

### 2.3 UI Structure

#### Core UI Component: Natural Language Interface

| Element | Description |
|---------|-------------|
| **Command Bar** | Persistent input (⌘K or always visible), available on every page |
| **Capabilities** | Navigate, query, explain, act |
| **Context-Aware** | Understands current page, user's portfolio, recent activity |

#### Main Navigation (6 items)

| Nav Item | Route | Description |
|----------|-------|-------------|
| Dashboard | `/dashboard` | Overview, Savings to Date, recent activity |
| Portfolio | `/portfolio` | Products and functions |
| Trust | `/trust` | Trust scores and reports |
| Opportunities | `/opportunities` | Recommendations (Sanity Check embedded) |
| Compare | `/compare` | Side-by-side model comparison |
| Alerts | `/alerts` | Notifications |

#### Full Route Map

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | Auth |
| `/portfolio` | Portfolio | Auth |
| `/portfolio/:productId` | Product Detail | Auth |
| `/trust` | Trust Dashboard | Auth |
| `/opportunities` | Opportunities List | Auth |
| `/opportunities/:id` | Opportunity Detail + Sanity Check | Auth |
| `/savings` | Savings History | Auth (via Dashboard link) |
| `/compare` | Model Comparison | Auth |
| `/alerts` | Alerts | Auth |
| `/settings` | Settings | Auth |
| `/settings/account` | Account (tier, usage stats, location) | Auth |
| `/settings/upgrade` | Upgrade/Downgrade/Cancel | Auth |
| `/settings/billing` | Billing (payment, invoices) | Auth |
| `/admin` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/users/:id` | User Detail | Admin |
| `/admin/models` | Model/Provider Management | Admin |
| `/admin/trust` | Trust Score Management | Admin |
| `/admin/metrics` | Analytics | Admin |

#### Admin API (for agentic interaction)

| Endpoint | Purpose |
|----------|---------|
| `/api/admin/users` | User CRUD, search, impersonate |
| `/api/admin/models` | Model/Provider/Pricing CRUD |
| `/api/admin/trust` | Trust score updates |
| `/api/admin/metrics` | Query analytics |

### 2.4 Business Rules & State Machines

#### Tier & Usage Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| BR-001 | Products limited by tier (Free: 1, Solo: 3, Growth: 10, Pro: 25) | Backend |
| BR-002 | Functions limited by tier total (Free: 1, Solo: 10, Growth: 30, Pro: 100) | Backend |
| BR-003 | Sanity checks limited per month by tier (Free: 3, Solo: 10, Growth: 30, Pro: 100) | Backend |
| BR-004 | Usage counters reset on 1st of each month | Backend (scheduled) |
| BR-005 | When adding item that uses last slot, show warning: "This is your final [product/function] slot on [tier]" | Frontend |
| BR-006 | When at limit, hard block with upgrade prompt: "Upgrade to [next tier] to add more" | Backend + Frontend |

#### Trial & Subscription Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| BR-007 | Trial lasts 7 days with user-selected tier (Solo/Growth/Pro), defaults to Growth | Backend + Frontend |
| BR-008 | Trial requires credit card upfront | Frontend + Stripe |
| BR-009 | Card charged automatically on day 8 at selected tier price | Stripe |
| BR-010 | Alternative: Skip trial, commit to annual, get 20% off first year | Frontend + Stripe |
| BR-011 | 20% first year discount only applies to annual subscriptions | Backend + Stripe |
| BR-012 | All plans include money-back guarantee | Policy |
| BR-013 | If trial cancelled before day 8, downgrade to Free | Backend |
| BR-014 | Free tier: 1 product, 1 function, 3 sanity checks, no real-time alerts (digest is P1 feature F-026) | Backend |
| BR-015 | On downgrade: show impact ("X products will be frozen, $Y opportunities hidden"), then freeze extras | Frontend + Backend |
| BR-016 | Frozen products: read-only, no new opportunities generated, data preserved | Backend |
| BR-017 | Re-upgrade: full access restored instantly | Backend |
| BR-018 | Cancelled paid subscription remains active until period end, then downgrades to Free | Backend + Stripe |

#### Opportunity & Recommendation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| BR-019 | Opportunities generated when: price change detected, new model available, trust score changes significantly | Backend (event-driven) |
| BR-020 | Opportunity thresholds are configurable backend variables (not hardcoded) | Backend config |
| BR-020a | Default thresholds: Cost ≥15% AND ≥$10/mo, Speed ≥25%, Accuracy ≥15%, Context ≥2x, Trust ≥15pts | Backend config |
| BR-020b | Thresholds adjustable via Admin without code deploy | Admin API |
| BR-021 | Opportunity status: active → dismissed OR acted_on | Backend |
| BR-022 | Dismissed opportunities can be restored within 30 days | Backend |
| BR-023 | Savings recorded only when user confirms switch via Sanity Check flow | Backend |
| BR-029 | Before confirming switch, re-validate opportunity is still valid (model available, pricing current) | Backend |
| BR-030 | Products must have at least 1 function | Backend |

#### Alert Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| BR-024 | Free tier: no real-time alerts (weekly digest is P1 feature F-026) | Backend |
| BR-025 | Paid tiers: real-time alerts via configured channels (email, Slack, Discord) | Backend |
| BR-026 | Alert types: new opportunity, price change, trust change, new model relevant to user's functions | Backend |
| BR-027 | User can configure alert preferences per channel | Frontend + Backend |
| BR-028 | Alert marked read when viewed or clicked | Frontend + Backend |

#### State Machines

**Subscription State Machine:**

```
[Trial] ──(payment success)──→ [Active]
[Trial] ──(day 8, no payment)──→ [Free]
[Trial] ──(cancelled before day 8)──→ [Free]
[Active(Solo)] ──(upgrade)──→ [Active(Growth)]
[Active(Growth)] ──(upgrade)──→ [Active(Pro)]
[Active(Growth)] ──(downgrade)──→ [Active(Solo)] ──(period end)──→ [Active(Solo) with freeze check]
[Active(Pro)] ──(downgrade)──→ [Active(Growth)] ──(period end)──→ [Active(Growth) with freeze check]
[Active] ──(cancel)──→ [Cancelled] ──(period end)──→ [Free]
[Active] ──(payment failed)──→ [PastDue] ──(retry success)──→ [Active]
[PastDue] ──(3 retries fail)──→ [Free]
[Free] ──(upgrade)──→ [Active]
```

| State | Description |
|-------|-------------|
| Trial | 7-day full access to selected tier |
| Active | Paid subscription (Solo, Growth, or Pro) |
| Cancelled | Paid until period end, then downgrades |
| PastDue | Payment retry in progress |
| Free | Limited features |

**Opportunity State Machine:**

```
[Active] ──(user dismisses)──→ [Dismissed]
[Active] ──(user acts via Sanity Check)──→ [ActedOn]
[Active] ──(model unavailable or data stale)──→ [Invalidated]
[Dismissed] ──(user restores within 30 days)──→ [Active]
[Dismissed] ──(30 days pass)──→ [Expired]
[Active] ──(no longer valid, e.g., price changed)──→ [Expired]
```

| State | Description |
|-------|-------------|
| Active | Valid opportunity, awaiting user action |
| Dismissed | User chose to ignore |
| ActedOn | User switched to recommended model |
| Invalidated | Model became unavailable or data stale |
| Expired | No longer valid or past restore window |

**Product/Function State Machine:**

```
[Active] ──(within tier limits)──→ [Active]
[Active] ──(downgrade, over limit)──→ [Frozen]
[Frozen] ──(upgrade)──→ [Active]
[Frozen] ──(user deletes)──→ [Deleted]
```

| State | Description |
|-------|-------------|
| Active | Fully functional |
| Frozen | Read-only, no new opportunities |
| Deleted | Removed by user |

### 2.5 External API Dependencies

| Capability Needed | Business Requirement |
|-------------------|---------------------|
| **Payment Processing** | Accept subscriptions, handle upgrades/downgrades, manage billing |
| **User Authentication** | Secure login, account management |
| **Transactional Email** | Send alerts, receipts, notifications |
| **Data Storage** | Persist user data, products, functions, opportunities |
| **LLM Integration** | Power natural language interface, run Sanity Checks |
| **Webhook Delivery** | Send alerts to Slack, Discord (paid tiers) |

*Technical implementation decisions left to AGENT-11.*

### 2.6 Data Privacy & Compliance

#### Data We Collect

| Data Type | Examples | Why We Need It |
|-----------|----------|----------------|
| **Account Data** | Email, name, billing country | User identity, communication, tax |
| **Payment Data** | Card details | Billing (stored with payment provider, not us) |
| **Portfolio Data** | Product names, function descriptions, use cases | Core service delivery |
| **Prompt Data** | Prompts used in Sanity Checks | Test current vs recommended models |
| **Usage Data** | Logins, features used, opportunities acted on | Analytics, product improvement |

#### Data Classification

| Data Type | Classification | How We Protect It |
|-----------|----------------|-------------------|
| Email | PII | Encrypted at rest |
| Name | PII | Encrypted at rest |
| Billing Country | PII | Encrypted at rest |
| Payment Details | Sensitive | Never stored - payment provider handles |
| Prompts (Sanity Check) | User Content | Encrypted, user-deletable |
| Portfolio Data | User Content | Encrypted at rest |

#### Retention

| Data Type | Retention Period |
|-----------|------------------|
| Account Data | Account lifetime + 30 days after deletion |
| Prompts | 90 days (or until user deletes) |
| Savings History | Account lifetime |
| Usage Analytics | 2 years |

#### Compliance Requirements

| Regulation | Applies When | Our Obligation |
|------------|--------------|----------------|
| **GDPR** | EU users | Data export, deletion on request, consent, DPA |
| **CCPA** | California users | Opt-out mechanism, disclosure |

#### User Rights

| Right | How We Support It |
|-------|-------------------|
| Access | Export all my data |
| Deletion | Delete my account and all data |
| Correction | Edit account information |
| Portability | Export in standard format |

#### Consent Required

| Consent | When |
|---------|------|
| Terms of Service | At signup |
| Privacy Policy | At signup |
| Marketing emails | Opt-in (not required) |
| Cookie consent | On first visit (if applicable) |

#### Additional Privacy & Compliance Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Prompt Data Disclosure** | Show warning before Sanity Check: "Your prompt will be sent to [provider]. Do not include PII or sensitive data." User must acknowledge. |
| **Third-party LLM Data Processing** | Maintain DPAs with LLM providers (OpenAI, Anthropic, etc.). Document in Privacy Policy which providers receive prompt data. |
| **Portfolio Data Confidentiality** | Classify as confidential. Never share, sell, or use for marketing. State explicitly in Privacy Policy. |
| **Trust Score Disclaimer** | Terms of Service: "Trust scores are ModelOptix assessments based on available data. They are not guarantees. Users should exercise their own judgment." |
| **Admin Audit Logging** | Log all admin actions: who, what, when, affected user. Retain logs for 2 years. |

---

### 2.7 Recommendation Engine

#### How Recommendations Work

ModelOptix generates **Opportunities** when a better model option exists for a user's Use Case. The system calculates a **FitScore** for each potential model and compares it to the current model.

#### FitScore Calculation

```
FitScore = CapabilityMatch × WeightedScore

Where WeightedScore varies by primary_need:
```

| Primary Need | Cost | Speed | Quality | Trust | Context |
|--------------|------|-------|---------|-------|---------|
| **cost** | 0.40 | 0.15 | 0.25 | 0.15 | 0.05 |
| **speed** | 0.15 | 0.40 | 0.25 | 0.15 | 0.05 |
| **accuracy** | 0.15 | 0.10 | 0.45 | 0.20 | 0.10 |
| **context** | 0.10 | 0.10 | 0.25 | 0.15 | 0.40 |

#### Score Components

| Component | How Calculated | Data Source |
|-----------|----------------|-------------|
| **CapabilityMatch** | Binary (0 or 1) - does model meet minimum requirements for use case? | Model capabilities vs use case requirements |
| **CostScore** | Normalized: (cheapest - model) / (cheapest - most expensive) | OpenRouter pricing API |
| **SpeedScore** | Normalized latency score (lower is better) | OpenRouter metrics + own tracking |
| **QualityScore** | Benchmark composite (MMLU, Arena ELO, task-specific) | Artificial Analysis API, Hugging Face |
| **TrustScore** | Composite of 8 dimensions (see Section 2.9) | Automated from multiple sources |
| **ContextScore** | Normalized context window size | OpenRouter model metadata |

#### Opportunity Generation

An Opportunity is created when:

1. **FitScore of alternative > FitScore of current** by at least 10%
2. **AND** one of these thresholds is met:

| Opportunity Type | Threshold |
|------------------|-----------|
| Cost saving | ≥15% AND ≥$10/month |
| Speed improvement | ≥25% faster |
| Quality improvement | ≥15% better benchmark score |
| Context expansion | ≥2x context window |
| Trust improvement | ≥15 points higher trust score |

#### Confidence Scoring

| Confidence | Criteria |
|------------|----------|
| **High** | All data sources fresh (<7 days), benchmark data available, price verified |
| **Medium** | Some data >7 days old OR missing benchmark data |
| **Low** | Data >30 days old OR significant data gaps |

---

### 2.8 Data Sources & Sync

#### Primary Data Sources

| Data Type | Primary Source | Fallback | Refresh Frequency |
|-----------|----------------|----------|-------------------|
| **Model catalog** | OpenRouter API | Manual addition | Daily |
| **Pricing** | OpenRouter API | Provider websites | Daily |
| **Latency/uptime** | Own OpenRouter metrics | OpenRouter status | Real-time (own), hourly (external) |
| **Benchmarks** | Artificial Analysis API | Hugging Face leaderboards | Weekly |
| **Trust scores** | Automated (see 2.9) | N/A | Weekly + event-triggered |

#### Data Freshness Rules

| Data Age | Status | Action |
|----------|--------|--------|
| < 24 hours | Fresh | Display normally |
| 1-7 days | Aging | Display with "last updated" note |
| > 7 days | Stale | Display warning, trigger refresh |
| > 30 days | Critical | Flag model for review, reduce confidence |

#### Fallback Handling

If OpenRouter API is unavailable:
1. Serve cached data (up to 24 hours old)
2. Display "Data may be outdated" warning
3. Alert ops team
4. Disable Sanity Check (requires live API)

---

### 2.9 Trust Score Methodology

#### Canonical Trust Taxonomy (8 Dimensions)

**Model Dimensions (3):**

| Dimension | What We Assess | Data Source | Weight |
|-----------|----------------|-------------|--------|
| **Output Quality** | Accuracy, consistency, benchmark performance | Artificial Analysis, Arena ELO, MMLU | 0.40 |
| **Output Safety** | Guardrails, refusal rates, jailbreak resistance | Safety benchmarks, incident reports | 0.35 |
| **Training Transparency** | Openness about data, methods, limitations | Provider documentation, model cards | 0.25 |

**Provider Dimensions (5):**

| Dimension | What We Assess | Data Source | Weight |
|-----------|----------------|-------------|--------|
| **Uptime** | Service availability, reliability | Status pages, own monitoring | 0.25 |
| **Data Privacy** | Logging policy, retention, training on inputs | ToS analysis, privacy policies | 0.25 |
| **API Stability** | Error rates, deprecation history, breaking changes | Own metrics, changelog analysis | 0.20 |
| **Pricing Transparency** | Clear pricing, no hidden fees, advance notice of changes | Pricing pages, historical tracking | 0.15 |
| **Support Quality** | Response times, documentation quality | Community sentiment, own experience | 0.15 |

#### Score Calculation

```
ModelTrustScore = (OutputQuality × 0.40) + (OutputSafety × 0.35) + (TrainingTransparency × 0.25)

ProviderTrustScore = (Uptime × 0.25) + (DataPrivacy × 0.25) + (APIStability × 0.20) +
                     (PricingTransparency × 0.15) + (SupportQuality × 0.15)

CombinedTrustScore = (ModelTrustScore × 0.50) + (ProviderTrustScore × 0.50)
```

#### Scoring Rubric (0-100 scale)

| Score Range | Meaning | Example |
|-------------|---------|---------|
| 90-100 | Excellent | Full transparency, no incidents, top-tier reliability |
| 70-89 | Good | Minor gaps, occasional issues, generally reliable |
| 50-69 | Acceptable | Some concerns, limited transparency, watch for changes |
| 30-49 | Caution | Significant gaps, history of issues, proceed carefully |
| 0-29 | High Risk | Major concerns, opaque practices, not recommended |

#### Trust Inheritance

When a new model version releases from the same maker:
- **Inherit:** Provider dimensions (same company policies)
- **Reset to baseline:** Model dimensions (new model, unproven)
- **Example:** Claude 3.5 Sonnet inherits Anthropic's provider scores, but gets fresh model scores

#### Update Triggers

| Trigger | Action |
|---------|--------|
| **Weekly refresh** | Re-pull benchmark data, check status pages |
| **ToS change detected** | Flag for review, may trigger Data Privacy re-score |
| **Security incident** | Immediate re-score of affected dimensions |
| **New model version** | Create new model record with inherited provider scores |

---

## Section 3: Features & Requirements

### Feature Areas Overview

| Area | Description | Priority |
|------|-------------|----------|
| **3.1 Onboarding & Auth** | Signup, login, trial, tier selection | P0 |
| **3.2 Portfolio Management** | Products, functions, use cases | P0 |
| **3.3 Opportunities & Sanity Check** | Recommendations, testing, switching | P0 |
| **3.4 Trust Dashboard** | Trust scores, reports, dimensions | P0 |
| **3.5 Savings Tracking** | Savings to Date, history | P0 |
| **3.6 Model Comparison** | Side-by-side comparison | P0 |
| **3.7 Alerts** | Notifications across channels | P1 |
| **3.8 Natural Language Interface** | Command bar, AI interaction | P1 |
| **3.9 Settings & Account** | Preferences, billing, upgrade | P0 |
| **3.10 Admin** | User/model management, metrics | P1 |

**Priority Key:**
- **P0** = Must have for MVP launch
- **P1** = Should have, high value, soon after MVP
- **P2** = Nice to have, future

---

### 3.1 Onboarding & Auth (P0)

#### F-001: New User Signup Flow

**User Story:** As a new visitor, I want to select my tier and billing so I can start using ModelOptix.

**Acceptance Criteria:**

*Tier & Billing Selection:*
- Given I'm a new visitor, When I click "Get Started", Then I select my tier (Solo, Growth default, Pro)
- Given I've selected a tier, When I see payment options, Then Annual (20% off, pay now) is the primary/default offer

*Alternative Path:*
- Given I see the primary offer, When I click "Other options" or "Monthly instead", Then I see:
  - Annual option again (reinforced with "Save X% vs monthly")
  - 7-day trial (monthly billing)
  - FOMO messaging showing features/savings they'd miss

*Annual Path:*
- Given I select Annual, When I proceed, Then OAuth → Card → Charged immediately → Full access

*Trial Path:*
- Given I select 7-day trial, When I proceed, Then OAuth → Card captured → Trial starts → Charged day 8 at monthly rate

*Blocking:*
- Given incomplete signup, When I try to access protected pages, Then I'm redirected to complete signup

**Touched Entities:** User, Subscription

---

#### F-002: Returning User Login

**User Story:** As a returning user, I want to log in quickly and get to my Dashboard.

**Acceptance Criteria:**
- Given I'm on the login page, When I click my OAuth provider (Google/GitHub/Microsoft/Apple), Then I authenticate
- Given OAuth succeeds, When I have an active subscription, Then I go straight to Dashboard
- Given OAuth succeeds, When my subscription has lapsed to Free, Then I go to Dashboard with upgrade prompts

**Touched Entities:** User, Subscription

---

#### F-003: Password Reset (Fallback)

**User Story:** As a user who signed up with email/password, I want to reset my password if I forget it.

**Acceptance Criteria:**
- Given I'm on the login page, When I click "Forgot password" and enter my email, Then the system checks how I signed up
- Given I signed up with email/password, When I submit, Then I receive a reset link
- Given I signed up with OAuth, When I submit, Then I see "You signed up with [Google/GitHub/etc]. Please log in with that provider."
- Given I click a valid reset link, When I enter a new password, Then my password is updated
- Given the link is expired (24h), When I click it, Then I see "Link expired" with option to request new

**Touched Entities:** User

---

### 3.2 Portfolio Management (P0)

#### F-003a: Portfolio Quick Start (NEW)

**User Story:** As a new user, I want to set up my portfolio quickly so I can see value within minutes, not hours.

**Primary Path: OpenRouter Import (Recommended)**

**Acceptance Criteria:**
- Given I'm a new user after signup, When I reach the "Get Started" screen, Then I see two options: "Connect OpenRouter (Recommended)" and "Start from Scratch"
- Given I choose "Connect OpenRouter", When I click it, Then I see an API key input field with instructions on where to find it
- Given I enter a valid OpenRouter API key, When I click "Connect", Then ModelOptix pulls my last 30 days of usage (read-only)
- Given the import succeeds, When complete, Then I see a preview: "Found X models across Y requests. Here's your portfolio:"
- Given the preview shows auto-generated Products/Functions, When I review it, Then I can edit names or remove items before confirming
- Given I click "Looks Good", When confirmed, Then my portfolio is created and I'm taken to the Opportunities page
- Given I have imported data, When on Opportunities, Then I see my first insight within 60 seconds of completing import
- Given the import fails (invalid key, API error), When it fails, Then I see a clear error message and option to try again or use manual setup

**Secondary Path: Quick Add (Fallback)**

**Acceptance Criteria:**
- Given I choose "Start from Scratch", When I click it, Then I enter a minimal 3-step wizard
- Given I'm in the wizard, When on Step 1, Then I enter Product name only (description optional)
- Given I'm in the wizard, When on Step 2, Then I select current model from a searchable list with "Popular" and "Recent" sections
- Given I'm in the wizard, When on Step 3, Then I describe my use case and select primary need (speed/accuracy/cost/context)
- Given I complete the wizard, When I click "Done", Then my first Product/Function/UseCase is created and I see Opportunities
- Given I want to add more later, When on Portfolio page, Then I can use "Add Product" for full manual flow (F-004)

**Tertiary Path: Demo Mode (Optional)**

**Acceptance Criteria:**
- Given I'm hesitant to enter my API key, When on "Get Started", Then I see a small link "See it in action with sample data first"
- Given I click Demo Mode, When it loads, Then I see ModelOptix populated with realistic sample data (3 products, 8 functions)
- Given I'm in Demo Mode, When exploring, Then all features work but data is clearly labeled "Sample Data"
- Given I'm ready to use real data, When I click "Set up my account", Then I return to the import/manual choice

**Touched Entities:** Product, Function, UseCase, OpenRouterConnection

**Time to First Insight Target:** <5 minutes (import path), <10 minutes (manual path)

---

#### F-004: Create Product

**User Story:** As a user, I want to add a product to my portfolio so I can start tracking my AI usage for it.

**Acceptance Criteria:**
- Given I'm on Portfolio, When I click "Add Product", Then I see a form for product name and description
- Given I enter product details, When I submit, Then the product is created and I'm prompted to add a function
- Given I'm at my tier's product limit minus one, When I add a product, Then I see a warning "This is your last product slot on [tier]"
- Given I'm at my tier's product limit, When I try to add, Then I'm blocked with upgrade prompt

**Touched Entities:** Product, UsageTracking

---

#### F-005: Add Function to Product

**User Story:** As a user, I want to add a function to my product so I can track each distinct AI capability separately.

**Acceptance Criteria:**
- Given I'm viewing a product, When I click "Add Function", Then I see a form for function name, description, current model, and current provider
- Given I enter function details, When I submit, Then the function is created and I'm prompted to define its use case
- Given I'm at my tier's total function limit minus one, When I add a function, Then I see a warning "This is your last function slot on [tier]"
- Given I'm at my tier's total function limit, When I try to add, Then I'm blocked with upgrade prompt

**Touched Entities:** Function, UsageTracking

---

#### F-006: Define Use Case for Function

**User Story:** As a user, I want to describe my use case so ModelOptix can match me with the right models.

**Acceptance Criteria:**
- Given I've added a function, When I'm prompted to define use case, Then I see a free text field for description
- Given I'm entering use case, When I see the form, Then I also see optional fields for primary need (speed/accuracy/cost/context) and monthly spend estimate
- Given I submit use case, When saved, Then the function is complete and ready for opportunity generation
- Given I skip use case, When I proceed, Then function is saved but flagged as incomplete (limited recommendations)

**Touched Entities:** UseCase

---

#### F-007: View/Edit Portfolio

**User Story:** As a user, I want to see all my products and functions and update them as my usage evolves.

**Acceptance Criteria:**
- Given I'm on Portfolio, When the page loads, Then I see aggregate "Savings to date" at the top of the page
- Given I'm on Portfolio, When the page loads, Then I see all my products with their functions nested underneath
- Given a product or function has active opportunities, When displayed, Then it shows an opportunity indicator (badge/dot)
- Given I click an opportunity indicator, When clicked, Then I go to Opportunities page filtered to that item
- Given I click a product, When the detail view opens, Then I see product info, all its functions, and edit options
- Given I click "Edit" on a product or function, When the form opens, Then I can update name, description, model, provider, or use case
- Given I save edits, When saved, Then opportunities are re-evaluated for that function

**Touched Entities:** Product, Function, UseCase, Savings

---

#### F-008: Delete Product/Function

**User Story:** As a user, I want to remove products or functions I no longer need.

**Acceptance Criteria:**
- Given I'm viewing a product or function, When I click "Delete", Then I see a confirmation dialog
- Given the confirmation dialog, When shown, Then it warns me the item and its data will be removed
- Given I confirm deletion, When deleted, Then the item is removed and my usage count is updated
- Given a product has functions, When I delete the product, Then all its functions are also deleted
- Given I delete a function, When it's the last function on a product, Then the product remains (but flagged as incomplete)
- Given the deleted item had savings history, When deleted, Then savings records are preserved (orphaned) and still count toward total Savings to Date

**Touched Entities:** Product, Function, UseCase, Opportunity, Savings, UsageTracking

---

### 3.3 Opportunities & Sanity Check (P0)

#### F-009: View Opportunities List

**User Story:** As a user, I want to see all my active opportunities so I can decide which to act on.

**Acceptance Criteria:**
- Given I'm on Opportunities page, When it loads, Then I see a list of all active opportunities across my portfolio
- Given opportunities exist, When displayed, Then each shows: function name, product name, opportunity type (cost/performance/trust), estimated savings, and confidence score
- Given multiple opportunities, When viewing the list, Then they're sorted by estimated savings (highest first)
- Given I have no opportunities, When the page loads, Then I see an empty state with explanation ("No opportunities right now - we're monitoring your portfolio")
- Given I click an opportunity, When clicked, Then I go to the Opportunity Detail page

**Touched Entities:** Opportunity, Function, Product

---

#### F-010: View Opportunity Detail

**User Story:** As a user, I want to see the full details of an opportunity so I can understand the recommendation.

**Acceptance Criteria:**
- Given I'm on Opportunity Detail, When it loads, Then I see the current model/provider vs recommended model/provider
- Given I'm viewing detail, When displayed, Then I see the reasoning for the recommendation and confidence score
- Given the opportunity has alternatives, When displayed, Then I see them listed below the primary recommendation
- Given I'm viewing detail, When displayed, Then I see estimated monthly savings and how it was calculated
- Given the opportunity was flagged more than 24 hours ago, When displayed, Then I see "Estimated impact since flagged: $X" with the date flagged and a subtle growth indicator
- Given I hover on the impact figure, When shown, Then I see a tooltip explaining the calculation methodology
- Given I'm viewing detail, When displayed, Then I see options to: Run Sanity Check, Act on it, or Dismiss

**Touched Entities:** Opportunity, Function, Model, Provider, ModelProviderPricing

---

#### F-011: Run Sanity Check

**User Story:** As a user, I want to test my prompts against the recommended model before switching so I can verify it works for my use case.

**Acceptance Criteria:**
- Given I'm on Opportunity Detail, When I click "Run Sanity Check", Then I see a prompt input form
- Given I've run sanity checks before, When the form loads, Then I see my previous prompts available for reuse
- Given I enter or select a prompt, When I submit, Then I see a privacy warning: "Your prompt will be sent to [provider]. Do not include PII or sensitive data."
- Given I acknowledge the warning, When processed, Then I see side-by-side outputs: current model vs recommended model
- Given I see the outputs, When displayed, Then I have an option "Ask ModelOptix to review"
- Given I click "Ask ModelOptix to review", When processed, Then ModelOptix AI compares the outputs against my use case and provides an assessment
- Given I'm at my tier's monthly sanity check limit, When I try to run one, Then I'm blocked with upgrade prompt

**Touched Entities:** SanityCheck, Opportunity, UseCase, UsageTracking

---

#### F-012: Act on Opportunity (Confirm Switch)

**User Story:** As a user, I want to confirm I've switched to the recommended model so my savings are recorded.

**Acceptance Criteria:**
- Given I'm on Opportunity Detail, When I click "I've made the switch" or "Confirm switch", Then I see a confirmation dialog
- Given confirmation dialog, When shown, Then I see the switch summary: old model → new model, estimated monthly savings
- Given I confirm, When processed, Then the system re-validates the opportunity is still valid (model available, pricing current)
- Given validation passes, When confirmed, Then savings are recorded and opportunity status changes to "Acted On"
- Given validation fails, When checked, Then I see a message explaining what changed and opportunity is invalidated
- Given I confirm the switch, When saved, Then my Savings to Date updates to reflect the new monthly savings

**Touched Entities:** Opportunity, Savings, Function

---

#### F-013: Dismiss Opportunity

**User Story:** As a user, I want to dismiss an opportunity I don't want to act on so it stops appearing in my list.

**Acceptance Criteria:**
- Given I'm on Opportunity Detail or List, When I click "Dismiss", Then I see a confirmation asking why (optional feedback)
- Given I confirm dismissal, When processed, Then opportunity status changes to "Dismissed" and it's removed from active list
- Given I dismissed an opportunity, When viewing dismissed opportunities, Then I can restore it within 30 days
- Given 30 days pass, When the window expires, Then the opportunity status changes to "Expired" and cannot be restored

**Touched Entities:** Opportunity

---

### 3.4 Trust Dashboard (P0)

#### F-014: View Trust Dashboard

**User Story:** As a user, I want to see trust scores for the models and providers I'm using so I can make informed decisions.

**Acceptance Criteria:**
- Given I'm on Trust Dashboard, When it loads, Then I see a summary of trust scores across my portfolio
- Given I have functions set up, When viewing the dashboard, Then I see each function's current model and provider with their trust scores
- Given trust scores are displayed, When shown, Then I see the combined score (0-100) with a visual indicator (e.g., color-coded)
- Given a trust score has changed recently, When displayed, Then I see an indicator showing the change (up/down arrow with delta)
- Given I click on a model or provider, When clicked, Then I go to its trust detail page

**Touched Entities:** Function, Model, Provider, ModelTrustScore, ProviderTrustScore

---

#### F-015: View Model Trust Details

**User Story:** As a user, I want to see the breakdown of a model's trust score so I understand what's driving it.

**Acceptance Criteria:**
- Given I'm on Model Trust Detail, When it loads, Then I see the model's overall trust score and the Model Maker
- Given I'm viewing detail, When displayed, Then I see scores for each model dimension: Provenance, Output Safety, Training Transparency
- Given each dimension is shown, When displayed, Then I see the score (0-100), evidence summary, and confidence level
- Given I want more detail, When I click a dimension, Then I see expanded evidence and last verified date
- Given this model is used in my portfolio, When viewing, Then I see which of my functions use it

**Touched Entities:** Model, ModelMaker, ModelTrustScore, TrustDimension, Function

---

#### F-016: View Provider Trust Details

**User Story:** As a user, I want to see the breakdown of a provider's trust score so I understand their data handling practices.

**Acceptance Criteria:**
- Given I'm on Provider Trust Detail, When it loads, Then I see the provider's overall trust score
- Given I'm viewing detail, When displayed, Then I see scores for each provider dimension: Data Privacy, Data Residency, Security Posture, Regulatory Compliance, Accountability
- Given each dimension is shown, When displayed, Then I see the score (0-100), evidence summary, and confidence level
- Given I want more detail, When I click a dimension, Then I see expanded evidence and last verified date
- Given this provider is used in my portfolio, When viewing, Then I see which of my functions use it

**Touched Entities:** Provider, ProviderTrustScore, TrustDimension, Function

---

### 3.5 Savings Tracking (P0)

#### F-017: View Value Summary (Dashboard)

**User Story:** As a user, I want to see the value ModelOptix has delivered so I can confirm it's worth the subscription.

**Acceptance Criteria:**

*Cost Savings (Primary for high-spenders):*
- Given I'm on Dashboard, When it loads, Then I see "Value Delivered" section prominently displayed
- Given my total savings > $10/month, When displayed, Then "Savings to Date" is shown prominently with dollar amount
- Given I have recent savings, When displayed, Then I see a breakdown: this month vs all time
- Given I click on the savings summary, When clicked, Then I go to the full Value History page

*Performance Gains (Primary for low-spenders):*
- Given my monthly AI spend is low (<$20/mo) or unknown, When dashboard loads, Then I see "Performance Gains" emphasized over savings
- Given I've acted on quality/speed recommendations, When displayed, Then I see "Quality improved by X%" or "Speed improved by X%" based on benchmark comparisons
- Given I haven't saved money but got better performance, When displayed, Then I see "Same cost, X% better results" framing

*Trust Protection (For all users):*
- Given I've viewed Trust Dashboard or acted on trust alerts, When displayed, Then I see "Trust Score Monitoring: X models watched"
- Given a trust alert was raised and I acted on it, When displayed, Then I see "Protected from X trust issues"

*No Value Yet:*
- Given I have no savings and no performance gains yet, When displayed, Then I see "Act on opportunities to see your value delivered"

*ROI Calculation (for all users):*
- Given I'm a paid user, When viewing Value Summary, Then I see "ROI: [X]x your subscription cost" if positive
- Given savings < subscription cost but performance improved, When displayed, Then ROI shows "Cost neutral + performance gains"

**Touched Entities:** Savings, User, Opportunity, TrustAlert

---

#### F-018: View Savings History

**User Story:** As a user, I want to see my complete savings history so I can track my optimization journey over time.

**Acceptance Criteria:**
- Given I'm on Savings History page, When it loads, Then I see a list of all savings events chronologically
- Given savings events are shown, When displayed, Then each shows: date, function name, old model → new model, monthly savings amount
- Given I have multiple months of data, When viewing, Then I see a chart showing savings growth over time
- Given I want to filter, When I use filters, Then I can filter by product, function, or date range
- Given a function was deleted, When viewing its savings, Then the savings still appear but marked as "(deleted function)"

**Touched Entities:** Savings, Function, Product, Model, Provider

---

### 3.6 Model Comparison (P0)

#### F-019: Compare Models Side-by-Side

**User Story:** As a user, I want to compare models side-by-side so I can evaluate options beyond just what's recommended.

**Acceptance Criteria:**

*Use Case Recommendations:*
- Given I'm on Compare page, When it loads, Then I see an option "Find models for a use case"
- Given I click "Find models for a use case", When I describe my use case, Then I see recommended models ranked by fit
- Given recommendations are shown, When displayed, Then I can select any to add to comparison

*Manual Comparison:*
- Given I'm on Compare page, When I want to browse, Then I can select 2-4 models to compare manually
- Given I'm selecting models, When searching, Then I can search/filter by name, model maker, or capability
- Given models are selected, When displayed, Then I see a comparison table with: pricing (by provider), context window, capabilities, trust scores
- Given pricing is shown, When displayed, Then I see prices across multiple providers for each model
- Given I want to narrow down, When viewing, Then I can toggle which attributes/columns are visible
- Given I find a model I want to use, When I click "Use for function", Then I can assign it to one of my functions

*Future Enhancement (P1):*
- Natural Language Interface will allow asking "What model should I use for X?" from anywhere in the app

**Touched Entities:** Model, ModelMaker, Provider, ModelProviderPricing, ModelCapability, ModelTrustScore, ProviderTrustScore, UseCase

---

### 3.7 Alerts (P1)

#### F-024: View Alerts List

**User Story:** As a user, I want to see all my alerts in one place so I don't miss important updates.

**Acceptance Criteria:**
- Given I'm on Alerts page, When it loads, Then I see a list of all alerts chronologically (newest first)
- Given alerts are displayed, When shown, Then each shows: type icon, title, message preview, timestamp, read/unread status
- Given I have unread alerts, When viewing nav, Then I see an unread count badge on the Alerts nav item
- Given I click an alert, When clicked, Then it marks as read and navigates to the related item (opportunity, model, etc.)
- Given I want to clear alerts, When I click "Mark all as read", Then all alerts are marked read
- Given I have many alerts, When scrolling, Then alerts paginate or infinite scroll

**Touched Entities:** Alert, User

---

#### F-025: Receive Real-time Alerts

**User Story:** As a paid user, I want to receive alerts in real-time across my configured channels so I can act quickly.

**Acceptance Criteria:**
- Given I'm a paid user (Solo/Growth/Pro), When an alert is triggered, Then I receive it via my configured channels (Email, Slack, Discord)
- Given an alert is sent to Slack/Discord, When delivered, Then it includes: title, summary, and direct link to the item
- Given an alert is sent to Email, When delivered, Then it includes: formatted message with clear call-to-action button
- Given I receive an alert, When I click the link, Then I'm taken directly to the relevant page in ModelOptix
- Given multiple alerts occur in quick succession, When sending, Then they're batched within a 5-minute window to prevent spam

**Touched Entities:** Alert, NotificationPreferences, User

---

#### F-026: Receive Weekly Digest (Free tier)

**User Story:** As a Free tier user, I want to receive a weekly summary so I stay informed without real-time alerts.

**Acceptance Criteria:**
- Given I'm on Free tier, When a week passes, Then I receive a digest email summarizing activity
- Given the digest is sent, When it contains content, Then it includes: new opportunities (if any), price changes affecting my portfolio, any trust score changes
- Given the digest is sent, When displayed, Then it shows a "Upgrade for real-time alerts" prompt
- Given I have no activity to report, When the week passes, Then I still receive a brief "All quiet" email with tips to get more value
- Given the digest is scheduled, When sent, Then it goes out on Monday mornings (user's timezone if known)

**Touched Entities:** Alert, User, Subscription

---

### 3.8 Natural Language Interface (P1)

#### F-027: Command Bar (⌘K)

**User Story:** As a user, I want to access a command bar from anywhere so I can navigate and take actions quickly.

**Acceptance Criteria:**
- Given I'm on any page, When I press ⌘K (or Ctrl+K), Then the command bar opens
- Given the command bar is open, When I start typing, Then I see suggestions: pages, recent items, actions
- Given I type a page name (e.g., "portfolio"), When shown, Then I can select it to navigate directly
- Given I type a product or function name, When shown, Then I can select it to go to that item
- Given I press Escape, When the bar is open, Then it closes
- Given I'm on mobile, When viewing, Then the command bar is accessible via a persistent input or icon

**Touched Entities:** User

---

#### F-028: Natural Language Queries

**User Story:** As a user, I want to ask questions in plain English so I can get answers without navigating around.

**Acceptance Criteria:**
- Given the command bar is open, When I type a question, Then the system recognizes it as a query (not navigation)
- Given I ask "What's my biggest opportunity?", When processed, Then I see the highest-value opportunity with a link to it
- Given I ask "How much have I saved?", When processed, Then I see my Savings to Date summary
- Given I ask "What model should I use for sentiment analysis?", When processed, Then I see model recommendations based on that use case
- Given I ask about my portfolio (e.g., "Show me Trader-7's functions"), When processed, Then I see relevant portfolio data
- Given the query can't be understood, When processed, Then I see helpful suggestions for what I can ask

**Touched Entities:** User, Portfolio, Opportunity, Savings, Model, UseCase

---

#### F-029: AI-Assisted Actions

**User Story:** As a user, I want to take actions through natural language so I can work faster.

**Acceptance Criteria:**
- Given the command bar is open, When I type an action (e.g., "Add a new product called X"), Then the system recognizes it as an action request
- Given I request to add a product/function, When processed, Then the system pre-fills the form and asks me to confirm
- Given I request to compare models (e.g., "Compare GPT-4 and Claude"), When processed, Then I'm taken to Compare page with those models selected
- Given I request something destructive (e.g., "Delete Trader-7"), When processed, Then the system shows confirmation with impact summary before proceeding
- Given an action requires more info, When processed, Then the system asks a follow-up question in the command bar
- Given the action isn't supported, When processed, Then I see "I can't do that yet" with what actions are available

**Touched Entities:** User, Product, Function, Model

---

### 3.9 Settings & Account (P0)

#### F-020: View/Edit Account Settings

**User Story:** As a user, I want to view and update my account information so it stays current and secure.

**Acceptance Criteria:**

*Profile Section:*
- Given I'm on Settings/Account, When it loads, Then I see my profile info: name, email, linked OAuth provider (read-only)
- Given I want to edit, When I click edit, Then I can update my name
- Given I want to change email, When I attempt, Then I'm guided through email verification with re-authentication required

*Usage Section:*
- Given I'm viewing account, When displayed, Then I see my current tier and usage stats as progress bars (e.g., "3/5 products used")

*Security Section:*
- Given I'm viewing account, When displayed, Then I see my active sessions (device, location, last active)
- Given I see other sessions, When I click "Sign out other devices", Then all other sessions are terminated

*Danger Zone:*
- Given I want to delete my account, When I click "Delete account", Then I see a confirmation requiring re-authentication
- Given I confirm deletion, When prompted, Then I see option to export data first, then data deletion warning

**Touched Entities:** User, Subscription, UsageTracking, Session

---

#### F-021: Manage Subscription (Upgrade/Downgrade)

**User Story:** As a user, I want to upgrade or downgrade my subscription so I can adjust to my needs.

**Acceptance Criteria:**

*Upgrade:*
- Given I'm on Settings/Upgrade, When it loads, Then I see all tiers with my current tier highlighted
- Given I select a higher tier, When I click upgrade, Then I see prorated pricing and confirm payment
- Given I confirm, When processed, Then my tier upgrades immediately with full access

*Downgrade:*
- Given I select a lower tier, When I click downgrade, Then I see impact summary: "X products will be frozen, Y functions will be frozen"
- Given I confirm downgrade, When processed, Then downgrade takes effect at end of current billing period
- Given downgrade is pending, When viewing account, Then I see "Downgrading to [tier] on [date]" with option to cancel

*Cancel:*
- Given I want to cancel, When I click "Cancel subscription", Then I see what I'll lose and option to downgrade instead
- Given I confirm cancel, When processed, Then subscription remains active until period end, then downgrades to Free

**Touched Entities:** Subscription, Product, Function, UsageTracking

---

#### F-022: View Billing & Invoices

**User Story:** As a user, I want to view my billing history and manage payment methods so I can track my spending.

**Acceptance Criteria:**
- Given I'm on Settings/Billing, When it loads, Then I see my current payment method (last 4 digits, expiry)
- Given I want to update payment, When I click "Update payment method", Then I'm taken to secure payment form
- Given I'm viewing billing, When displayed, Then I see my billing cycle and next payment date/amount
- Given I have invoices, When viewing, Then I see a list of past invoices with date, amount, and status
- Given I click an invoice, When clicked, Then I can download it as PDF

**Touched Entities:** Subscription, User

---

#### F-023: Configure Notification Preferences

**User Story:** As a user, I want to control how and when I receive notifications so I'm not overwhelmed.

**Acceptance Criteria:**
- Given I'm on Settings/Notifications, When it loads, Then I see notification options by channel: Email, Slack, Discord
- Given I'm on Free tier, When viewing, Then I see alerts disabled with note "Alerts available on paid plans" (digest is P1 feature F-026)
- Given I'm on paid tier, When viewing, Then I can enable/disable real-time alerts per channel
- Given Slack/Discord is available, When I click "Connect", Then I'm guided through webhook setup
- Given I configure preferences, When I set alert types, Then I can choose which alerts I receive: new opportunities, price changes, trust changes, new models
- Given I save preferences, When saved, Then my notification settings are updated immediately

**Touched Entities:** NotificationPreferences, User, Subscription

---

### 3.10 Admin (P1)

#### F-030: Admin Dashboard

**User Story:** As an admin, I want to see key metrics at a glance so I can monitor the health of the business.

**Acceptance Criteria:**
- Given I'm an admin, When I access /admin, Then I see the Admin Dashboard
- Given I'm viewing the dashboard, When it loads, Then I see key metrics: total users, active subscriptions by tier, MRR, churn rate
- Given I'm viewing the dashboard, When displayed, Then I see user activity: new signups (7d), trial conversions, recent cancellations
- Given I'm viewing the dashboard, When displayed, Then I see product health: total opportunities generated, acted on rate, total savings delivered
- Given I want more detail, When I click a metric, Then I go to the relevant admin page with filtered data
- Given I'm not an admin, When I try to access /admin, Then I'm blocked with "Access denied"

**Touched Entities:** User, Subscription, Opportunity, Savings

---

#### F-031: User Management

**User Story:** As an admin, I want to view and manage users so I can support customers and handle issues.

**Acceptance Criteria:**
- Given I'm on Admin/Users, When it loads, Then I see a searchable list of all users
- Given I'm searching, When I enter a query, Then I can search by email, name, or subscription tier
- Given I click a user, When viewing detail, Then I see: profile info, subscription status, usage stats, portfolio summary, savings to date
- Given I need to help a user, When I click "Impersonate", Then I can view the app as that user (read-only, logged for audit)
- Given I need to adjust a subscription, When I click "Manage subscription", Then I can upgrade, downgrade, extend trial, or apply credit
- Given any admin action is taken, When processed, Then it's logged with admin ID, action, timestamp, affected user

**Touched Entities:** User, Subscription, UsageTracking, AuditLog

---

#### F-032: Model/Provider Management

**User Story:** As an admin, I want to manage models and providers so the platform stays current with the AI landscape.

**Acceptance Criteria:**

*Model Management:*
- Given I'm on Admin/Models, When it loads, Then I see a list of all models with Model Makers and staleness indicator
- Given I want to add a model, When I click "Add Model", Then I can enter: name, model maker, version, context window, max output tokens, training cutoff, multimodal support, capabilities, release date, deprecation date
- Given I add/edit data, When saving, Then I record the source (official docs, user-reported, scraped) and last verified date
- Given a model has aliases, When editing, Then I can add alternative names (e.g., GPT-4o = gpt-4o-2024-08-06)

*Provider Management:*
- Given I want to add a provider, When I click "Add Provider", Then I can enter: name, website, API base URL, regional availability
- Given I want to update pricing, When I select a model/provider, Then I can add/edit: standard pricing, batch API pricing, latency, rate limits

*Capabilities:*
- Given I want to manage capabilities, When I access capabilities, Then I can add/edit definitions and assign strength scores to models

*Deprecation Workflow:*
- Given a model is being sunset, When I set deprecation date, Then users with that model get alerts before the date

*Bulk Operations:*
- Given I have many updates, When I click "Import", Then I can bulk import via CSV/JSON
- Given I need to export, When I click "Export", Then I can download all model/provider data

*Audit & Quality:*
- Given any change is made, When saved/published, Then it's logged with admin ID, action, timestamp, previous value
- Given data is stale (not verified in 30 days), When viewing list, Then I see a staleness warning
- Given I update model/pricing data, When saved, Then opportunities are re-evaluated for affected functions

**Touched Entities:** Model, ModelMaker, Provider, ModelProviderPricing, Capability, ModelCapability, AuditLog

---

#### F-033: Trust Score Management

**User Story:** As an admin, I want to manage trust scores with appropriate controls so users have accurate, defensible trustworthiness data.

**Acceptance Criteria:**

*Viewing Scores:*
- Given I'm on Admin/Trust, When it loads, Then I see trust scores by Model and by Provider
- Given I select a model, When viewing, Then I see scores for each dimension: Provenance, Output Safety, Training Transparency
- Given I select a provider, When viewing, Then I see scores for each dimension: Data Privacy, Data Residency, Security Posture, Regulatory Compliance, Accountability

*Editing Scores:*
- Given I edit a score, When editing, Then I enter: score (0-100), evidence summary, confidence level (High/Medium/Low with defined criteria), source URL
- Given I save edits, When saved, Then changes are saved as draft (no alerts triggered yet)
- Given I have draft changes, When viewing, Then I see a diff of what changed vs current published scores

*Publishing & Approval:*
- Given I'm ready to publish, When I click "Submit for Review", Then a second admin is notified to approve
- Given I'm a second admin, When I review changes, Then I see the diff, evidence, and can approve or reject with comments
- Given changes are approved, When published, Then scores go live, last verified date updates, and change is logged
- Given a trust score changes significantly, When published, Then affected users receive alerts and opportunities are re-evaluated

*Audit:*
- Given any change is made, When saved/published, Then it's logged with admin ID, action, timestamp, previous value, approval chain

**Touched Entities:** ModelTrustScore, ProviderTrustScore, TrustDimension, AuditLog, Alert

---

#### F-034: Admin API (Agentic)

**User Story:** As an admin, I want to perform admin tasks via API so I can automate operations and use agentic tools.

**Acceptance Criteria:**
- Given I'm an authenticated admin, When I call /api/admin/*, Then I can perform admin operations programmatically
- Given I call /api/admin/users, When requesting, Then I can search, view, and manage users
- Given I call /api/admin/models, When requesting, Then I can CRUD models, providers, pricing
- Given I call /api/admin/trust, When requesting, Then I can view and update trust scores (still requires two-person approval via API)
- Given I call /api/admin/metrics, When requesting, Then I can query analytics data
- Given I call /api/admin/promotions, When requesting, Then I can manage promotion codes
- Given any API call is made, When processed, Then it's logged with admin ID, action, timestamp

**Touched Entities:** User, Model, Provider, ModelProviderPricing, ModelTrustScore, ProviderTrustScore, AuditLog

---

#### F-035: Promotion Code Management

**User Story:** As an admin, I want to create and manage promotion codes so we can run marketing campaigns and partnerships.

**Acceptance Criteria:**

*Creating Codes:*
- Given I'm on Admin/Promotions, When I click "Create Code", Then I can enter: code string, discount type (percentage or fixed), discount amount, applicable tiers
- Given I create a code, When setting limits, Then I can set: usage limit (total), per-user limit, expiration date, minimum commitment (monthly/annual)
- Given I create a code, When saving, Then the code is active and ready for use

*Managing Codes:*
- Given I'm on Admin/Promotions, When it loads, Then I see all codes with: status, usage count, discount, expiration
- Given I view a code, When viewing detail, Then I see usage history (who used it, when, which tier)
- Given I want to deactivate, When I click "Deactivate", Then the code stops working immediately

*Checkout Integration:*
- Given a user is on checkout, When they enter a valid code, Then discount is applied and shown in summary
- Given a code is invalid/expired/maxed, When entered, Then user sees clear error message
- Given a code is used, When checkout completes, Then usage is recorded and counts toward limits

**Touched Entities:** PromotionCode, Subscription, User, AuditLog

---

## Section 4: Testing & Validation

### 4.1 Testing Categories

| Category | Purpose | Scope |
|----------|---------|-------|
| **Functional Testing** | Verify features work as specified | All 35 features |
| **Integration Testing** | Verify systems work together | OAuth, Payments, LLM APIs, Webhooks |
| **User Journey Testing** | Verify end-to-end flows | Critical paths |
| **Edge Case Testing** | Verify boundary conditions | Tier limits, payment failures, data edge cases |
| **Compliance Testing** | Verify privacy/security requirements | GDPR, CCPA, data handling |

### 4.2 Critical User Journeys to Validate

| Journey | Features Involved | Success Criteria |
|---------|-------------------|------------------|
| **New User → First Savings** | F-001, F-004, F-005, F-006, F-009, F-011, F-012 | User signs up, adds product/function, sees opportunity, runs sanity check, confirms switch, sees savings |
| **Trial → Paid Conversion** | F-001, F-021 | User completes trial, card charged on day 8, access continues |
| **Upgrade/Downgrade** | F-021 | User upgrades (immediate access), user downgrades (freezes at period end) |
| **Trust Investigation** | F-014, F-015, F-016 | User sees trust scores, drills into details, understands evidence |
| **Model Discovery** | F-019 | User describes use case, gets recommendations, compares models |
| **Alert Response** | F-024, F-025, F-010 | User receives alert, clicks through, lands on relevant opportunity |
| **Account Deletion** | F-020 | User exports data, confirms deletion, all data removed, savings preserved in aggregate |
| **Proactive Opportunity Review** | F-007, F-009, F-010 | User checks Portfolio, sees opportunity indicator, investigates, acts |
| **Update Use Case** | F-007, F-006 | User edits function's use case, opportunities re-evaluated |
| **Add New Feature** | F-005, F-006 | User adds function to existing product, defines use case, gets recommendations |
| **No Opportunities Found** | F-004, F-005, F-006, F-007 | User adds product/function but no opportunities exist; sees helpful explanation and next steps, trust maintained |
| **Billing Issue Resolution** | F-022, F-021 | Payment fails, user notified, updates card, subscription restored without data loss |
| **Recommendation Rejection** | F-010, F-013 | User views opportunity, dismisses it; system records feedback, opportunity can be restored later, user stays engaged |

### 4.3 Edge Cases & Boundary Conditions

**Tier Limits:**

| Scenario | Expected Behavior |
|----------|-------------------|
| User at product limit minus 1, adds product | Warning shown, product added |
| User at product limit, tries to add | Blocked with upgrade prompt |
| User at function limit minus 1, adds function | Warning shown, function added |
| User at function limit (total), tries to add | Blocked with upgrade prompt |
| User at sanity check limit, tries to run | Blocked with upgrade prompt |
| User upgrades tier mid-session | New limits reflected immediately without re-login |
| User downgrades tier mid-session | Current limits remain until period end, visual indicator of pending change |

**Tier Feature Restrictions:**

| Scenario | Expected Behavior |
|----------|-------------------|
| Free user tries to connect Slack/Discord | Blocked with upgrade prompt |
| Free user tries to enable real-time alerts | Blocked with upgrade prompt (no alerts on Free in MVP) |
| Free user accesses Alerts page | Shows "Alerts coming soon" or upgrade prompt (F-026 digest is P1) |
| User on any tier accesses P1 feature before launch | Feature hidden or "Coming soon" message |

**Authentication:**

| Scenario | Expected Behavior |
|----------|-------------------|
| OAuth fails mid-signup | Error message, option to retry or try different provider |
| User completes OAuth but abandons before card capture | Account created but incomplete; blocked from protected pages; can resume |
| OAuth token expires during session | Prompt to re-authenticate, session preserved |
| OAuth provider revokes access | Prompt to re-link or use different provider |
| Brute force login attempts | Rate limiting after 5 failed attempts, temporary lockout, CAPTCHA |
| Multiple OAuth providers same email | Reject with message: "Account already exists with this email via [provider]" |
| User deletes their OAuth account (e.g., GitHub) | Next login fails; prompt to contact support or link different provider |
| Deleted user attempts access with cached token | Token invalidated, access denied, redirect to login |

**Payment & Subscription:**

| Scenario | Expected Behavior |
|----------|-------------------|
| Trial ends day 8, valid card | Card charged, subscription active |
| Trial ends day 8, card declined | Retry 3x, then downgrade to Free |
| User cancels during trial | Immediate downgrade to Free, no charge |
| User cancels paid subscription | Active until period end, then Free |
| Downgrade with products over new limit | Show impact, freeze excess at period end |
| Payment method expires | Notify user, retry, eventually Free |
| Promo code applied at checkout | Discount shown, applied to charge |
| Invalid/expired promo code | Clear error, no discount |
| Annual user cancels within 30 days of signup | Full refund issued, downgrade to Free |
| Trial user cancels within 30 days of trial start (post day-8 charge) | Full refund issued, downgrade to Free |
| User requests refund after 30-day guarantee period | No refund, active until period end, then Free |
| User files chargeback | Immediate account suspension, access revoked |
| User requests second 30-day refund (lifetime) | Denied - one guarantee per customer |
| Same payment method used for second trial | Blocked - 1 trial per payment method |
| User upgrades mid-cycle (e.g., Solo to Growth) | Prorate charge, new tier effective immediately |
| Upgrade payment fails | Stay on current plan, show retry option |

**Data Edge Cases:**

| Scenario | Expected Behavior |
|----------|-------------------|
| User deletes function with savings history | Function removed, savings preserved (orphaned), counts toward total |
| User deletes only function on product | Product remains, flagged incomplete |
| Opportunity becomes invalid after user views | Re-validate on action, show "no longer valid" |
| Model deprecated while user has it assigned | Alert sent, opportunity generated to switch |
| Trust score changes significantly | Alert sent, opportunities re-evaluated |
| New user, no data yet | Onboarding flow, helpful empty state with prompts to add first product |
| All opportunities completed/dismissed | "All optimized" empty state with encouragement |
| New model added with no trust score | Displayed as "Trust score pending" or "Not yet assessed", user can still assign |
| User deletes product with multiple functions | Confirmation shows cascade impact, all child data removed, savings preserved |
| User account deleted | PII anonymized, aggregate savings preserved for reporting, data removed within 30 days |
| Provider deprecated entirely | Prioritized alerts to affected users, bulk opportunities generated, dashboard warning |

### 4.4 Integration Test Scenarios

| Integration | Test Scenario | Success Criteria |
|-------------|---------------|------------------|
| **OAuth (Google/GitHub/MS/Apple)** | Complete signup flow with each provider | User authenticated, account created |
| **OAuth** | Provider unavailable/timeout | Graceful error message, retry option, no stuck state |
| **Payment (Stripe)** | Charge card, webhook received | Payment confirmed, subscription updated |
| **Payment (Stripe)** | Card declined, retry logic | Retries occur, eventually downgrades |
| **Payment (Stripe)** | Webhook signature validation | Invalid/spoofed webhooks rejected |
| **Payment (Stripe)** | Sync on startup/reconnect | Missed webhooks reconciled, subscription status accurate |
| **LLM API (Sanity Check)** | Send prompt, receive responses | Both model outputs returned, displayed |
| **LLM API (Sanity Check)** | PII sanitization | Sensitive data scrubbed before sending to external LLM |
| **LLM API** | Timeout handling (30-60s) | User sees progress indicator, graceful timeout message |
| **LLM API** | Rate limit hit | Backoff applied, user notified, request queued or retried |
| **LLM API (NLI)** | Natural language query | Relevant response returned |
| **Webhooks (Slack)** | Send alert to Slack | Message delivered with correct format |
| **Webhooks (Discord)** | Send alert to Discord | Message delivered with correct format |
| **Email (Transactional)** | Send alert email | Email delivered, links work |
| **Email (Digest)** | Weekly digest sent | Email delivered on Monday, correct content |

### 4.5 Compliance Validation

| Requirement | Test Scenario | Success Criteria |
|-------------|---------------|------------------|
| **Data Export (GDPR)** | User requests export | Complete data package delivered |
| **Data Deletion (GDPR)** | User deletes account | All PII removed within 30 days |
| **Data Retention Enforcement** | Retention period expires | Data automatically purged per policy (prompts 90 days, analytics 2 years) |
| **Right to Rectification (GDPR)** | User corrects personal data | Data updated, changes reflected across system |
| **Consent Collection** | New user signup | ToS and Privacy Policy acknowledged before access |
| **DPA Acknowledgment** | User runs first Sanity Check | Separate DPA consent for third-party LLM processing accepted |
| **LLM Provider Disclosure** | User runs Sanity Check | Specific LLM provider name shown before prompt sent |
| **Prompt Data Warning** | User runs Sanity Check | Warning shown and acknowledged before prompt sent |
| **CCPA Opt-Out** | California user requests opt-out | "Do Not Sell My Personal Information" mechanism works, choice respected |
| **Cookie Consent** | First visit (if applicable) | Consent banner shown, choice respected |
| **Payment Data Isolation (PCI)** | Payment flow | No raw card data touches our systems, Stripe handles all |
| **Admin Audit Log** | Admin takes action | Action logged with who, what, when |
| **Trust Score Disclaimer** | User views trust scores | Disclaimer accessible in ToS |

### 4.6 Quality Gates

Before MVP launch, the following must pass:

| Gate | Criteria |
|------|----------|
| **P0 Features Complete** | All 23 P0 features implemented and tested |
| **Critical Journeys Pass** | All 13 critical user journeys work end-to-end |
| **Integration Tests Pass** | All external integrations verified |
| **Edge Cases Handled** | Tier limits, payment, auth, data edge cases covered |
| **Compliance Verified** | GDPR/CCPA requirements met, audit logging active |
| **Performance Baseline** | Dashboard loads < 3s, Sanity Check completes < 30s |
| **Security Review** | Auth, payment, data handling reviewed |
| **Data Backup & Recovery** | Backup exists and restore process tested successfully |
| **Rollback Capability** | Can revert bad deploy in < 15 minutes, tested |
| **Graceful Degradation** | When dependencies fail (LLM/Stripe/OAuth), users see helpful errors |
| **Monitoring & Alerting** | Dashboards live, alerts configured, tested |
| **Rate Limiting Active** | Abuse prevention in place, tested against bot/bad actor scenarios |

### 4.7 Acceptance Testing Approach

| Phase | Who | What |
|-------|-----|------|
| **Internal Testing** | Developer/Admin | Functional tests, integration tests, payment edge cases |
| **Dogfooding** | Founder (Jamie) | Real usage 1-2 weeks minimum, document friction points |
| **Beta Testing** | 5-10 invited users | Real usage, track conversion funnel, exit survey, define exit criteria |
| **Pre-Launch** | 2-3 engaged beta users | Willingness-to-pay conversations, pricing validation |
| **Launch** | Public | Monitor metrics, rapid response, rollback plan ready |

**Beta Exit Criteria (example):**
- Zero critical bugs for 7 consecutive days
- 80% of beta users complete core workflow (signup → first opportunity → sanity check)
- No unresolved payment or auth issues

**Exit Survey Question:**
- "What almost stopped you from trying this?"

---

## Section 5: Roadmap & Milestones

### 5.1 Release Phases

| Phase | Focus | Features |
|-------|-------|----------|
| **MVP (P0)** | Core value delivery | F-001 to F-023 (Onboarding, Portfolio, Opportunities, Trust, Savings, Compare, Settings) |
| **Phase 2 (P1)** | Engagement & Scale | F-024 to F-035 (Alerts, Natural Language Interface, Admin) |
| **Phase 3 (P2)** | Expansion | Team features, API access, additional integrations |

### 5.2 MVP Milestones

| Milestone | Definition of Done | Track |
|-----------|-------------------|-------|
| **M0a: Pre-Launch Presence** | Landing page live, waitlist capture working, "taste of value" content published (e.g., free trust scores preview, sample opportunity analysis) | Marketing |
| **M0b: Infrastructure** | DB, OAuth, Stripe, Email integrated, staging works | Technical |
| **M1: Auth, Account & Billing** | F-001 to F-003, F-020 to F-023 - complete signup-to-billing flow | Technical |
| **M2: Portfolio Foundation** | F-004 to F-008 - portfolio management | Technical |
| **M3: Core Value Loop** | F-009 to F-016 - opportunities, sanity check, trust | Technical |
| **M4: Proof of Value** | F-017 to F-019 - savings tracking, model comparison | Technical |
| **M5: Trial Experience** | Trial countdown visible, upgrade prompts at key moments, downgrade to free tier works | Technical |
| **M6: Quality Complete** | All P0 quality gates pass, internal testing done | Technical |
| **M7: Launch Ready** | Dogfooding complete (1-2 weeks), beta exit criteria met | Technical |

### 5.3 Milestone Dependencies

```
M0a: Pre-Launch Presence ──────────────────────────────────┐
                                                           ├──→ M7: Launch Ready
M0b: Infrastructure ──→ M1 ──→ M2 ──→ M3 ──→ M4 ──→ M5 ──→ M6 ──┘
```

**Key dependencies:**
- M0a (Marketing) and M0b (Infrastructure) can run in parallel
- M1-M6 are sequential - each builds on the previous
- M7 requires both M0a (audience ready) and M6 (product ready)

**Phase 2 dependencies (P1 features):**
- Alerts (F-024 to F-026) require M3 complete (opportunities exist to alert on)
- Natural Language Interface (F-027 to F-029) requires M2-M4 complete (needs data to query)
- Admin (F-030 to F-035) can start after M1 (needs auth/user system)

### 5.4 Post-MVP Roadmap

| Phase | Focus | Key Features | Trigger to Start |
|-------|-------|--------------|------------------|
| **Phase 2 (P1)** | Engagement & Scale | Alerts, Natural Language Interface, Admin dashboard | MVP stable, 50+ active users |
| **Phase 3 (P2)** | Expansion | Team features (shared portfolios, role-based access), API access, additional integrations | Phase 2 stable, revenue covers costs |
| **Phase 4 (Future)** | Enterprise | SSO, dedicated support, custom trust weights, SLAs | Proven demand from larger customers |

**Deferred features (flagged in earlier sections):**
- Manual product pause feature
- Trial edge case documentation
- Advanced analytics/reporting

---

## Section 6: Metrics & Success

### 6.1 North Star Metric

| Metric | Definition | Target |
|--------|------------|--------|
| **Trust Engagement Rate** (North Star) | Users who view Trust Dashboard or Trust Reports for at least 1 product per month | 70% of paying users |
| **Savings Realized** (Supporting) | Users who acted on recommendation and achieved measurable savings | 40% of paying users |

**Why this metric:** Trust engagement is the primary value prop ("Consumer Reports for AI"). Savings realized proves the secondary value (cost optimization) is landing.

### 6.2 Funnel Metrics

| Stage | Metric | Target |
|-------|--------|--------|
| **Awareness** | Landing page visitors | Baseline, +10% MoM |
| **Interest** | Waitlist signups | 5% of visitors |
| **Activation** | Trial starts | 50% of waitlist |
| **Engagement** | Time to first value (savings shown) | 80% within 1 hour |
| **Conversion** | Trial → Paid | 25% baseline, 45% stretch |
| **Revenue** | ARPU | >$15/mo |
| **Revenue** | Annual vs monthly mix | >70% annual |
| **Retention** | Month 2 retention | 85% |
| **Retention** | Gross monthly churn | <4% |
| **Expansion** | Net Revenue Retention | >110% |
| **Expansion** | Tier upgrades | 12% within 90 days |

### 6.3 Health Indicators

Leading indicators to monitor weekly:

| Indicator | Warning Threshold | Action |
|-----------|-------------------|--------|
| **Time-to-First-Insight** | >10 minutes | Simplify onboarding flow |
| **Day 1 login rate** | <70% | Review onboarding email timing |
| **Day 1 product connection** | <60% | Review connection flow friction |
| **Day 6-7 login rate** | <40% | Improve trial re-engagement flow |
| **Data freshness** | >24 hours stale | Alert ops team, check data pipelines |
| **Opportunity action rate** | <30% | Review recommendation quality |
| **Recommendation accuracy** | <85% | Review scoring algorithms |
| **Sanity Check usage** | <20% eligible | Improve feature discovery |
| **Trust Dashboard views** | <50% weekly | Surface trust value more prominently |
| **Support tickets per 100** | >10 | Identify UX friction points |
| **Payment failure rate** | >3% | Improve dunning flow |
| **Refund/chargeback rate** | >2% | Review value delivery, investigate causes |

### 6.4 Success Criteria by Tier

| Tier | Success Indicator | Target |
|------|-------------------|--------|
| **Free** | First product added within 1 hour | 70% |
| **Free** | Upgrades to paid within 60 days | 15% |
| **Free** | Reactivation to paid within 180 days | 20% |
| **Solo** | Trust Dashboard view (monthly active) | 70% |
| **Solo** | Sanity check used in first 30 days | 60% |
| **Solo** | Upgrades to Growth within 90 days | 12% |
| **Solo** | 12-month retention rate | 75% |
| **Growth** | Week 1 payback achieved | 80% |
| **Growth** | Acted on recommendation monthly | 50% |
| **Growth** | Upgrades to Pro within 6 months | 10% |
| **Growth** | 12-month retention rate | 85% |
| **Pro** | Renewal rate | 90%+ |
| **Pro** | Expansion (team members - future) | 20% in Year 2 |

---

## Section 7: Handoff Readiness

### 7.1 Documentation Checklist

| Document | Status | Location |
|----------|--------|----------|
| PRD (this document) | Complete | `/documents/foundation/prds/ModelOptix-Core-PRD-DRAFT.md` |
| Pricing Strategy | Exists (needs 25%→20% update) | `/documents/foundation/pricing-strategy.md` |
| Client Success Blueprint | Exists | `/documents/foundation/Client-Success-Blueprint.md` |
| Vision & Mission | Exists | `/documents/foundation/Vision-and-Mission.md` |
| Positioning Statement | Exists | `/documents/foundation/positioning-statement.md` |
| Strategic Roadmap | Exists | `/documents/foundation/strategic-roadmap.md` |
| Design Playbook | Not created (optional) | Developer preferences for HOW |

### 7.2 Technical Handoff Requirements

What AGENT-11 needs to build from this PRD:

| Category | Requirement | PRD Section |
|----------|-------------|-------------|
| **Data Model** | 5 entity groups, relationships defined | Section 2.2 |
| **UI Structure** | 6-item nav, route map, access levels | Section 2.3 |
| **Business Rules** | 30 rules, 3 state machines | Section 2.4 |
| **External APIs** | OAuth, Stripe, Email, LLM (business requirements only) | Section 2.5 |
| **Privacy/Compliance** | Data classification, GDPR/CCPA, user rights | Section 2.6 |
| **Features** | 35 features (23 P0, 12 P1) with acceptance criteria | Section 3 |
| **Testing** | Critical journeys, edge cases, quality gates | Section 4 |

**Not in PRD (AGENT-11 decides):**
- Tech stack (language, framework, database)
- Architecture (monolith vs microservices)
- Hosting/infrastructure
- Specific API implementations

### 7.3 Open Questions for Development

| Question | Context | Decision |
|----------|---------|----------|
| ~~OAuth providers - all 4 at MVP?~~ | Google, GitHub, Microsoft, Apple | **DECIDED: Google + GitHub at MVP** (add others post-MVP based on demand) |
| ~~CI/CD test strategy for LLM features~~ | Mock vs. real APIs in pipeline | **DECIDED: Mock/recorded responses** (no API costs per test run) |
| ~~Email provider selection~~ | Transactional + marketing | **DECIDED: AGENT-11 chooses** based on tech stack |
| ~~Data retention for tier downgrades~~ | Freeze vs. delete on downgrade | **DECIDED: Freeze (read-only)** - keep all data, excess becomes read-only, no deletion |
| ~~Sanity Check execution model~~ | Server-side proxy vs. user brings keys | **DECIDED: Server-side proxy** - ModelOptix pays API costs, smooth UX, rate limiting critical |
| ~~API key storage security (if user keys)~~ | Vault, encryption, access controls | **N/A** - not storing user keys (server-side proxy model) |
| ~~Data pipeline architecture~~ | Batch/streaming, refresh frequency, data source | **DECIDED: OpenRouter API as primary source** for model data + pricing. Add other aggregators in Phase 3. |
| ~~LLM provider for Sanity Check~~ | Which provider? | **DECIDED: OpenRouter** - same provider as data source, one integration |
| ~~Trust score data sources~~ | Where does initial trust data come from? | **DECIDED: Fully automated** - Artificial Analysis API, Hugging Face leaderboards, own OpenRouter metrics (uptime, errors, latency). Auto-generate scores, no manual curation. |
| ~~Rate limiting enforcement~~ | Technical enforcement of tier limits | **DECIDED: Warning at 80% + upgrade prompt at 100%** - soft block with one-click upgrade, turns limit into conversion moment |
| ~~Analytics/monitoring stack~~ | For health indicators | **DECIDED: AGENT-11 chooses** based on tech stack |

**Flagged for post-MVP:**
- Manual product pause feature
- Trial edge case documentation
- Team features (Phase 3)

### 7.4 Handoff Checklist

Before passing to AGENT-11:

| Item | Status | Notes |
|------|--------|-------|
| PRD complete (Sections 0-7) | ✅ Complete | This document |
| All P0 features defined with acceptance criteria | ✅ Complete | F-001 to F-023 |
| Business rules documented | ✅ Complete | 30 rules, 3 state machines |
| Data model defined | ✅ Complete | 5 entity groups |
| UI structure mapped | ✅ Complete | Routes, access levels |
| Success metrics defined | ✅ Complete | North Star + funnel + health |
| Open questions documented | ✅ Complete | 11 questions with timing |
| Pricing strategy exists | ⚠️ Needs update | 25% → 20% first year |
| Design Playbook | ❌ Not created | Optional - developer preferences |

**Recommended next steps:**
1. Update Pricing Strategy doc (25% → 20%)
2. Create AGENT-11 project directory
3. Copy PRD to AGENT-11 project
4. Answer blocking questions (Before M1) first

---

## Appendix A: Preference Profile (JSON)

Machine-readable summary for AGENT-11 handoff:

```json
{
  "product": {
    "name": "ModelOptix Core",
    "version": "MVP",
    "type": "B2B SaaS",
    "positioning": {
      "primary": "Trust transparency (Consumer Reports for AI)",
      "secondary": "Cost/performance optimization"
    }
  },
  "tiers": {
    "free": {
      "price": { "annual": 0, "monthly": 0 },
      "limits": { "products": 1, "functions": 1, "sanityChecks": 3 },
      "features": { "alerts": "none (digest is P1)", "history": "7 days" }
    },
    "solo": {
      "price": { "annual": 9.95, "monthly": 13.45 },
      "limits": { "products": 3, "functions": 10, "sanityChecks": 10 },
      "features": { "alerts": "real-time", "history": "90 days", "webhooks": false }
    },
    "growth": {
      "price": { "annual": 19.95, "monthly": 26.95 },
      "limits": { "products": 10, "functions": 30, "sanityChecks": 30 },
      "features": { "alerts": "real-time", "history": "1 year", "webhooks": true, "customRules": true }
    },
    "pro": {
      "price": { "annual": 29.95, "monthly": 40.45 },
      "limits": { "products": 25, "functions": 100, "sanityChecks": 100 },
      "features": { "alerts": "real-time", "history": "forever", "webhooks": true, "api": true, "roiDashboard": true }
    }
  },
  "billing": {
    "trial": { "days": 7, "requiresCard": true, "defaultTier": "growth" },
    "annualDiscount": { "firstYear": 0.20 },
    "moneyBackGuarantee": { "days": 30, "fromTrialStart": true, "onePerCustomer": true }
  },
  "auth": {
    "providers": ["google", "github"],
    "providersPostMVP": ["microsoft", "apple"],
    "sessionTimeout": "30 days"
  },
  "recommendationEngine": {
    "fitScoreWeights": {
      "cost": { "cost": 0.40, "speed": 0.15, "quality": 0.25, "trust": 0.15, "context": 0.05 },
      "speed": { "cost": 0.15, "speed": 0.40, "quality": 0.25, "trust": 0.15, "context": 0.05 },
      "accuracy": { "cost": 0.15, "speed": 0.10, "quality": 0.45, "trust": 0.20, "context": 0.10 },
      "context": { "cost": 0.10, "speed": 0.10, "quality": 0.25, "trust": 0.15, "context": 0.40 }
    },
    "minimumImprovementThreshold": 0.10
  },
  "opportunityThresholds": {
    "cost": { "percentageMin": 15, "absoluteMin": 10, "unit": "$/month" },
    "speed": { "percentageMin": 25 },
    "accuracy": { "percentageMin": 15 },
    "contextWindow": { "multiplierMin": 2 },
    "trustScore": { "pointsMin": 15 }
  },
  "dataSources": {
    "modelCatalog": { "primary": "OpenRouter API", "refresh": "daily" },
    "pricing": { "primary": "OpenRouter API", "refresh": "daily" },
    "benchmarks": { "primary": "Artificial Analysis API", "fallback": "Hugging Face", "refresh": "weekly" },
    "latency": { "primary": "Own OpenRouter metrics", "refresh": "realtime" },
    "trustScores": { "primary": "Automated multi-source", "refresh": "weekly" }
  },
  "trustScores": {
    "model": {
      "dimensions": ["outputQuality", "outputSafety", "trainingTransparency"],
      "weights": [0.40, 0.35, 0.25],
      "scale": "0-100"
    },
    "provider": {
      "dimensions": ["uptime", "dataPrivacy", "apiStability", "pricingTransparency", "supportQuality"],
      "weights": [0.25, 0.25, 0.20, 0.15, 0.15],
      "scale": "0-100"
    },
    "combined": {
      "modelWeight": 0.50,
      "providerWeight": 0.50
    }
  },
  "stateMachines": {
    "subscription": ["trial", "active", "pastDue", "cancelled", "expired"],
    "opportunity": ["new", "viewed", "acted", "dismissed", "expired"],
    "product": ["active", "paused", "archived"]
  },
  "milestones": {
    "M0a": "Pre-Launch Presence",
    "M0b": "Infrastructure",
    "M1": "Auth, Account & Billing",
    "M2": "Portfolio Foundation",
    "M3": "Core Value Loop",
    "M4": "Proof of Value",
    "M5": "Trial Experience",
    "M6": "Quality Complete",
    "M7": "Launch Ready"
  },
  "metrics": {
    "northStar": { "name": "Trust Engagement Rate", "target": "70% of paying users" },
    "conversion": { "baseline": 0.25, "stretch": 0.45 },
    "retention": { "month2": 0.85, "churnMax": 0.04 },
    "arpu": { "min": 15 },
    "annualMix": { "min": 0.70 }
  },
  "healthThresholds": {
    "timeToFirstInsight": { "max": "10 minutes" },
    "day1Login": { "min": 0.70 },
    "day1ProductConnection": { "min": 0.60 },
    "day67Login": { "min": 0.40 },
    "dataFreshness": { "max": "24 hours" },
    "recommendationAccuracy": { "min": 0.85 },
    "paymentFailure": { "max": 0.03 },
    "refundChargeback": { "max": 0.02 }
  },
  "features": {
    "p0Count": 24,
    "p1Count": 12,
    "total": 36,
    "newInReview": ["F-003a: Portfolio Quick Start"]
  }
}
```

---

## Document Notes

**Updates Completed:**
- ✅ Pricing Strategy doc updated - 25% → 20% first year discount
- ✅ Added Section 2.7: Recommendation Engine (FitScore formula, weights, opportunity generation)
- ✅ Added Section 2.8: Data Sources & Sync (OpenRouter primary, fallback handling)
- ✅ Added Section 2.9: Trust Score Methodology (8 dimensions, formulas, inheritance)
- ✅ Fixed trust dimension inconsistency (7 → 8, aligned names across PRD and JSON)
- ✅ Fixed trial default inconsistency (now consistently "growth")
- ✅ Updated JSON appendix with recommendation engine, data sources, trust weights
- ✅ Added F-003a: Portfolio Quick Start (OpenRouter import, Quick Add wizard, Demo Mode)
- ✅ Enhanced F-017: Value Summary with low-spender handling (performance gains, trust protection)
- ✅ Added Section 1.6: Out of Scope (local models, enterprise, etc.)

**Deferred to Post-MVP:**
- Manual product pause feature
- Trial edge case documentation

**New Entities Identified in Section 3:**
- Session (for session management in F-020)
- PromotionCode (for promotion management in F-035)
- AuditLog (for admin audit trails)

---

*Document completed: January 14, 2026*
*Status: COMPLETE - All sections (0-7) and Appendix A finished*
*Ready for AGENT-11 handoff*
