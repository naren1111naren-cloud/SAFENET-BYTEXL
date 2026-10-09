'use client';

/**
 * SAFENET - Authentication Context & Provider
 * Supports Instant Demo IDs & Bypass Mode:
 * - Pre-configured fake demo accounts for immediate access
 * - Automatic fallback so visitors are never blocked by authentication walls
 * - Persistent demo session via localStorage
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  badge: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-analyst',
    email: 'analyst@safenet.io',
    name: 'Alex Vance',
    role: 'Threat Intelligence Analyst',
    badge: 'Tier 2 SecOps',
    description: 'Investigates lookalikes, rogue APKs, and active brand impersonations.',
  },
  {
    id: 'demo-secops-lead',
    email: 'secops.lead@safenet.io',
    name: 'Elena Rostova',
    role: 'Digital Risk Protection Lead',
    badge: 'Lead Responder',
    description: 'Manages incident triage, correlation clusters, and take-down playbooks.',
  },
  {
    id: 'demo-director',
    email: 'director@safenet.io',
    name: 'Marcus Chen',
    role: 'Enterprise Security Director',
    badge: 'Executive SOC',
    description: 'Full perimeter visibility, executive briefings, and compliance audits.',
  },
  {
    id: 'demo-bytexl',
    email: 'demo@bytexl.com',
    name: 'ByteXL Threat Cell',
    role: 'ByteXL SOC Investigator',
    badge: 'ByteXL Partner',
    description: 'Monitors specialized academic and fintech threats across perimeters.',
  },
];

function createMockUser(account: { id: string; email: string; name?: string; role?: string }): User {
  return {
    id: account.id,
    app_metadata: { provider: 'demo' },
    user_metadata: {
      name: account.name || account.email.split('@')[0],
      role: account.role || 'Security Analyst',
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    email: account.email,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    factors: [],
  };
}

function createMockSession(user: User): Session {
  return {
    access_token: `mock_jwt_token_${user.id}_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 86400 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
    refresh_token: `mock_refresh_${user.id}`,
    user,
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemo: boolean;
  demoAccounts: DemoAccount[];
  loginWithDemo: (demoIdOrEmail: string) => Promise<void>;
  signInWithPassword: (
    email: string,
    password?: string
  ) => Promise<{ error: AuthError | Error | null }>;
  signUp: (
    email: string,
    password?: string
  ) => Promise<{ data: any; error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (
    email: string
  ) => Promise<{ error: AuthError | Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  isConfigured: true,
  isDemo: true,
  demoAccounts: DEMO_ACCOUNTS,
  loginWithDemo: async () => {},
  signInWithPassword: async () => ({ error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

const STORAGE_KEY = 'safenet_demo_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check local storage for existing session or demo user
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          const mockUser = createMockUser(parsed);
          setUser(mockUser);
          setSession(createMockSession(mockUser));
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore storage read error
    }

    // 2. Try Supabase session if available
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
        if (!error && initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          setIsDemo(false);
          setLoading(false);
          return;
        }

        // 3. If no active session, default automatically to first Demo Analyst
        const defaultDemo = DEMO_ACCOUNTS[0];
        const mockUser = createMockUser(defaultDemo);
        setUser(mockUser);
        setSession(createMockSession(mockUser));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemo));
        } catch {}
        setLoading(false);
      });
    } catch {
      // Supabase unavailable; default to demo analyst
      const defaultDemo = DEMO_ACCOUNTS[0];
      const mockUser = createMockUser(defaultDemo);
      setUser(mockUser);
      setSession(createMockSession(mockUser));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDemo));
      } catch {}
      setLoading(false);
    }
  }, []);

  const loginWithDemo = async (demoIdOrEmail: string) => {
    const match =
      DEMO_ACCOUNTS.find(
        (a) => a.id === demoIdOrEmail || a.email.toLowerCase() === demoIdOrEmail.toLowerCase()
      ) || {
        id: `demo-custom-${Date.now()}`,
        email: demoIdOrEmail,
        name: demoIdOrEmail.split('@')[0],
        role: 'Security Analyst',
        badge: 'Custom Demo',
        description: 'Custom simulated analyst profile',
      };

    const mockUser = createMockUser(match);
    const mockSession = createMockSession(mockUser);
    setUser(mockUser);
    setSession(mockSession);
    setIsDemo(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch {}
  };

  const signInWithPassword = async (email: string, _password?: string) => {
    const trimmed = email.trim();
    // Check if matching predefined demo account
    const matchedDemo = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === trimmed.toLowerCase() || a.id === trimmed
    );

    const account = matchedDemo || {
      id: `demo-${Date.now()}`,
      email: trimmed,
      name: trimmed.split('@')[0],
      role: 'Security Analyst',
      badge: 'Demo User',
      description: 'Simulated analyst profile',
    };

    const mockUser = createMockUser(account);
    const mockSession = createMockSession(mockUser);
    setUser(mockUser);
    setSession(mockSession);
    setIsDemo(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch {}

    return { error: null };
  };

  const signUp = async (email: string, password?: string) => {
    const res = await signInWithPassword(email, password);
    return { data: { user }, error: res.error };
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}

    setUser(null);
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return { error: null };
  };

  const resetPassword = async (_email: string) => {
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        isDemo,
        demoAccounts: DEMO_ACCOUNTS,
        loginWithDemo,
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

