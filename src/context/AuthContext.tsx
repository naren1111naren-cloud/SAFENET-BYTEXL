'use client';

/**
 * SAFENET - Authentication Context & Provider
 * Manages Supabase authentication state, active sessions, and auth actions.
 * Listens to onAuthStateChange and restores valid sessions upon reload.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | Error | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (
    email: string
  ) => Promise<{ error: AuthError | Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signInWithPassword: async () => ({ error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = getSupabaseBrowserClient();
      setIsConfigured(true);

      // 1. Initial Session Retrieval
      supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[SAFENET Auth] Error fetching initial session:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      });

      // 2. Auth State Change Listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('[SAFENET Auth] Supabase client initialization failed:', err);
      setIsConfigured(false);
      setLoading(false);
    }
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error };
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error('Authentication request failed') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error('Registration failed') };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error };
    } catch (err: any) {
      setUser(null);
      setSession(null);
      return { error: err instanceof Error ? err : new Error('Sign out failed') };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/auth/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error('Password reset request failed') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        signInWithPassword,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
