# ModelOptix Agent Context

> Rolling accumulation of all findings, decisions, and critical information
> Mission: MVP Development
> Started: 2026-01-17

---

## Mission Objectives

### Primary Goal
Build ModelOptix MVP - a trust-first AI model advisor that helps developers find, compare, and optimize their LLM usage.

### Success Metrics (from project-plan.md)
| Metric | Target |
|--------|--------|
| Time to first insight | < 10 minutes |
| Week 1 payback | > 50% of users |
| Dashboard load time | < 3 seconds |
| Sanity Check completion | < 30 seconds |
| Trial to paid conversion | > 15% |

---

## Accumulated Findings

### Architecture Decisions (from architecture.md v2.4.1)
- **Hosting**: Railway (no timeouts) + Cloudflare CDN
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (Google, GitHub, Email/Password)
- **Payments**: Stripe subscriptions
- **LLM Access**: OpenRouter for Sanity Checks
- **Email**: Resend
- **Rate Limiting**: Upstash Redis
- **Background Jobs**: node-cron with locking pattern

### Brand Guidelines (from brand.yaml)
- Trust Blue: #1A2B4C (primary)
- Independent Teal: #0D9488 (accent)
- Font: Inter
- Tone: Trust-first, no BS, builder-focused

### Pricing Tiers
| Tier | Monthly | Products | Sanity Checks/mo |
|------|---------|----------|------------------|
| Free | $0 | 1 | 3 |
| Solo | $9.95 | 3 | 10 |
| Growth | $19.95 | 10 | 30 |
| Pro | $29.95 | 25 | 100 |

---

## Technical Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-17 | Begin with Phase 0 (Landing Page) | Collect waitlist while building full product |

---

## Known Issues

*No issues recorded yet.*

---

## Dependencies Tracking

### External Services
| Service | Status | Account Created |
|---------|--------|-----------------|
| Railway | Needed | [ ] |
| Cloudflare | Needed | [ ] |
| Supabase | Needed | [ ] |
| Stripe | Needed (Phase 4) | [ ] |
| OpenRouter | Needed (Phase 3) | [ ] |
| Resend | Needed (Phase 0) | [ ] |
| PostHog | Needed (Phase 0) | [ ] |
| Upstash | Needed (Phase 1) | [ ] |

---

## Phase Progress

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 0 - Landing Page | In Progress | 2026-01-17 | - |
| 1 - Foundation | Not Started | - | - |
| 2 - Portfolio + Catalog | Not Started | - | - |
| 3 - Core Value Loop | Not Started | - | - |
| 4 - Monetization | Not Started | - | - |
| 5 - Polish & Launch | Not Started | - | - |
