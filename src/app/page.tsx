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
      <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#477A60]/20 border-t-[#477A60] animate-spin" />
          <ShieldCheck className="w-6 h-6 text-[#477A60] absolute" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-[#626B65] uppercase">
          Verifying SAFENET Security Session...
        </p>
      </div>
    );
  }

  // If already authenticated, show redirect placeholder while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center text-xs font-mono text-[#626B65]">
        Redirecting to SAFENET Dashboard...
      </div>
    );
  }

  // Primary entry point for unauthenticated visitors
  return <LoginPage />;
}
