"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = "idle" | "loading" | "success" | "error";

// Type for window.posthog
type PostHogCapture = { capture: (event: string, properties?: Record<string, unknown>) => void };

// Helper to safely access posthog from window
function getPostHog(): PostHogCapture | undefined {
  if (typeof window !== "undefined") {
    return (window as unknown as { posthog?: PostHogCapture }).posthog;
  }
  return undefined;
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Track successful signup
      getPostHog()?.capture("waitlist_signup", {
        email_domain: email.split("@")[1],
      });

      setFormState("success");
      setEmail("");
    } catch (error) {
      setFormState("error");
      const message = error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);

      // Track failed signup attempt
      getPostHog()?.capture("waitlist_signup_failed", {
        error: message,
      });
    }
  };

  if (formState === "success") {
    return (
      <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 p-4 text-center">
        <p className="font-medium text-teal-700">
          You&apos;re on the list. We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={formState === "loading"}
        className="h-12 flex-1 border-gray-300 text-base dark:border-gray-600"
      />
      <Button
        type="submit"
        disabled={formState === "loading"}
        className="h-12 bg-trust-blue px-6 text-base font-medium hover:bg-trust-blue/90"
      >
        {formState === "loading" ? "Joining..." : "Join Waitlist"}
      </Button>
      {formState === "error" && (
        <p className="text-sm text-red-600 sm:absolute sm:mt-14">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
