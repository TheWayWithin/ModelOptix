import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function OpportunityNotFound() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The opportunity you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/opportunities">Back to Opportunities</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
