import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint has been replaced by /api/products/[id]/use-cases
 *
 * The functions layer has been eliminated. Use cases now link directly to products.
 * This endpoint is maintained for backwards compatibility until 2026-04-25 (90 days).
 *
 * Migration Guide: See docs/migration-guide-functions-to-use-cases.md
 */

const DEPRECATION_HEADERS = {
  'X-Deprecated': 'true',
  'X-Deprecation-Date': '2026-01-25',
  'X-Sunset-Date': '2026-04-25',
  'X-Replacement': '/api/products/[id]/use-cases',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated.',
      message: 'The functions layer has been eliminated. Use cases now link directly to products.',
      replacement: `/api/products/${id}/use-cases`,
      migrationGuide: 'https://modeloptix.com/docs/migration-guide-functions-to-use-cases',
      sunsetDate: '2026-04-25',
    },
    {
      status: 410, // Gone
      headers: DEPRECATION_HEADERS,
    }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated.',
      message: 'The functions layer has been eliminated. Create use cases directly under products.',
      replacement: `/api/products/${id}/use-cases`,
      migrationGuide: 'https://modeloptix.com/docs/migration-guide-functions-to-use-cases',
      sunsetDate: '2026-04-25',
    },
    {
      status: 410, // Gone
      headers: DEPRECATION_HEADERS,
    }
  );
}
