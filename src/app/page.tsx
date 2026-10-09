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
      <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center space-y-4 font-mono text-[#0A0D0C]">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#194D34]/20 border-t-[#194D34] animate-spin" />
          <ShieldCheck className="w-6 h-6 text-[#194D34] absolute" />
        </div>
        <p className="text-xs font-bold tracking-wider text-[#313B36] uppercase">
          Initializing SAFENET Demo Environment...
        </p>
      </div>
    );
  }

  // If already authenticated, show redirect placeholder while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center text-sm font-mono text-[#0A0D0C] font-semibold">
        Redirecting to SAFENET Dashboard...
      </div>
    );
  }

  // Primary entry point for unauthenticated visitors
  return <LoginPage />;
}
