'use client';

/**
 * SAFENET Login & Demo Entry Portal
 * Cloudflare Radar Dark Theme:
 * - Deep dark black background (#080B11) with pearl-white bold typography
 * - Cloudflare Orange (#F6821F) action and focus states
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080B11] text-[#FFFFFF] p-6 selection:bg-[#F6821F]/25 selection:text-[#FFFFFF]">
      <div className="w-full max-w-md bg-[#0E131F] border border-[#1E2638] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        
        {/* Minimal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#111625] border border-[#1E2638] text-[#F6821F] mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#F6821F]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#FFFFFF]">
              SAFENET
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-extrabold tracking-wider bg-[#F6821F]/15 text-[#F6821F] border border-[#F6821F]/30 uppercase">
              RADAR
            </span>
          </div>
          <p className="text-[16px] text-[#9CA3AF] font-bold">
            Sign In to Telemetry Portal
          </p>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-[15px] font-bold text-[#FFFFFF]"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@safenet.io"
                className="w-full bg-[#111625] border border-[#1E2638] rounded-xl pl-11 pr-4 py-3 text-[17px] text-[#FFFFFF] font-bold placeholder-[#6B7280] outline-none transition-all focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-[15px] font-bold text-[#FFFFFF]"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111625] border border-[#1E2638] rounded-xl pl-11 pr-4 py-3 text-[17px] text-[#FFFFFF] font-bold placeholder-[#6B7280] outline-none transition-all focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#F6821F] hover:bg-[#FA8B28] text-[#FFFFFF] font-extrabold text-[18px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        {/* Minimal Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1E2638] w-full" />
          <span className="bg-[#0E131F] px-3 text-[12px] font-mono text-[#9CA3AF] font-bold uppercase shrink-0">
            Or Radar Demo Access
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
                className="p-2.5 rounded-lg border border-[#1E2638] bg-[#111625] hover:bg-[#161D2F] hover:border-[#F6821F] transition-all text-left cursor-pointer group"
              >
                <div className="text-[14px] font-bold text-[#FFFFFF] truncate group-hover:text-[#F6821F]">
                  {acc.name}
                </div>
                <div className="text-[12px] text-[#9CA3AF] font-bold truncate">
                  {acc.role.split(' ')[0]} Demo
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('demo-analyst')}
            className="w-full py-2.5 rounded-xl border border-[#1E2638] bg-[#111625] hover:bg-[#161D2F] hover:border-[#F6821F] text-[#FFFFFF] font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="h-4 w-4 text-[#F6821F]" />
            <span>Instant Radar Demo Access</span>
          </button>
        </div>

      </div>
    </div>
  );
}
