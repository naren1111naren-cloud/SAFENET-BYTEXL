'use client';

/**
 * SAFENET Public Editorial Threat Search & Overview Page
 * Preserved at /home for exploring capabilities and running fast checks.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, ShieldCheck, Sparkles, Globe, MessageSquare, AtSign, Smartphone } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function EditorialHomePage() {
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
      <div className="space-y-24 py-8 max-w-5xl mx-auto">
        <section className="space-y-12">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#111625] text-[#F6821F] border border-[#1E2638] text-[16px] font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5 text-[#F6821F]" />
              DIGITAL RISK PROTECTION &amp; SOCIAL THREAT MONITORING
            </span>
            <h1 className="text-[52px] sm:text-[76px] lg:text-[88px] font-semibold text-[#FFFFFF] tracking-[-0.035em] leading-[1.05]">
              Don&apos;t guess.<br />
              <span className="text-[#F6821F]">Know.</span>
            </h1>
            <p className="text-[22px] sm:text-[24px] text-[#9CA3AF] max-w-[720px] leading-relaxed pt-1 font-bold">
              Investigate the links, accounts, messages, and apps you don&apos;t trust — and examine forensic evidence before granting trust.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-3">
              <Link
                href="/check"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] rounded-xl text-[20px] font-semibold shadow-lg transition-all cursor-pointer"
              >
                <span>Check Something</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center px-8 py-4 bg-[#111625] border border-[#1E2638] text-[#FFFFFF] hover:bg-[#161D2F] rounded-xl text-[20px] font-semibold shadow-md transition-colors cursor-pointer"
              >
                <span>Explore Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="pt-10 space-y-6 border-t border-[#1E2638]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-[19px] font-mono uppercase tracking-wider text-[#F6821F] font-semibold">
                WHAT ARE YOU CHECKING?
              </h2>
              <span className="text-[17px] text-[#9CA3AF] font-bold">
                Paste a URL, domain, message, account or application to investigate.
              </span>
            </div>

            <form onSubmit={handleAnalyze} className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-5">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={typePlaceholders[selectedType]}
                  className="w-full bg-[#111625] border border-[#1E2638] focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F] rounded-xl px-5 py-4 text-[19px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none font-mono transition-all shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-2.5 text-[16px] font-bold">
                  {(['url', 'message', 'social', 'app', 'lookalike'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedType(mode)}
                      className={`px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer font-semibold ${
                        selectedType === mode
                          ? 'bg-[#111625] text-[#F6821F] border border-[#F6821F]'
                          : 'text-[#9CA3AF] hover:text-[#FFFFFF] bg-[#080B11] border border-[#1E2638]'
                      }`}
                    >
                      {mode === 'lookalike' ? 'Look-alike' : mode}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] rounded-xl text-[19px] font-semibold uppercase tracking-wider cursor-pointer shadow-lg transition-all self-start sm:self-auto"
                >
                  <span>Check Risk</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-5 pt-6 border-t border-[#1E2638]">
          <div className="text-[16px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold pb-1">
            COMMON INVESTIGATIONS
          </div>

          <div className="divide-y divide-[#1E2638] border-y border-[#1E2638] bg-[#0E131F] rounded-2xl shadow-lg overflow-hidden">
            <div
              onClick={() => setSample('url', 'http://paytm-support-verify.xyz')}
              className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-[#111625] transition-colors"
            >
              <span className="text-[19px] font-semibold text-[#FFFFFF] group-hover:text-[#F6821F] transition-colors">
                “Is this website legitimate?”
              </span>
              <span className="font-mono text-[17px] text-[#64A9FF] font-bold">
                paytm-support-verify.xyz
              </span>
            </div>

            <div
              onClick={() => setSample('social', '@Paytm_CareHelp')}
              className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-[#111625] transition-colors"
            >
              <span className="text-[19px] font-semibold text-[#FFFFFF] group-hover:text-[#F6821F] transition-colors">
                “Is this support account real?”
              </span>
              <span className="font-mono text-[17px] text-[#64A9FF] font-bold">
                @Paytm_CareHelp
              </span>
            </div>

            <div
              onClick={() => setSample('message', 'URGENT: Your account KYC expires today. Update PAN via link to avoid suspension.')}
              className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-[#111625] transition-colors"
            >
              <span className="text-[19px] font-semibold text-[#FFFFFF] group-hover:text-[#F6821F] transition-colors">
                “Is this payment request a scam?”
              </span>
              <span className="font-mono text-[17px] text-[#FFAB40] font-bold">
                Account suspension SMS lure
              </span>
            </div>

            <div
              onClick={() => setSample('lookalike', 'Paytm Customer Support Helpline')}
              className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-[#111625] transition-colors"
            >
              <span className="text-[19px] font-semibold text-[#FFFFFF] group-hover:text-[#F6821F] transition-colors">
                “Is this look-alike support account legitimate?”
              </span>
              <span className="font-mono text-[17px] text-[#FF5C6C] font-bold">
                Combosquatting &amp; name resemblance check
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
