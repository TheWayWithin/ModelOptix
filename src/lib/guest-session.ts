/**
 * Guest Session Management
 *
 * Handles guest session tokens for unauthenticated sanity checks.
 * Tokens are stored in localStorage and sent to the API.
 *
 * @see architecture.md Section 13 - Guest Access Contract
 */

const GUEST_TOKEN_KEY = 'modeloptix_guest_token';
const GUEST_TOKEN_CREATED_KEY = 'modeloptix_guest_token_created';
const TOKEN_TTL_DAYS = 7;

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Generate a new guest session token
 */
export function generateGuestToken(): string {
  return crypto.randomUUID();
}

/**
 * Hash a token for secure storage in database
 * Uses Web Crypto API for SHA-256 hashing
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get or create a guest session token
 * Returns existing token if valid, generates new one if expired or missing
 */
export function getOrCreateGuestToken(): string {
  if (!isBrowser()) {
    // Server-side: generate new token (will be persisted client-side)
    return generateGuestToken();
  }

  const existingToken = localStorage.getItem(GUEST_TOKEN_KEY);
  const createdAt = localStorage.getItem(GUEST_TOKEN_CREATED_KEY);

  // Check if existing token is still valid
  if (existingToken && createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < TOKEN_TTL_DAYS) {
      return existingToken;
    }
  }

  // Generate new token
  const newToken = generateGuestToken();
  localStorage.setItem(GUEST_TOKEN_KEY, newToken);
  localStorage.setItem(GUEST_TOKEN_CREATED_KEY, new Date().toISOString());
  return newToken;
}

/**
 * Get existing guest token without creating a new one
 */
export function getGuestToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  const existingToken = localStorage.getItem(GUEST_TOKEN_KEY);
  const createdAt = localStorage.getItem(GUEST_TOKEN_CREATED_KEY);

  if (existingToken && createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < TOKEN_TTL_DAYS) {
      return existingToken;
    }
  }

  return null;
}

/**
 * Save a guest token to localStorage
 */
export function saveGuestToken(token: string): void {
  if (!isBrowser()) return;

  localStorage.setItem(GUEST_TOKEN_KEY, token);
  localStorage.setItem(GUEST_TOKEN_CREATED_KEY, new Date().toISOString());
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem(GUEST_TOKEN_CREATED_KEY);
}

/**
 * Check if user has a valid guest session
 */
export function hasGuestSession(): boolean {
  return getGuestToken() !== null;
}

/**
 * Get remaining days until guest session expires
 */
export function getGuestSessionDaysRemaining(): number | null {
  if (!isBrowser()) return null;

  const createdAt = localStorage.getItem(GUEST_TOKEN_CREATED_KEY);
  if (!createdAt) return null;

  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const remaining = Math.max(0, TOKEN_TTL_DAYS - diffDays);

  return Math.ceil(remaining);
}
