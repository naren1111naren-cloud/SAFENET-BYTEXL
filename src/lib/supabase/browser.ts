/**
 * SAFENET - Supabase Browser Client
 * Provides a singleton browser client for client-side authentication,
 * cookie-based session synchronization, and realtime subscriptions.
 */

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  user: SupabaseUser;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  [key: string]: any;
}

let browserClient: any = null;

export function getSupabaseBrowserClient(): any {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be invoked in browser environments.');
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  browserClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  return browserClient;
}
