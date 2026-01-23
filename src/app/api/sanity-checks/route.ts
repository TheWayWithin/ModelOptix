import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAndRunSanityCheck } from '@/lib/sanity-check';
import {
  checkUserQuota,
  checkGuestQuota,
  checkRateLimit,
  incrementUsage,
  RATE_LIMIT_SECONDS,
} from '@/lib/sanity-check/quota';
import type { CreateSanityCheckRequest } from '@/types/sanity-check';

/**
 * POST /api/sanity-checks
 *
 * Create and run a new sanity check.
 * Supports both authenticated users and guest sessions.
 * Enforces rate limiting and quota limits.
 *
 * Request body:
 * - prompt: string (required) - The test prompt
 * - currentModelId: UUID (required) - Model currently in use
 * - recommendedModelId: UUID (required) - Recommended model to compare
 * - useCaseId?: UUID - Associated use case
 * - parameters?: { systemPrompt?, maxTokens?, temperature? }
 * - isGuest?: boolean - Whether this is a guest sanity check
 * - guestSessionId?: string - Guest session identifier
 *
 * @see architecture.md Section 13 - Sanity Checks
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (optional for guest sanity checks)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse request body
    let body: CreateSanityCheckRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.currentModelId || typeof body.currentModelId !== 'string') {
      return NextResponse.json(
        { error: 'currentModelId is required' },
        { status: 400 }
      );
    }

    if (!body.recommendedModelId || typeof body.recommendedModelId !== 'string') {
      return NextResponse.json(
        { error: 'recommendedModelId is required' },
        { status: 400 }
      );
    }

    // For non-guests, require authentication
    if (!body.isGuest && !user) {
      return NextResponse.json(
        { error: 'Authentication required for non-guest sanity checks' },
        { status: 401 }
      );
    }

    // For guests, require guestSessionId
    if (body.isGuest && !body.guestSessionId) {
      return NextResponse.json(
        { error: 'guestSessionId required for guest sanity checks' },
        { status: 400 }
      );
    }

    // === RATE LIMITING ===
    const identifier = body.isGuest ? body.guestSessionId! : user!.id;
    const isGuest = body.isGuest || false;

    const rateLimitResult = await checkRateLimit(identifier, isGuest);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Please wait ${rateLimitResult.retryAfter} seconds before running another sanity check`,
          retryAfter: rateLimitResult.retryAfter,
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || RATE_LIMIT_SECONDS),
          },
        }
      );
    }

    // === QUOTA CHECK ===
    const quotaResult = isGuest
      ? await checkGuestQuota(body.guestSessionId!)
      : await checkUserQuota(user!.id);

    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: quotaResult.reason,
          status: quotaResult.status,
          upgradePrompt: quotaResult.upgradePrompt,
          code: 'QUOTA_EXCEEDED',
        },
        { status: 402 } // Payment Required - indicates upgrade needed
      );
    }

    // Validate prompt length
    if (body.prompt.length > 10000) {
      return NextResponse.json(
        { error: 'Prompt exceeds maximum length of 10000 characters' },
        { status: 400 }
      );
    }

    // Validate parameters if provided
    if (body.parameters) {
      if (body.parameters.maxTokens !== undefined) {
        const maxTokens = body.parameters.maxTokens;
        if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4096) {
          return NextResponse.json(
            { error: 'maxTokens must be between 1 and 4096' },
            { status: 400 }
          );
        }
      }

      if (body.parameters.temperature !== undefined) {
        const temperature = body.parameters.temperature;
        if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
          return NextResponse.json(
            { error: 'temperature must be between 0 and 2' },
            { status: 400 }
          );
        }
      }

      if (body.parameters.systemPrompt !== undefined) {
        if (typeof body.parameters.systemPrompt !== 'string') {
          return NextResponse.json(
            { error: 'systemPrompt must be a string' },
            { status: 400 }
          );
        }
        if (body.parameters.systemPrompt.length > 5000) {
          return NextResponse.json(
            { error: 'systemPrompt exceeds maximum length of 5000 characters' },
            { status: 400 }
          );
        }
      }
    }

    // Create and run the sanity check
    const sanityCheck = await createAndRunSanityCheck(
      body,
      user?.id
    );

    // === INCREMENT USAGE (only for authenticated users) ===
    // Guest usage is tracked by counting sanity_checks rows
    if (!isGuest && user) {
      await incrementUsage(user.id);
    }

    // Return response with updated quota status
    const updatedQuotaResult = isGuest
      ? await checkGuestQuota(body.guestSessionId!)
      : await checkUserQuota(user!.id);

    return NextResponse.json({
      sanityCheck,
      message: 'Sanity check completed',
      quotaStatus: updatedQuotaResult.status,
    });
  } catch (error) {
    console.error('Error creating sanity check:', error);

    // Return appropriate error based on type
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('Failed to fetch model')) {
      return NextResponse.json(
        { error: 'One or more models not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create sanity check', details: message },
      { status: 500 }
    );
  }
}
