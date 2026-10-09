'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function LandingPage() {
  const router = useRouter();

  type InputType = 'url' | 'message' | 'social' | 'app' | 'lookalike';
  const [selectedType, setSelectedType] = useState<InputType>('url');
  const [inputValue, setInputValue] = useState('');

  const typePlaceholders: Record<InputType, string> = {
    url: 'Paste a URL or domain to inspect (e.g. paytm-support-verify.xyz)...',
    message: 'Paste suspicious message, SMS or email text...',
    social: 'Enter social handle or profile URL (e.g. @Paytm_CareHelp)...',
    app: 'Enter application identifier or package ID (e.g. com.paytm.rewards.apk)...',
    lookalike: 'Enter candidate name or handle to check look-alike patterns (e.g. Paytm Customer Care, Pаytm)...',
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="space-y-24 py-6 max-w-4xl mx-auto">
        {/* ========================================================================= */}
        {/* 1. SENTINEL HERO SECTION                                                  */}
        {/* ========================================================================= */}
        <section className="space-y-12">
          <div className="space-y-6">
            {/* EYEBROW: Sentinel Telemetry Banner */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-cyan-500/10 border border-cyan-500/25 text-[#00D2FF] text-[11px] font-mono uppercase tracking-[0.12em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_#00D2FF]" />
              <span>DIGITAL RISK DECISION SYSTEM • ACTIVE SENTINEL</span>
            </div>

            {/* MAIN HEADLINE: Bold Cyber Command Typography */}
            <h1 className="text-[46px] sm:text-[72px] lg:text-[88px] font-bold text-[#F3F6FB] tracking-[-0.035em] leading-[0.96]">
              DON&apos;T GUESS.<br />
              <span className="bg-gradient-to-r from-[#00D2FF] via-[#00F5A0] to-[#F3F6FB] bg-clip-text text-transparent">
                KNOW.
              </span>
            </h1>

            {/* SUBHEADING: Explains user benefit */}
            <p className="text-[17px] sm:text-[20px] text-[#94A3B8] max-w-[640px] leading-relaxed pt-1">
              Investigate the links, accounts, messages and apps you don&apos;t trust — and examine decisive forensic evidence before you act.
            </p>

            {/* PRIMARY & SECONDARY ACTIONS */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/check"
                className="btn-accent inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] text-[13px] sm:text-[14px] font-bold uppercase tracking-wider cursor-pointer font-mono"
              >
                <span>CHECK SOMETHING</span>
                <span>→</span>
              </Link>
              <Link
                href="/overview"
                className="btn-quiet inline-flex items-center gap-2 px-5 py-3.5 rounded-[4px] text-[13px] sm:text-[14px] font-medium text-[#94A3B8] hover:text-[#FFFFFF] transition-all cursor-pointer font-mono"
              >
                <span>COMMAND CENTER</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Integrated Sentinel Investigation Instrument */}
          <div className="pt-10 space-y-5 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-[12px] sm:text-[13px] font-mono uppercase tracking-[0.1em] text-[#00D2FF] font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
                <span>WHAT ARE YOU CHECKING?</span>
              </h2>
              <span className="text-[12px] text-[#64748B] font-mono">
                Paste URL, domain, message, account or application identifier.
              </span>
            </div>

            {/* Cyber Input Form Box */}
            <form onSubmit={handleAnalyze} className="p-4 sm:p-5 rounded-[6px] bg-[#0B101A]/80 border border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={typePlaceholders[selectedType]}
                  className="w-full bg-[#080C14] border border-slate-800 focus:border-cyan-500/50 focus:shadow-[0_0_16px_rgba(0,210,255,0.15)] rounded-[4px] px-4 py-3.5 text-[14px] text-[#F3F6FB] placeholder-[#64748B] outline-none font-mono transition-all"
                />
              </div>

              {/* Mode Selectors + Primary Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Input Modes */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                  {(['url', 'message', 'social', 'app', 'lookalike'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedType(mode)}
                      className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-all cursor-pointer ${
                        selectedType === mode
                          ? 'bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(0,210,255,0.15)]'
                          : 'text-[#94A3B8] hover:text-[#F3F6FB] border border-transparent hover:bg-slate-800/40'
                      }`}
                    >
                      {mode === 'lookalike' ? 'Look-alike' : mode}
                    </button>
                  ))}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn-accent inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[4px] text-[12px] font-bold uppercase tracking-wider font-mono cursor-pointer self-start sm:self-auto"
                >
                  <span>CHECK RISK</span>
                  <span>→</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. COMMON INVESTIGATIONS (TELEMETRY ROWS WITH CYBER HOVER)                */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              PRESET INVESTIGATION BENCHMARKS
            </span>
            <span className="text-[11px] font-mono text-[#00D2FF]">CLICK TO TEST</span>
          </div>

          <div className="divide-y divide-slate-800/80 border-y border-slate-800/80 font-mono">
            <div
              onClick={() => setSample('url', 'http://paytm-support-verify.xyz')}
              className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-500/[0.03] transition-all rounded-[2px]"
            >
              <span className="text-[14px] text-[#F3F6FB] group-hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                <span className="text-[#64748B] group-hover:text-[#00D2FF]">›</span>
                “Is this website legitimate?”
              </span>
              <span className="text-[12px] text-[#94A3B8] group-hover:text-[#00D2FF]">
                paytm-support-verify.xyz
              </span>
            </div>

            <div
              onClick={() => setSample('social', '@Paytm_CareHelp')}
              className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-500/[0.03] transition-all rounded-[2px]"
            >
              <span className="text-[14px] text-[#F3F6FB] group-hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                <span className="text-[#64748B] group-hover:text-[#00D2FF]">›</span>
                “Is this support account real?”
              </span>
              <span className="text-[12px] text-[#94A3B8] group-hover:text-[#00D2FF]">
                @Paytm_CareHelp
              </span>
            </div>

            <div
              onClick={() => setSample('message', 'URGENT: Your account KYC expires today. Update PAN via link to avoid suspension.')}
              className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-500/[0.03] transition-all rounded-[2px]"
            >
              <span className="text-[14px] text-[#F3F6FB] group-hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                <span className="text-[#64748B] group-hover:text-[#00D2FF]">›</span>
                “Is this payment request a scam?”
              </span>
              <span className="text-[12px] text-[#94A3B8] group-hover:text-[#00D2FF]">
                Account suspension SMS lure
              </span>
            </div>

            <div
              onClick={() => setSample('lookalike', 'Paytm Customer Support Helpline')}
              className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-cyan-500/[0.03] transition-all rounded-[2px]"
            >
              <span className="text-[14px] text-[#F3F6FB] group-hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                <span className="text-[#64748B] group-hover:text-[#00D2FF]">›</span>
                “Is this look-alike support account legitimate?”
              </span>
              <span className="text-[12px] text-[#94A3B8] group-hover:text-[#00D2FF]">
                Combosquatting & name resemblance check
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PROCESS SECTION: FROM SUSPICION TO DECISION                            */}
        {/* ========================================================================= */}
        <section className="space-y-8 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#00D2FF] font-semibold">
              TRIAGE PROCESS
            </span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[#F3F6FB] tracking-[-0.025em] leading-tight mt-1">
              FROM SUSPICION<br />
              TO DECISION.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#94A3B8] max-w-lg mt-2 leading-relaxed">
              Check what looks wrong. Understand why it matters. Decide what to do next.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-baseline p-4 rounded-[4px] bg-[#0B101A]/60 border border-slate-800">
              <span className="font-mono text-[13px] text-[#00D2FF] font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
                01 CHECK
              </span>
              <h3 className="text-[16px] font-semibold text-[#F3F6FB]">SIGNAL SCAN</h3>
              <p className="md:col-span-2 text-[14px] text-[#94A3B8] leading-relaxed">
                Detect suspicious patterns across the submitted artifact using lexical similarity, homoglyph detection and infrastructure intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-baseline p-4 rounded-[4px] bg-[#0B101A]/60 border border-slate-800">
              <span className="font-mono text-[13px] text-[#00D2FF] font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
                02 UNDERSTAND
              </span>
              <h3 className="text-[16px] font-semibold text-[#F3F6FB]">EVIDENCE ATTRIBUTION</h3>
              <p className="md:col-span-2 text-[14px] text-[#94A3B8] leading-relaxed">
                Translate technical signals into understandable evidence with plain-language explanations of threat intent and attacker motivation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-baseline p-4 rounded-[4px] bg-[#0B101A]/60 border border-slate-800">
              <span className="font-mono text-[13px] text-[#00D2FF] font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
                03 DECIDE
              </span>
              <h3 className="text-[16px] font-semibold text-[#F3F6FB]">CALIBRATED VERDICT</h3>
              <p className="md:col-span-2 text-[14px] text-[#94A3B8] leading-relaxed">
                Determine the calibrated level of risk (0–100) and what the user or organization should do next without ambiguity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-baseline p-4 rounded-[4px] bg-[#0B101A]/60 border border-slate-800">
              <span className="font-mono text-[13px] text-[#00F5A0] font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0]" />
                04 ACT
              </span>
              <h3 className="text-[16px] font-semibold text-[#F3F6FB]">TACTICAL RESPONSE</h3>
              <p className="md:col-span-2 text-[14px] text-[#94A3B8] leading-relaxed">
                Block, report, investigate, generate customer warnings in regional languages, or safely continue operations.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CAPABILITIES SECTION                                                   */}
        {/* ========================================================================= */}
        <section className="space-y-8 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#00D2FF] font-semibold">
              SENTINEL CAPABILITIES
            </span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[#F3F6FB] tracking-[-0.025em] leading-tight mt-1">
              SEE THE SIGNAL.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#94A3B8] max-w-lg mt-2 leading-relaxed">
              SAFENET turns scattered digital signals into clear, explainable risk intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-[4px] bg-[#0B101A]/70 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
              <span className="font-mono text-[11px] text-[#00D2FF] font-semibold">01 / DETECT</span>
              <div className="text-[15px] font-semibold text-[#F3F6FB]">Multi-signal detection</div>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                Evaluates lexical similarity, Unicode homoglyphs, combosquatting, domain age, and payment signals.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0B101A]/70 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
              <span className="font-mono text-[11px] text-[#00D2FF] font-semibold">02 / EXPLAIN</span>
              <div className="text-[15px] font-semibold text-[#F3F6FB]">Plain-language reasoning</div>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                Translates technical telemetry and attacker motivations into clear, understandable evidence.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0B101A]/70 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
              <span className="font-mono text-[11px] text-[#00D2FF] font-semibold">03 / CONNECT</span>
              <div className="text-[15px] font-semibold text-[#F3F6FB]">Campaign and infrastructure correlation</div>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                Clusters isolated domains, rogue social accounts, and scam APKs sharing hosting IPs and payment VPAs.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0B101A]/70 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
              <span className="font-mono text-[11px] text-[#00F5A0] font-semibold">04 / RESPOND</span>
              <div className="text-[15px] font-semibold text-[#F3F6FB]">Actionable mitigation</div>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                Produces formal abuse reports for domain registrars and ready-to-broadcast consumer warnings.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. FINAL CYBER CTA                                                        */}
        {/* ========================================================================= */}
        <section className="pt-8 pb-4 border-t border-slate-800/80 space-y-4">
          <h2 className="text-[32px] sm:text-[44px] font-bold text-[#F3F6FB] tracking-[-0.03em] leading-tight">
            BEFORE YOU ACT,<br />
            <span className="text-[#00D2FF]">CHECK IT.</span>
          </h2>
          <p className="text-[16px] text-[#94A3B8] max-w-xl">
            One check can prevent the wrong click, the wrong payment, or the wrong decision.
          </p>
          <div className="pt-2">
            <Link
              href="/check"
              className="btn-accent inline-flex items-center gap-2 px-6 py-3 rounded-[4px] text-[13px] font-bold uppercase tracking-wider font-mono"
            >
              <span>CHECK SOMETHING</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>

  );
}
