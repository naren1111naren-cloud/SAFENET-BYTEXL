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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8F6] text-[#0A0D0C] font-sans selection:bg-[#477A60]/15 selection:text-[#0A0D0C]">
      {/* ========================================================================= */}
      {/* LEFT PANEL — ORGANIC MONOCHROME BRANDING HERO                             */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[42%] xl:w-[40%] min-h-[380px] lg:min-h-screen bg-[#ECEFEC] border-b lg:border-b-0 lg:border-r border-[#DDE2DC] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden z-10">
        {/* Subtle geometric dot pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#858D86" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-[#FFFFFF] px-3.5 py-1.5 rounded-full border border-[#DDE2DC] shadow-xs">
            <ShieldCheck className="h-4 w-4 text-[#194D34]" />
            <span className="text-xs font-mono tracking-wider font-extrabold text-[#0A0D0C] uppercase">
              SAFENET DEMO PORTAL
            </span>
          </div>
          <span className="text-[12px] font-mono text-[#3A453F] font-bold hidden sm:inline-block">
            AUTHENTICATION BYPASS ACTIVE
          </span>
        </div>

        {/* Center Hero Card */}
        <div className="relative z-10 my-auto py-10 lg:py-0 space-y-6 max-w-md">
          <p className="text-[#313B36] text-base sm:text-lg font-bold tracking-wide">
            Digital Risk Protection Console
          </p>

          {/* Central Emblem Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#FFFFFF] border border-[#DDE2DC] text-[#194D34] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <ShieldCheck className="w-10 h-10 stroke-[2] text-[#194D34]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A0D0C]">
              SAFENET
            </h1>
            <p className="text-lg sm:text-xl font-bold text-[#194D34]">
              Decision-First Risk Platform
            </p>
            <p className="text-[15px] text-[#313B36] leading-relaxed max-w-sm pt-1 font-medium">
              Immediate simulated access enabled. Pick any fake demo identity to test social perimeter defense, rogue APK static audits, lookalike triage, and incident response.
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 pt-6 border-t border-[#DDE2DC] flex flex-wrap items-center justify-between text-xs text-[#313B36] font-mono gap-2 font-bold">
          <span className="tracking-wider uppercase">NO CREDENTIALS REQUIRED</span>
          <span>•</span>
          <span>INSTANT SOC ACCESS</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL — DEMO ACCOUNT SELECTOR & INSTANT LOGIN FORM                  */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-[#F7F8F6] min-h-[500px] flex items-center justify-center p-6 sm:p-12 lg:p-14 relative">
        <div className="w-full max-w-[560px] bg-[#FFFFFF] border border-[#DDE2DC] p-8 sm:p-10 rounded-2xl shadow-sm space-y-7">
          {/* Header Title */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E3EFE7] text-[#194D34] text-[12px] font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Select Any Fake Demo ID to Login</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D0C]">
              Sign In to SAFENET
            </h2>
            <p className="text-[14px] text-[#313B36] leading-relaxed font-normal">
              Click any pre-configured demo account below to instantly launch the security command center with full analyst privileges.
            </p>
          </div>

          {/* Fake Demo Account Grid */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#4A554F] font-extrabold flex items-center justify-between">
              <span>PRE-CONFIGURED DEMO PROFILES</span>
              <span className="text-[#194D34] font-bold">1-Click Launch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((account) => {
                const isLogging = activeLoggingDemo === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={loading || !!activeLoggingDemo}
                    onClick={() => handleSelectDemo(account)}
                    className="p-3.5 rounded-xl border border-[#DDE2DC] bg-[#F7F8F6] hover:bg-[#E3EFE7] hover:border-[#BFD9C7] transition-all text-left group cursor-pointer shadow-xs flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDE2DC] text-[#194D34] group-hover:bg-[#194D34] group-hover:text-white transition-colors">
                          {account.badge}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[#4A554F] group-hover:text-[#194D34] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h4 className="text-[14px] font-extrabold text-[#0A0D0C]">
                        {account.name}
                      </h4>
                      <p className="text-[12px] font-mono text-[#313B36] font-semibold truncate mt-0.5">
                        {account.email}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#DDE2DC]/70 flex items-center justify-between text-[11px] text-[#3A453F]">
                      <span className="truncate">{account.role}</span>
                      {isLogging && <span className="font-bold text-[#194D34]">Opening...</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#DDE2DC] w-full" />
            <span className="bg-[#FFFFFF] px-3 text-[12px] font-mono text-[#4A554F] font-bold uppercase shrink-0">
              OR CUSTOM DEMO ID
            </span>
          </div>

          {/* Custom Demo Sign In Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="demo-email-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#313B36] font-mono"
              >
                Custom Email or Identifier
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A554F]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="demo-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@safenet.io or your-name@company.com"
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0A0D0C] font-medium placeholder-[#525D57] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#194D34] focus:ring-1 focus:ring-[#194D34]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="demo-password-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#313B36] font-mono"
              >
                Password <span className="text-[#525D57] font-normal">(Optional for demo)</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A554F]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="demo-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Any password or leave empty"
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0A0D0C] font-medium placeholder-[#525D57] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#194D34] focus:ring-1 focus:ring-[#194D34]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-6 rounded-lg bg-[#194D34] hover:bg-[#133C29] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Launching Dashboard...' : 'Sign In as Custom Demo User'}</span>
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-4 border-t border-[#DDE2DC] flex items-center justify-center gap-2 text-xs text-[#3A453F] text-center font-medium">
            <Lock className="h-3.5 w-3.5 text-[#194D34] shrink-0" />
            <span>Zero-barrier sandbox environment. All threat feeds &amp; brand models are active.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
