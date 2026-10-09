'use client';

/**
 * SAFENET Login & Demo Entry Portal
 * Clean, minimal enterprise cybersecurity login interface:
 * - Pure dark background with pearl-white bold typography
 * - Clean input fields and minimal layout
 * - Instant 1-click demo access for friction-free evaluation
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Zap } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/overview';

  const { loginWithDemo, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickDemo = async (demoId: string) => {
    setLoading(true);
    try {
      await loginWithDemo(demoId);
      router.push(redirectTarget);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const targetEmail = email.trim() || 'analyst@safenet.io';
      await signInWithPassword(targetEmail, password);
      router.push(redirectTarget);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080B10] text-[#FFFFFF] p-6 selection:bg-[#35D0BA]/20 selection:text-[#FFFFFF]">
      <div className="w-full max-w-md bg-[#0D1118] border border-[#303946] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        
        {/* Minimal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#121821] border border-[#303946] text-[#35D0BA] mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#35D0BA]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#FFFFFF]">
            SAFENET
          </h1>
          <p className="text-[17px] text-[#D0D7E0] font-bold">
            Sign In
          </p>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-[16px] font-bold text-[#FFFFFF]"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D0D7E0]">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@safenet.io"
                className="w-full bg-[#121821] border border-[#303946] rounded-xl pl-11 pr-4 py-3 text-[17px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none transition-all focus:border-[#35D0BA] focus:ring-1 focus:ring-[#35D0BA]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-[16px] font-bold text-[#FFFFFF]"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D0D7E0]">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121821] border border-[#303946] rounded-xl pl-11 pr-4 py-3 text-[17px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none transition-all focus:border-[#35D0BA] focus:ring-1 focus:ring-[#35D0BA]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] font-extrabold text-[18px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        {/* Minimal Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#303946] w-full" />
          <span className="bg-[#0D1118] px-3 text-[13px] font-mono text-[#D0D7E0] font-bold uppercase shrink-0">
            Or Demo Access
          </span>
        </div>

        {/* Clean Demo Accounts Selector / 1-Click Access */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.slice(0, 4).map((acc) => (
              <button
                key={acc.id}
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo(acc.id)}
                className="p-2.5 rounded-lg border border-[#303946] bg-[#121821] hover:bg-[#19222D] hover:border-[#35D0BA] transition-all text-left cursor-pointer group"
              >
                <div className="text-[14px] font-bold text-[#FFFFFF] truncate group-hover:text-[#35D0BA]">
                  {acc.name}
                </div>
                <div className="text-[12px] text-[#D0D7E0] font-bold truncate">
                  {acc.role.split(' ')[0]} Demo
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('demo-analyst')}
            className="w-full py-2.5 rounded-xl border border-[#303946] bg-[#121821] hover:bg-[#19222D] hover:border-[#35D0BA] text-[#FFFFFF] font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="h-4 w-4 text-[#35D0BA]" />
            <span>Instant Demo Access</span>
          </button>
        </div>

      </div>
    </div>
  );
}
