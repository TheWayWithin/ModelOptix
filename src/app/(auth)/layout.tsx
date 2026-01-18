import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Minimal Auth Header */}
      <header className="absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">ModelOptix</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Auth Content */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} ModelOptix. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
