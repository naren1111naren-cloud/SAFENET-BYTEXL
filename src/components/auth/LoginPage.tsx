'use client';

/**
 * SAFENET Login & Demo Entry Portal
 * Redesigned for Organic Monochrome with Dark Bold Black Typography:
 * - 1-Click Instant Demo Accounts (Fake IDs for instant login without external auth)
 * - Seamless bypass so any visitor can access the platform
 * - Custom Demo Login for any user-entered ID
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  User,
  Sparkles,
  Zap,
  Building,
  Check,
  LogIn,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS, DemoAccount } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/overview';

  const { loginWithDemo, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLoggingDemo, setActiveLoggingDemo] = useState<string | null>(null);

  const handleSelectDemo = async (account: DemoAccount) => {
    setActiveLoggingDemo(account.id);
    try {
      await loginWithDemo(account.id);
      router.push(redirectTarget);
    } finally {
      setActiveLoggingDemo(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim() || 'analyst@safenet.io';
    setLoading(true);
    try {
      await signInWithPassword(targetEmail, password);
      router.push(redirectTarget);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080B10] text-[#FFFFFF] font-sans selection:bg-[#35D0BA]/20 selection:text-[#FFFFFF]">
      {/* ========================================================================= */}
      {/* LEFT PANEL — CYBERSECURITY BRANDING HERO                                  */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[44%] xl:w-[42%] min-h-[380px] lg:min-h-screen bg-[#0D1118] border-b lg:border-b-0 lg:border-r border-[#303946] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden z-10">
        {/* Subtle cyber grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#64A9FF" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-[#121821] px-4 py-2 rounded-lg border border-[#303946]">
            <ShieldCheck className="h-5 w-5 text-[#35D0BA]" />
            <span className="text-[14px] font-mono tracking-wider font-bold text-[#FFFFFF] uppercase">
              SAFENET DEMO PORTAL
            </span>
          </div>
          <span className="text-[14px] font-mono text-[#35D0BA] font-bold hidden sm:inline-block">
            BYPASS ACTIVE
          </span>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-10 lg:py-0 space-y-6 max-w-lg">
          <p className="text-[#35D0BA] text-[18px] sm:text-[20px] font-bold tracking-wide uppercase">
            Digital Risk Protection Console
          </p>

          {/* Central Emblem Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#121821] border border-[#303946] text-[#35D0BA] shadow-[0_0_24px_rgba(53,208,186,0.15)]">
            <ShieldCheck className="w-10 h-10 stroke-[2.2] text-[#35D0BA]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#FFFFFF]">
              SAFENET
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-[#64A9FF]">
              Enterprise Threat Intelligence Platform
            </p>
            <p className="text-[20px] text-[#F0F3F7] leading-relaxed max-w-md pt-1 font-bold">
              Immediate simulated access enabled. Pick any demo profile below to test social perimeter defense, rogue APK static audits, lookalike triage, and incident response.
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 pt-6 border-t border-[#303946] flex flex-wrap items-center justify-between text-[16px] text-[#D0D7E0] font-mono gap-3 font-bold">
          <span className="tracking-wider uppercase">NO CREDENTIALS REQUIRED</span>
          <span>•</span>
          <span>INSTANT SOC ACCESS</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL — DEMO ACCOUNT SELECTOR & INSTANT LOGIN FORM                  */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-[#080B10] min-h-[500px] flex items-center justify-center p-6 sm:p-12 lg:p-14 relative">
        <div className="w-full max-w-[620px] bg-[#0D1118] border border-[#303946] p-8 sm:p-12 rounded-2xl shadow-2xl space-y-8">
          {/* Header Title */}
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#121821] border border-[#303946] text-[#35D0BA] text-[15px] font-bold">
              <Sparkles className="h-4 w-4 text-[#35D0BA]" />
              <span>Select Any Demo ID to Sign In</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FFFFFF]">
              Sign In to SAFENET
            </h2>
            <p className="text-[19px] text-[#D0F7E0] leading-relaxed font-bold">
              Click any pre-configured analyst account below to immediately launch the platform with full administrative privileges.
            </p>
          </div>

          {/* Fake Demo Account Grid */}
          <div className="space-y-4">
            <div className="text-[15px] font-mono uppercase tracking-wider text-[#D0D7E0] font-bold flex items-center justify-between">
              <span>PRE-CONFIGURED PROFILES</span>
              <span className="text-[#35D0BA] font-bold">1-Click Launch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEMO_ACCOUNTS.map((account) => {
                const isLogging = activeLoggingDemo === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={loading || !!activeLoggingDemo}
                    onClick={() => handleSelectDemo(account)}
                    className="p-4 rounded-xl border border-[#303946] bg-[#121821] hover:bg-[#19222D] hover:border-[#35D0BA] transition-all text-left group cursor-pointer shadow-md flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-bold px-2.5 py-1 rounded-md bg-[#080B10] border border-[#303946] text-[#35D0BA] group-hover:bg-[#35D0BA] group-hover:text-[#080B10] transition-colors">
                          {account.badge}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[#D0D7E0] group-hover:text-[#35D0BA] group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="text-[18px] font-extrabold text-[#FFFFFF]">
                        {account.name}
                      </h4>
                      <p className="text-[15px] font-mono text-[#D0D7E0] font-bold truncate mt-1">
                        {account.email}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#303946] flex items-center justify-between text-[14px] text-[#FFFFFF] font-bold">
                      <span className="truncate">{account.role}</span>
                      {isLogging && <span className="font-bold text-[#35D0BA]">Opening...</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#303946] w-full" />
            <span className="bg-[#0D1118] px-4 text-[15px] font-mono text-[#D0D7E0] font-bold uppercase shrink-0">
              OR CUSTOM DEMO IDENTIFIER
            </span>
          </div>

          {/* Custom Demo Sign In Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="demo-email-input"
                className="block text-[18px] font-bold uppercase tracking-wider text-[#FFFFFF]"
              >
                Custom Email or Identifier
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D0D7E0]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="demo-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@safenet.io or security@company.com"
                  className="w-full bg-[#121821] border border-[#303946] rounded-xl pl-12 pr-4 py-3.5 text-[19px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none transition-all focus:border-[#35D0BA] focus:ring-1 focus:ring-[#35D0BA]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="demo-password-input"
                className="block text-[18px] font-bold uppercase tracking-wider text-[#FFFFFF]"
              >
                Password <span className="text-[#D0D7E0] text-[16px] font-bold">(Optional for demo)</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D0D7E0]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="demo-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Any password or leave empty"
                  className="w-full bg-[#121821] border border-[#303946] rounded-xl pl-12 pr-4 py-3.5 text-[19px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none transition-all focus:border-[#35D0BA] focus:ring-1 focus:ring-[#35D0BA]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 px-8 rounded-xl bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] font-extrabold text-[20px] shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <LogIn className="h-5 w-5 text-[#080B10]" />
              <span>{loading ? 'Launching Dashboard...' : 'Sign In as Custom Demo User'}</span>
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-5 border-t border-[#303946] flex items-center justify-center gap-2.5 text-[16px] text-[#D0D7E0] text-center font-bold">
            <Lock className="h-4 w-4 text-[#35D0BA] shrink-0" />
            <span>Zero-barrier sandbox environment. All threat feeds &amp; brand models are active.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
