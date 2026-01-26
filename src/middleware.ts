/**
 * Next.js Middleware
 *
 * Handles:
 * 1. Auth session validation and refresh
 * 2. Rate limiting for API routes (Upstash Redis)
 * 3. CSRF protection for mutating requests
 * 4. Request ID generation for log correlation
 * 5. Admin route protection
 *
 * @see architecture.md Section 15 - Security
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import {
  getClientIP,
  checkApiRateLimit,
  checkSanityCheckRateLimit,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback', // OAuth callback - MUST be public to exchange code for session
  '/pricing',
  '/privacy',
  '/terms',
];

/**
 * Public API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/waitlist',
  '/api/auth',
  '/api/health',
  '/api/public', // Public endpoints (models list for guest sanity checks, etc.)
  '/api/sanity-checks', // Sanity checks (includes guest flow)
  '/api/checkout/success', // Stripe redirect URL - webhook handles actual update
  '/api/webhooks', // Stripe webhooks - verified by signature, not auth
];

/**
 * Admin-only API routes
 */
const ADMIN_API_ROUTES = ['/api/admin'];

/**
 * HTTP methods that require CSRF protection
 */
const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique request ID for log correlation
 * Format: req_[timestamp_base36]_[random_8chars]
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Validate Origin header for CSRF protection
 *
 * Per architecture.md Section 15, we check:
 * 1. Allow requests without Origin header (same-origin or non-browser)
 * 2. Allow if Origin matches NEXT_PUBLIC_APP_URL
 * 3. Allow if Origin matches https://{Host}
 *
 * @returns true if the request is safe
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('Origin');
  const host = request.headers.get('Host');

  // No Origin header = same-origin request (browser won't add Origin for same-site)
  // or non-browser client (curl, Postman, etc.)
  if (!origin) {
    return true;
  }

  // Build allowed origins
  const allowedOrigins: string[] = [];

  // Add configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Add host-based origin
  if (host) {
    allowedOrigins.push(`https://${host}`);
    // Allow http for local development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      allowedOrigins.push(`http://${host}`);
    }
  }

  return allowedOrigins.includes(origin);
}

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match (e.g., /api/auth matches /api/auth/callback)
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Check if route is public (no auth required)
 */
function isPublicRoute(pathname: string): boolean {
  // Static assets are always public (handled by matcher, but double-check)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return true;
  }

  return matchesRoutes(pathname, PUBLIC_ROUTES);
}

/**
 * Check if API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  return matchesRoutes(pathname, PUBLIC_API_ROUTES);
}

/**
 * Check if API route is admin-only
 */
function isAdminApiRoute(pathname: string): boolean {
  return matchesRoutes(pathname, ADMIN_API_ROUTES);
}

/**
 * Check if route is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Check if route is a sanity check endpoint (stricter rate limiting)
 */
function isSanityCheckRoute(pathname: string): boolean {
  return pathname.startsWith('/api/sanity-check');
}

/**
 * Create a JSON error response
 */
function errorResponse(
  status: number,
  error: string,
  message: string,
  requestId: string,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error,
      message,
      requestId,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...additionalHeaders,
      },
    }
  );
}

// ============================================================================
// Main Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = generateRequestId();
  const clientIP = getClientIP(request);

  // Add request ID and client IP to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-client-ip', clientIP);

  // ---------------------------------------------------------------------------
  // 1. Skip static assets (belt + suspenders with matcher config)
  // ---------------------------------------------------------------------------
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. CSRF Protection for mutating requests
  // ---------------------------------------------------------------------------
  if (MUTATING_METHODS.includes(request.method)) {
    if (!validateOrigin(request)) {
      console.warn(
        `[${requestId}] CSRF validation failed for ${pathname} from IP ${clientIP}`
      );
      return errorResponse(403, 'Forbidden', 'Invalid origin', requestId);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Rate Limiting for API routes
  // ---------------------------------------------------------------------------
  if (isApiRoute(pathname)) {
    // Use stricter rate limiting for sanity check endpoints
    const rateLimitResult = isSanityCheckRoute(pathname)
      ? await checkSanityCheckRateLimit(request)
      : await checkApiRateLimit(request);

    if (!rateLimitResult.success) {
      console.warn(
        `[${requestId}] Rate limit exceeded for ${pathname} from IP ${clientIP}`
      );
      const response = rateLimitExceededResponse(rateLimitResult);
      response.headers.set('X-Request-Id', requestId);
      return response;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Public routes - no auth needed
  // ---------------------------------------------------------------------------
  if (
    isPublicRoute(pathname) ||
    (isApiRoute(pathname) && isPublicApiRoute(pathname))
  ) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('X-Request-Id', requestId);
    return response;
  }

  // ---------------------------------------------------------------------------
  // 5. Auth session validation
  // ---------------------------------------------------------------------------
  const { supabase, response } = await createClient(request);

  // Get current user session (this also refreshes the session if needed)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error(`[${requestId}] Auth error:`, authError.message);
  }

  // Add request ID to response
  response.headers.set('X-Request-Id', requestId);

  // ---------------------------------------------------------------------------
  // 6. Protected routes require authentication
  // ---------------------------------------------------------------------------
  if (!user) {
    // API routes return 401 Unauthorized
    if (isApiRoute(pathname)) {
      console.warn(
        `[${requestId}] Unauthorized API access attempt to ${pathname} from IP ${clientIP}`
      );
      return errorResponse(
        401,
        'Unauthorized',
        'Authentication required',
        requestId
      );
    }

    // Dashboard and other protected routes redirect to login
    // IMPORTANT: Copy cookies from Supabase response to preserve any session refresh attempts
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.info(
      `[${requestId}] Redirecting unauthenticated user to login from ${pathname}`
    );
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Copy cookies from Supabase response (preserves session refresh tokens)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        ...cookie,
      });
    });
    redirectResponse.headers.set('X-Request-Id', requestId);

    return redirectResponse;
  }

  // ---------------------------------------------------------------------------
  // 7. Admin route protection
  // ---------------------------------------------------------------------------
  if (isAdminApiRoute(pathname)) {
    // Fetch user profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.warn(
        `[${requestId}] Non-admin user ${user.id} attempted to access ${pathname}`
      );
      return errorResponse(
        403,
        'Forbidden',
        'Admin access required',
        requestId
      );
    }

    console.info(`[${requestId}] Admin user ${user.id} accessing ${pathname}`);
  }

  // ---------------------------------------------------------------------------
  // 8. User is authenticated, allow access
  // ---------------------------------------------------------------------------
  return response;
}

// ============================================================================
// Middleware Matcher Configuration
// ============================================================================

/**
 * Match all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Static assets (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
