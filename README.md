# ModelOptix

> The independent AI model advisor that helps you stop overpaying for AI.

ModelOptix analyzes your AI portfolio and recommends optimizations to reduce costs while maintaining quality. Track your AI products, compare models, and discover savings opportunities across providers like OpenAI, Anthropic, Google, and more.

## Features

- **Portfolio Management** - Track your AI products, functions, and use cases
- **Model Catalog** - Browse 700+ models with real-time pricing from OpenRouter
- **Sanity Checks** - Compare model outputs side-by-side with your actual prompts
- **Opportunity Detection** - Automated recommendations for cost savings
- **Savings Tracking** - Track and visualize your optimization savings over time
- **Trust Scores** - Provider trust ratings based on privacy, security, and reliability

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe (subscriptions + customer portal)
- **Email**: Resend
- **Model Data**: OpenRouter API + Artificial Analysis
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase CLI
- Stripe CLI (for webhook testing)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/modeloptix.git
   cd modeloptix
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_SOLO_MONTHLY=price_...
   STRIPE_PRICE_SOLO_YEARLY=price_...
   STRIPE_PRICE_TEAM_MONTHLY=price_...
   STRIPE_PRICE_TEAM_YEARLY=price_...

   # OpenRouter (for model data)
   OPENROUTER_API_KEY=sk-or-...

   # Resend (for emails)
   RESEND_API_KEY=re_...

   # PostHog (optional)
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

   # Sentry (optional)
   SENTRY_DSN=https://...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=modeloptix

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. Run database migrations:
   ```bash
   supabase db push
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

### Stripe Webhook Testing

For local development with Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages (protected)
│   ├── (marketing)/       # Marketing pages (public)
│   ├── admin/             # Admin pages (admin-only)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and services
│   ├── email/            # Email templates (Resend)
│   ├── jobs/             # Background jobs (cron)
│   ├── openrouter/       # OpenRouter API client
│   ├── stripe/           # Stripe configuration
│   └── supabase/         # Supabase clients
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions

supabase/
└── migrations/           # Database migrations
```

## Background Jobs

ModelOptix uses `node-cron` for scheduled tasks:

| Job | Schedule | Description |
|-----|----------|-------------|
| sync-model-catalog | Daily 2am UTC | Sync models from OpenRouter |
| sync-pricing | Daily 3am UTC | Update model pricing |
| sync-benchmarks | Weekly Sunday 4am UTC | Update benchmark scores |
| generate-opportunities | Daily 5am UTC | Generate optimization recommendations |
| trial-reminders | Daily 9am UTC | Send trial expiration emails |
| cleanup-sessions | Daily 1am UTC | Clean up expired sessions |
| reaper | Every 5 minutes | Process pending async tasks |

## Subscription Tiers

| Tier | Products | Sanity Checks | Price |
|------|----------|---------------|-------|
| Free | 1 | 3/month | $0 |
| Solo | 3 | 10/month | $29/mo |
| Team | 10 | 30/month | $99/mo |
| Enterprise | Unlimited | Unlimited | Custom |

## API Routes

### Public
- `GET /api/public/models` - List all models (unauthenticated)

### Authenticated
- `GET /api/products` - List user's products
- `POST /api/products` - Create a product
- `GET /api/opportunities` - List optimization opportunities
- `GET /api/savings` - Get savings summary
- `POST /api/sanity-checks` - Run a model comparison

### Admin
- `GET /api/admin/stats` - Admin dashboard stats
- `GET /api/admin/models` - Manage models
- `GET /api/admin/providers` - Manage providers
- `GET /api/admin/editorial-overrides` - Manage model overrides

## Deployment

### Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically on push to main

### Environment-Specific Setup

See [docs/stripe-live-mode-checklist.md](docs/stripe-live-mode-checklist.md) for production Stripe configuration.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests: `pnpm test`
4. Run lint: `pnpm lint`
5. Create a PR to `develop`

## License

Proprietary - All rights reserved

---

Built with care by the ModelOptix team.
