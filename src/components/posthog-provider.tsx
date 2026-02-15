"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import dynamic from "next/dynamic";

// Check if PostHog key is available at build time
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Context for components that need to know if PostHog is available
const PostHogReadyContext = createContext(false);
export const usePostHogReady = () => useContext(PostHogReadyContext);

// Dynamic import of PostHog to prevent SSR issues
const PostHogWrapper = dynamic(
  () => import("./posthog-wrapper").then(mod => mod.PostHogWrapper),
  { ssr: false }
);

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and initial hydration, just render children
  if (!isClient || !POSTHOG_KEY) {
    return (
      <PostHogReadyContext.Provider value={false}>
        {children}
      </PostHogReadyContext.Provider>
    );
  }

  // After hydration on client with key present, use the wrapper
  return (
    <PostHogWrapper apiKey={POSTHOG_KEY} apiHost={POSTHOG_HOST}>
      <PostHogReadyContext.Provider value={true}>
        {children}
      </PostHogReadyContext.Provider>
    </PostHogWrapper>
  );
}
