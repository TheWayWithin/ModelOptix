import { Metadata } from 'next';
import { GuestSanityCheckContent } from './guest-sanity-check-content';

export const metadata: Metadata = {
  title: 'Try ModelOptix - Free AI Model Comparison',
  description: 'Compare AI model responses side-by-side. Test GPT-4, Claude, Llama, and more to find the best fit for your use case. No signup required.',
};

export default function TryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <GuestSanityCheckContent />
      </div>
    </div>
  );
}
