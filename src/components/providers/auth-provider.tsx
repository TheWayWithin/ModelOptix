'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * User profile from the user_profiles table
 */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'starter' | 'pro' | 'team';
  is_admin: boolean;
  status: 'active' | 'inactive' | 'suspended';
  onboarding_completed_at: string | null;
  created_at: string;
}

/**
 * Auth context value
 */
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider - Provides authentication state to the app
 *
 * Features:
 * - Subscribes to Supabase auth state changes
 * - Loads user profile from user_profiles table
 * - Provides signOut function
 * - Auto-refreshes profile on auth changes
 *
 * @example
 * // In layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 *
 * // In a component
 * const { user, profile, signOut } = useAuth();
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const supabase = React.useMemo(() => createClient(), []);

  /**
   * Fetch user profile from user_profiles table
   */
  const fetchProfile = React.useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (auth trigger creates it async)
        // We'll retry on next auth state change
        console.warn('Error fetching profile:', error.message);
        return null;
      }

      return data as UserProfile;
    },
    [supabase]
  );

  /**
   * Refresh user profile
   */
  const refreshProfile = React.useCallback(async () => {
    if (!user?.id) return;
    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
    }
  }, [user?.id, fetchProfile]);

  /**
   * Sign out the user
   */
  const signOut = React.useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // State will be updated by onAuthStateChange listener
  }, [supabase]);

  /**
   * Initialize auth state and subscribe to changes
   *
   * IMPORTANT: We use getUser() instead of getSession() because getSession()
   * returns cached data from localStorage which can be stale after hard refresh.
   * getUser() validates the session with the server.
   */
  React.useEffect(() => {
    let mounted = true;

    // Get and validate current user (not just cached session)
    const initAuth = async () => {
      try {
        // First get the session (needed for the session object)
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        // Then validate the user with the server
        const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !validatedUser) {
          // Session is invalid or expired - clear state
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Session is valid
        setSession(initialSession);
        setUser(validatedUser);

        // Fetch profile for authenticated user (don't block on this)
        fetchProfile(validatedUser.id).then((userProfile) => {
          if (mounted && userProfile) {
            setProfile(userProfile);
          }
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fetch profile on sign in
        fetchProfile(newSession.user.id).then((userProfile) => {
          if (mounted && userProfile) {
            setProfile(userProfile);
          }
        });
      } else {
        // Clear profile on sign out
        setProfile(null);
      }

      // Update loading state
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const value = React.useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, isLoading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - Hook to access auth context
 *
 * Must be used within an AuthProvider
 *
 * @example
 * const { user, profile, signOut, isLoading } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 *
 * return <Dashboard user={user} profile={profile} />;
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * useRequireAuth - Hook that redirects to login if not authenticated
 *
 * @example
 * // In a protected component
 * const { user, profile, isLoading } = useRequireAuth();
 *
 * // Will redirect to /login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, profile, isLoading, signOut, refreshProfile } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname;
      const searchParams = currentPath !== '/dashboard' ? `?redirectTo=${encodeURIComponent(currentPath)}` : '';
      window.location.href = `${redirectTo}${searchParams}`;
    }
  }, [isLoading, user, redirectTo]);

  return { user, profile, isLoading, signOut, refreshProfile };
}
