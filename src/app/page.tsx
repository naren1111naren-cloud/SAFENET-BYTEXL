'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  ShieldAlert,
  Search,
  Sparkles,
  ArrowRight,
  Activity,
  Layers,
  Globe,
  MessageSquare,
  AtSign,
  Smartphone,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Lock,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  type InputType = 'url' | 'message' | 'social' | 'app' | 'lookalike' | 'logo';
  const [selectedType, setSelectedType] = useState<InputType>('url');
  const [inputValue, setInputValue] = useState('');

  const typePlaceholders: Record<InputType, string> = {
    url: 'Paste a URL or domain to inspect (e.g. paytm-support-verify.xyz)...',
    message: 'Paste suspicious message, SMS or email text...',
    social: 'Enter social handle or profile URL (e.g. @Paytm_CareHelp)...',
    app: 'Enter application identifier or package ID (e.g. com.paytm.rewards.apk)...',
    lookalike: 'Enter candidate name to check look-alike patterns (e.g. Paytm Customer Care, Pаytm)...',
    logo: 'Upload or verify logo trademark similarity in the workbench...',
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType === 'logo') {
      router.push('/check?type=logo');
      return;
    }
    if (!inputValue.trim()) {
      router.push(`/check?input=${encodeURIComponent('http://paytm-support-verify.xyz')}&type=url`);
      return;
    }
    router.push(`/check?input=${encodeURIComponent(inputValue.trim())}&type=${selectedType}`);
  };

  const setSample = (type: InputType, val: string) => {
    setSelectedType(type);
    setInputValue(val);
  };

  return (
    <AppShell>
      <div className="space-y-24 py-6 max-w-5xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. EVENTOR-STYLE COSMIC HERO SECTION                                      */}
        {/* ========================================================================= */}
        <section className="text-center space-y-8 pt-4 sm:pt-8">
          {/* Top Pill Chip */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.25)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899] animate-pulse" />
            <span>AI-Powered Cyber Defense • Real-Time SOC Intelligence</span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.08]">
              The Premier{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                Cyber Defense
              </span>{' '}
              Decision Platform
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Investigate suspicious links, lookalike domains, urgent SMS lures, and impersonating applications with multi-vector neural telemetry before you act.
            </p>
          </div>

          {/* 4-Card Eventor-Style Metric / Countdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 hover:border-pink-500/40 rounded-2xl p-4 shadow-xl transition-all hover:scale-105">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F8FAFC]">3,000+</div>
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-300 mt-1">PROTECTED ASSETS</div>
            </div>
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 hover:border-pink-500/40 rounded-2xl p-4 shadow-xl transition-all hover:scale-105">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#00F5A0]">99.8%</div>
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-300 mt-1">HEURISTIC ACCURACY</div>
            </div>
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 hover:border-pink-500/40 rounded-2xl p-4 shadow-xl transition-all hover:scale-105">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F472B6]">50+</div>
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-300 mt-1">THREAT FEEDS</div>
            </div>
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 hover:border-pink-500/40 rounded-2xl p-4 shadow-xl transition-all hover:scale-105">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#C084FC]">24/7</div>
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-300 mt-1">CONTINUOUS RADAR</div>
            </div>
          </div>

          {/* Primary & Secondary Action Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/check"
              className="btn-accent inline-flex items-center gap-2.5 px-8 py-4 text-sm font-bold tracking-wide"
            >
              <span>Inspect Threat Asset</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/overview"
              className="btn-quiet inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold text-purple-200"
            >
              <span>Command Center</span>
              <ChevronRight className="w-4 h-4 text-purple-400" />
            </Link>
          </div>

          {/* Summary Metric Counter Row */}
          <div className="pt-8 border-t border-purple-900/30 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-mono text-purple-300/80">
            <div>
              <strong className="text-white text-sm">3,000+</strong> Monitored Domains
            </div>
            <div className="hidden sm:block text-purple-700">•</div>
            <div>
              <strong className="text-white text-sm">50+</strong> Global Feeds
            </div>
            <div className="hidden sm:block text-purple-700">•</div>
            <div>
              <strong className="text-white text-sm">0ms</strong> Edge Evaluation
            </div>
            <div className="hidden sm:block text-purple-700">•</div>
            <div>
              <strong className="text-white text-sm">20+</strong> AI Detection Engines
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE TELEMETRY INVESTIGATION WORKBENCH                           */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-pink-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">Live Digital Asset Inspector</h2>
                  <p className="text-xs text-slate-400">Select inspection vector and query our heuristic radar.</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#EC4899] bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
                ● SOC Engine Active
              </span>
            </div>

            {/* Mode Selectors in Pill Style */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              {[
                { id: 'url', label: 'URL / DOMAIN', icon: Globe },
                { id: 'message', label: 'MESSAGE / SMS', icon: MessageSquare },
                { id: 'social', label: 'SOCIAL HANDLE', icon: AtSign },
                { id: 'app', label: 'APP PACKAGE', icon: Smartphone },
                { id: 'lookalike', label: 'LOOK-ALIKE', icon: Sparkles },
                { id: 'logo', label: 'LOGO CHECK', icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedType(tab.id as InputType)}
                    className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg shadow-pink-500/25 border border-pink-400/40'
                        : 'bg-purple-950/30 text-purple-300/80 hover:text-white hover:bg-purple-900/40 border border-purple-500/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={typePlaceholders[selectedType]}
                  className="w-full bg-[#0D0722] border border-purple-500/30 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-2xl px-5 py-4 text-sm text-[#F8FAFC] placeholder-slate-500 outline-none font-mono transition-all shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                {/* Benchmark Presets */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-purple-400 font-semibold uppercase text-[10px]">Sample Vectors:</span>
                  <button
                    type="button"
                    onClick={() => setSample('url', 'http://paytm-support-verify.xyz')}
                    className="px-3 py-1 rounded-full bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-[11px]"
                  >
                    paytm-support-verify.xyz
                  </button>
                  <button
                    type="button"
                    onClick={() => setSample('social', '@Paytm_CareHelp')}
                    className="px-3 py-1 rounded-full bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-[11px]"
                  >
                    @Paytm_CareHelp
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn-accent px-8 py-3 text-xs uppercase font-bold tracking-wider cursor-pointer self-stretch sm:self-auto flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Execute Analysis</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CAPABILITIES GRID                                                      */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#EC4899] font-bold">
              MULTI-VECTOR FORENSIC MATRIX
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8FAFC]">
              Comprehensive Protection Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-pink-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Domain & URL Forensics</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inspects registration age, RDAP ownership, SSL validity, and internationalized homoglyph substitutions to catch impersonating phishing domains.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Visual Logo Matching</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Computes 64-bit dHash Hamming distances and color histogram correlation against official brand baselines using Google Lens and Gemini Vision.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-indigo-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Takedown Generation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instantly synthesizes formal Section 25 Cease & Desist notices and registrar abuse complaints pre-filled with cryptographically verifiable evidence.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
