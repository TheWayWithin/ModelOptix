import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SanityCheckContent } from './sanity-check-content';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SanityCheckPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch opportunity details to get model information
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/opportunities/${id}`,
    {
      headers: {
        Cookie: `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch opportunity');
  }

  const { opportunity } = await response.json();

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <SanityCheckContent
        opportunity={opportunity}
        userId={user.id}
      />
    </div>
  );
}
