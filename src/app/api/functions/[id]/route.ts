import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint has been eliminated along with the functions layer.
 *
 * Use cases now link directly to products. Use /api/use-cases/[id] instead.
 * This endpoint is maintained for backwards compatibility until 2026-04-25 (90 days).
 *
 * Migration Guide: See docs/migration-guide-functions-to-use-cases.md
 */

const DEPRECATION_HEADERS = {
  'X-Deprecated': 'true',
  'X-Deprecation-Date': '2026-01-25',
  'X-Sunset-Date': '2026-04-25',
  'X-Replacement': '/api/use-cases/[id]',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // Await params per Next.js 15 requirement

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated.',
      message: 'The functions layer has been eliminated. Use /api/use-cases/[id] instead.',
      replacement: '/api/use-cases/[id]',
      migrationGuide: 'https://modeloptix.com/docs/migration-guide-functions-to-use-cases',
      sunsetDate: '2026-04-25',
    },
    {
      status: 410, // Gone
      headers: DEPRECATION_HEADERS,
    }
  );
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated.',
      message: 'The functions layer has been eliminated. Use /api/use-cases/[id] instead.',
      replacement: '/api/use-cases/[id]',
      migrationGuide: 'https://modeloptix.com/docs/migration-guide-functions-to-use-cases',
      sunsetDate: '2026-04-25',
    },
    {
      status: 410, // Gone
      headers: DEPRECATION_HEADERS,
    }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated.',
      message: 'The functions layer has been eliminated. Use /api/use-cases/[id] instead.',
      replacement: '/api/use-cases/[id]',
      migrationGuide: 'https://modeloptix.com/docs/migration-guide-functions-to-use-cases',
      sunsetDate: '2026-04-25',
    },
    {
      status: 410, // Gone
      headers: DEPRECATION_HEADERS,
    }
  );
}
