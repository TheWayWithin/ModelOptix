import { WaitlistForm } from "@/components/waitlist-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-32">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Independent. No investors. No agenda.
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl font-bold tracking-tight text-trust-blue sm:text-5xl md:text-6xl">
            Stop overpaying for AI.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600 sm:text-xl">
            ModelOptix is the independent AI model advisor that continuously
            monitors your LLM stack and alerts you when better or cheaper
            models appear — with full transparency, no hidden agenda.
          </p>

          {/* Waitlist Form */}
          <div className="mt-10 flex justify-center">
            <WaitlistForm />
          </div>

          {/* Social proof hint */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Join developers who refuse to overpay. No spam, ever.
          </p>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold text-trust-blue sm:text-3xl">
            Why developers trust ModelOptix
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {/* Prop 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-trust-blue">Structurally Independent</h3>
              <p className="mt-2 text-sm text-gray-600">
                No investors, no partners, no referral fees. I make money from subscriptions, not from steering you.
              </p>
            </div>

            {/* Prop 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-trust-blue">Radically Transparent</h3>
              <p className="mt-2 text-sm text-gray-600">
                Every recommendation shows its data sources, reasoning, and confidence level. I show my work.
              </p>
            </div>

            {/* Prop 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-trust-blue">Continuous Monitoring</h3>
              <p className="mt-2 text-sm text-gray-600">
                I track 400+ models so you don&apos;t have to. Get alerts when better options appear for your use case.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-100 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-trust-blue sm:text-3xl">
            Ready to stop guessing?
          </h2>
          <p className="mt-4 text-gray-600">
            Join the waitlist for early access and help shape the product.
          </p>
          <div className="mt-8 flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-trust-blue">ModelOptix</span>
              <span className="text-sm text-gray-500">Independent truth in AI.</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} ModelOptix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
