# ModelOptix MVP Plan Validation Report (Final)

**Date:** 2026-01-17  
**Plan Version:** 1.0  
**Architecture Version:** 2.4.1  
**Reviewers:** Claude, Gemini, ChatGPT, Manus

---

## Executive Summary

**VERDICT: ✅ APPROVED — READY FOR IMPLEMENTATION**

All four reviewers unanimously approve the plan. The project plan will deliver the ModelOptix MVP as defined in the foundation documents. The identified issues are documentation reconciliations and minor task additions—not structural problems.

| Reviewer | Verdict | Key Insight |
|----------|---------|-------------|
| Claude | Approved with minor recommendations | Brand.yaml reference, audit logging |
| Gemini | "Yes — will deliver the MVP" | Alerts/digest inconsistency, signup integration |
| ChatGPT | "Green-light validation" | Architecture compliance "unusually tight" |
| Manus | "APPROVED with minor additions" | Missing background jobs, savings logic |

---

## Consensus: What's Strong

All reviewers agreed on these strengths:

| Area | Score | Evidence |
|------|-------|----------|
| **P0 Feature Coverage** | 23/23 (100%) | All features mapped to specific tasks |
| **Architecture Alignment** | 14/14 (100%) | Schema, RLS, jobs, security all covered |
| **Phase Sequencing** | ✅ Correct | Value loop before monetization |
| **P1 Deferral** | ✅ Appropriate | Alerts, NL interface correctly backlogged |
| **State Machines** | 3/3 covered | Subscription, Opportunity, Product/Function |

---

## Required Actions Before Phase 0

### 🔴 CRITICAL (Do First)

| # | Issue | Source | Action |
|---|-------|--------|--------|
| 1 | **Sanity check count mismatch** | Gemini | Update PRD BR-014 from "0" to "3" to match Architecture decision |
| 2 | **Add quota guardrails task** | Gemini | Add Task 3.X: "Sanity Check Quota + Cost Guardrails" (per-user limits, rate limiting, UI messaging, cost monitoring) |

### 🟡 HIGH (Do Before Phase 1)

