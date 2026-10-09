'use client';

/**
 * SAFENET Website Entry Point (Root `/`)
 * Opening the root website while unauthenticated displays the Login page.
 * Authenticated visitors are automatically directed to the SAFENET Security Dashboard.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import { ShieldCheck } from 'lucide-react';

export default function RootEntryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/overview');
    }
  }, [user, loading, router]);

  // Loading state while checking active session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080A0B] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <ShieldCheck className="w-7 h-7 text-cyan-400 absolute" />
        </div>
        <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Verifying SAFENET Security Session...
        </p>
      </div>
    );
  }

  // If already authenticated, show redirect placeholder while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-[#080A0B] flex items-center justify-center text-xs font-mono text-slate-400">
        Redirecting to SAFENET Dashboard...
      </div>
    );
  }

  // Primary entry point for unauthenticated visitors
  return <LoginPage />;
}
