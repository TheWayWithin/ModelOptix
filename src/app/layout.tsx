import type { Metadata } from 'next';
import './globals.css';
import { PostHogProvider } from '@/components/posthog-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, ToastProvider } from '@/components/providers';

export const metadata: Metadata = {
  title: 'ModelOptix - Stop Overpaying for AI',
  description:
    'The independent AI model advisor that continuously monitors your LLM stack and alerts you when better or cheaper models appear. No investors, no agenda.',
  keywords: [
    'AI',
    'LLM',
    'model optimization',
    'cost savings',
    'OpenAI',
    'Anthropic',
    'Claude',
    'GPT',
  ],
  openGraph: {
    title: 'ModelOptix - Stop Overpaying for AI',
    description: 'The independent AI model advisor. No investors, no agenda.',
    type: 'website',
    url: 'https://modeloptix.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ModelOptix - Stop Overpaying for AI',
    description: 'The independent AI model advisor. No investors, no agenda.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>
              {children}
              <ToastProvider />
            </AuthProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