| # | Issue | Source | Action |
|---|-------|--------|--------|
| 3 | **Alerts/digest inconsistency** | Gemini | Remove "weekly digest" from PRD business rules (F-026 is P1, so don't promise it in MVP) |
| 4 | **Signup flow integration** | Gemini | Add Task 4.X: "End-to-End Onboarding Funnel" (landing → trial → payment → OAuth → dashboard + resume logic) |
| 5 | **Missing cleanup jobs** | Manus | Add to Task 1.6: `cleanup-expired-sessions` (daily 1am), `cleanup-guest-sanity-checks` (daily 6am) |
| 6 | **Missing benchmark sync** | Manus | Add Task 2.6a: "Benchmark Sync Job" (weekly from Artificial Analysis) or rename 2.6 to include benchmarks |

### 🟢 MEDIUM (Address During Implementation)

| # | Issue | Source | Action |
|---|-------|--------|--------|
| 7 | **Savings recording logic** | Manus | Expand Task 3.10 acceptance criteria: record savings amount, update function model/provider, increment total |
| 8 | **Trust data for Phase 3** | ChatGPT | Enhance Task 1.7 seed script with robust trust scores, provider tiers, evidence |
| 9 | **Analytics baseline** | ChatGPT | Add to Task 0.6: PostHog events for `user_created` and `first_opportunity_viewed` timestamps |
| 10 | **Stripe sad path testing** | ChatGPT | Add to Task 4.5: Use Stripe CLI to test `invoice.payment_failed` → Free tier downgrade |
| 11 | **Brand.yaml reference** | Claude | Add to Task 0.4: "Colors and fonts match brand.yaml specifications" |
| 12 | **Audit logging** | Claude | Add Task 5.X: "Audit Log Infrastructure" for admin actions per PRD compliance |

---

## Updated Task List

Based on all reviews, here are the specific additions:

### New Tasks to Add

```markdown
#### Task 1.6a: Cleanup Jobs
- **Agent:** developer
- **Priority:** p0
- **Acceptance Criteria:**
  - [ ] `cleanup-expired-sessions` job runs daily at 1am UTC
  - [ ] `cleanup-guest-sanity-checks` job runs daily at 6am UTC (7-day retention)
  - [ ] Jobs use locking pattern from Task 1.6
- **Dependencies:** Task 1.6
- **Estimated Effort:** small

#### Task 2.6a: Benchmark Sync Job
- **Agent:** developer  
- **Priority:** p0
- **Acceptance Criteria:**
  - [ ] Syncs benchmark data from Artificial Analysis API
  - [ ] Runs weekly on Sunday 4am UTC
  - [ ] Updates `models.benchmarks` JSONB column
  - [ ] Handles API failures gracefully with retry
- **Dependencies:** Task 2.5
- **Estimated Effort:** small

#### Task 3.X: Sanity Check Quota + Cost Guardrails
- **Agent:** developer
- **Priority:** p0
- **Acceptance Criteria:**
  - [ ] Per-user quotas enforced based on tier (Free: 3, Solo: 10, Growth: 30, Pro: 100)
  - [ ] Per-guest session limits (3 total)
  - [ ] Rate limiting (max 1 per minute per user)
  - [ ] Clear UI messaging when quota reached with upgrade prompt
  - [ ] Cost monitoring dashboard for OpenRouter spend
- **Dependencies:** Task 3.7, 3.8
- **Estimated Effort:** medium

#### Task 4.X: End-to-End Onboarding Funnel
- **Agent:** developer
- **Priority:** p0
- **Acceptance Criteria:**
  - [ ] Complete flow: Landing → Trial CTA → Tier selection → Stripe checkout → OAuth → Dashboard
  - [ ] "Resume where I left off" for abandoned signups (preserve tier selection, payment status)
  - [ ] Redirect preservation after OAuth
  - [ ] Error handling at each step with recovery options
- **Dependencies:** Task 4.3, 4.4, 1.9
- **Estimated Effort:** medium

#### Task 5.X: Audit Log Infrastructure
- **Agent:** developer
- **Priority:** p1
- **Acceptance Criteria:**
  - [ ] `audit_logs` table created
  - [ ] All admin actions logged (trust score changes, subscription mods, impersonation)
  - [ ] 2-year retention per PRD compliance
  - [ ] Admin UI to view audit logs
- **Dependencies:** Task 5.3
- **Estimated Effort:** medium
```

### Acceptance Criteria to Expand

**Task 0.4 (Landing Page UI):**
```markdown
- [ ] Colors match brand.yaml (Trust Blue #1A2B4C, Independent Teal #0D9488)
- [ ] Typography uses Inter font per brand.yaml
```

**Task 0.6 (Confirmation Email + Analytics):**
```markdown
- [ ] PostHog tracks `user_created` timestamp
- [ ] PostHog tracks `first_opportunity_viewed` timestamp
- [ ] Time-to-first-insight can be calculated from these events
```

**Task 1.7 (Seed Script):**
```markdown
- [ ] Seeds 5+ providers with varied trust tiers (A, B, C)
- [ ] Seeds trust scores across all 8 dimensions with realistic values
- [ ] Seeds sample evidence and confidence levels for trust scores
- [ ] Sufficient data to test Trust Dashboard without Admin UI
```

**Task 3.10 (Act on Opportunity):**
```markdown
- [ ] Savings amount calculated and recorded to database
- [ ] Function's current_model_id and current_provider_id updated
- [ ] User's cumulative savings total incremented
- [ ] Savings event logged with before/after model details
```

**Task 4.5 (Webhook Handlers):**
```markdown
- [ ] Tested with Stripe CLI simulating payment failures
- [ ] `invoice.payment_failed` triggers correct downgrade flow
- [ ] Day 8 trial payment failure → Free tier downgrade verified
- [ ] `past_due` → retry exhausted → Free tier downgrade verified
```

---

## PRD Updates Required

Before implementation, update the PRD:

1. **BR-014 (Free tier sanity checks):** Change from "0" to "3"
2. **Business Rules (alerts):** Remove or caveat "weekly digest" until F-026 ships
3. **Add guest sanity check limits:** "3 per session, 7-day data retention"

---

## Validation Matrix (Final)

### Feature Coverage

| Category | Count | Status |
|----------|-------|--------|
| P0 Features | 23 | ✅ All covered |
| P1 Features | 12 | ✅ Correctly deferred |
| State Machines | 3 | ✅ All covered |
| Background Jobs | 9 | ⚠️ 3 were missing, now addressed |

### Architecture Compliance

| Component | Status |
|-----------|--------|
| Database Schema (15 tables) | ✅ |
| RLS Policies | ✅ |
| Job Safety (lock + heartbeat + reaper) | ✅ |
| Guest Access Contract | ✅ |
| CSRF Protection | ✅ |
| Stripe Webhooks | ✅ |
| OpenRouter Integration | ✅ |

### Success Metrics Tracking

| Metric | Target | Tracking Method | Status |
|--------|--------|-----------------|--------|
| Time to first insight | < 10 min | PostHog events | ✅ (after Task 0.6 update) |
| Week 1 payback | > 50% | Savings + survey | ✅ |
| Dashboard load | < 3 sec | Performance monitoring | ✅ |
| Sanity check completion | < 30 sec | API timing | ✅ |
| Trial to paid | > 15% | Stripe | ✅ |

---

## Recommended Implementation Sequence

1. **Now (30 min):** Update PRD (sanity checks, alerts caveat)
2. **Now (15 min):** Add 5 new tasks to project-plan.md
3. **Now (10 min):** Expand acceptance criteria for Tasks 0.4, 0.6, 1.7, 3.10, 4.5
4. **Then:** Begin Phase 0, Task 0.1 (Project Scaffolding)

---

## Vertical Slice Milestone (Recommended)

Add after Phase 3 completion:

**Milestone: "Time to First Insight Verification"**
- Landing page → Trial signup → Add product → Add function → Define use case → View first opportunity → Run sanity check
- **Target:** < 10 minutes end-to-end
- **Purpose:** Validates core value loop before adding payment gates

---

## Final Checklist

Before starting Task 0.1:

- [ ] PRD BR-014 updated to "3 sanity checks" for free tier
- [ ] PRD business rules updated to remove/caveat weekly digest promise
- [ ] Task 1.6a (Cleanup Jobs) added to plan
- [ ] Task 2.6a (Benchmark Sync) added to plan
- [ ] Task 3.X (Sanity Check Quotas) added to plan
- [ ] Task 4.X (Onboarding Funnel) added to plan
- [ ] Task 5.X (Audit Logging) added to plan
- [ ] Task 0.4 acceptance criteria includes brand.yaml
- [ ] Task 0.6 acceptance criteria includes analytics events
- [ ] Task 1.7 acceptance criteria includes robust trust data
- [ ] Task 3.10 acceptance criteria includes savings recording
- [ ] Task 4.5 acceptance criteria includes sad path testing

---

## Conclusion

**The plan is ready.** 

All four AI reviewers—using different evaluation approaches—reached the same conclusion: the project plan will deliver the ModelOptix MVP. The issues identified are minor additions and documentation reconciliations that can be completed in under an hour.

After completing the checklist above, begin Phase 0.

---

*Document History: v1.0 (Claude) → v1.1 (+ Gemini, ChatGPT) → v2.0 Final (+ Manus)*
