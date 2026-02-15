import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TrustDashboardContent } from './trust-dashboard-content';

export const metadata: Metadata = {
  title: 'Trust Dashboard | ModelOptix',
  description: 'View AI model provider trust tiers and make informed decisions about which models to use.',
};

export default async function TrustDashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TrustDashboardContent />
    </div>
  );
}
