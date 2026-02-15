"use client";

import { useEffect, useState, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

interface PostHogWrapperProps {
  children: ReactNode;
  apiKey: string;
  apiHost: string;
}

export function PostHogWrapper({ children, apiKey, apiHost }: PostHogWrapperProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && apiKey && !posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: apiHost,
        capture_pageview: true,
        capture_pageleave: true,
        loaded: () => setIsInitialized(true),
      });
    } else if (posthog.__loaded) {
      setIsInitialized(true);
    }
  }, [apiKey, apiHost]);

  // Wait for PostHog to initialize before using the provider
  if (!isInitialized) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
