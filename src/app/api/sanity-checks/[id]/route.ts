import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSanityCheck, submitEvaluation } from '@/lib/sanity-check';
import type { SubmitEvaluationRequest, UserPreference } from '@/types/sanity-check';

/**
 * GET /api/sanity-checks/[id]
 *
 * Get a sanity check by ID.
 * Supports both authenticated users and guest sessions (via query param).
 *
 * Query params:
 * - guest_session_id: string (optional) - For guest access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for guest session
    const guestSessionId = request.nextUrl.searchParams.get('guest_session_id');

    // Require either auth or guest session
    if (!user && !guestSessionId) {
      return NextResponse.json(
        { error: 'Authentication or guest session required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid sanity check ID format' },
        { status: 400 }
      );
    }

    // Fetch sanity check with ownership verification
    const sanityCheck = await getSanityCheck(
      id,
      user?.id,
      guestSessionId || undefined
    );

    if (!sanityCheck) {
      return NextResponse.json(
        { error: 'Sanity check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sanityCheck });
  } catch (error) {
    console.error('Error fetching sanity check:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sanity check' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sanity-checks/[id]
 *
 * Submit user evaluation for a completed sanity check.
 *
 * Request body:
 * - preference: 'current' | 'recommended' | 'neither' | 'tie' (required)
 * - notes?: string - Optional user notes
 * - criteria?: Record<string, unknown> - Optional evaluation criteria
 *
 * Query params:
 * - guest_session_id: string (optional) - For guest access
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for guest session
    const guestSessionId = request.nextUrl.searchParams.get('guest_session_id');

    // Require either auth or guest session
    if (!user && !guestSessionId) {
      return NextResponse.json(
        { error: 'Authentication or guest session required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid sanity check ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: SubmitEvaluationRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate preference
    const validPreferences: UserPreference[] = ['current', 'recommended', 'neither', 'tie'];
    if (!body.preference || !validPreferences.includes(body.preference)) {
      return NextResponse.json(
        { error: 'preference must be one of: current, recommended, neither, tie' },
        { status: 400 }
      );
    }

    // Validate notes if provided
    if (body.notes !== undefined && typeof body.notes !== 'string') {
      return NextResponse.json(
        { error: 'notes must be a string' },
        { status: 400 }
      );
    }

    if (body.notes && body.notes.length > 2000) {
      return NextResponse.json(
        { error: 'notes exceeds maximum length of 2000 characters' },
        { status: 400 }
      );
    }

    // Validate criteria if provided
    if (body.criteria !== undefined && typeof body.criteria !== 'object') {
      return NextResponse.json(
        { error: 'criteria must be an object' },
        { status: 400 }
      );
    }

    // Submit evaluation
    const sanityCheck = await submitEvaluation(
      id,
      body,
      user?.id,
      guestSessionId || undefined
    );

    if (!sanityCheck) {
      return NextResponse.json(
        { error: 'Sanity check not found or not in completed status' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sanityCheck,
      message: 'Evaluation submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}
