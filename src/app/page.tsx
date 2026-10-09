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
      <div className="min-h-screen bg-[#080B10] flex flex-col items-center justify-center space-y-5 font-mono text-[#FFFFFF]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#35D0BA]/20 border-t-[#35D0BA] animate-spin" />
          <ShieldCheck className="w-8 h-8 text-[#35D0BA] absolute" />
        </div>
        <p className="text-[16px] font-extrabold tracking-wider text-[#FFFFFF] uppercase">
          Initializing SAFENET Demo Environment...
        </p>
      </div>
    );
  }

  // If already authenticated, show redirect placeholder while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-[#080B10] flex items-center justify-center text-[18px] font-mono text-[#FFFFFF] font-extrabold">
        Redirecting to SAFENET Dashboard...
      </div>
    );
  }

  // Primary entry point for unauthenticated visitors
  return <LoginPage />;
}
