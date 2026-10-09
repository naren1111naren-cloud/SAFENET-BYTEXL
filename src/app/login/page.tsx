import React, { Suspense } from 'react';
import LoginPage from '@/components/auth/LoginPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — SAFENET Digital Safety Platform',
  description: 'Secure enterprise access to SAFENET Digital Risk Protection Console.',
};

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080A0B] flex items-center justify-center text-slate-400 font-mono text-xs">
          Loading SAFENET Authentication...
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
