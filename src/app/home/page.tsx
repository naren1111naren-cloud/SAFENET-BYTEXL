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
      <div className="space-y-20 py-6 max-w-4xl mx-auto">
        <section className="space-y-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              DIGITAL TRUST, VERIFIED
            </span>
            <h1 className="text-[44px] sm:text-[68px] lg:text-[80px] font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.02]">
              Don&apos;t guess.<br />
              <span className="text-blue-600">Know.</span>
            </h1>
            <p className="text-[18px] sm:text-[20px] text-slate-600 max-w-[640px] leading-relaxed pt-1">
              Investigate the links, accounts, messages, and apps you don&apos;t trust — and examine forensic evidence before you act.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/check"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Check Something</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-[14px] font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Explore Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="pt-8 space-y-5 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-[13px] font-sans uppercase tracking-wider text-slate-800 font-bold">
                WHAT ARE YOU CHECKING?
              </h2>
              <span className="text-[13px] text-slate-500">
                Paste a URL, domain, message, account or application to investigate.
              </span>
            </div>

            <form onSubmit={handleAnalyze} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={typePlaceholders[selectedType]}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none font-mono transition-all shadow-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
                  {(['url', 'message', 'social', 'app', 'lookalike'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedType(mode)}
                      className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        selectedType === mode
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'lookalike' ? 'Look-alike' : mode}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all self-start sm:self-auto"
                >
                  <span>Check Risk</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-400 font-bold pb-1">
            COMMON INVESTIGATIONS
          </div>

          <div className="divide-y divide-slate-100 border-y border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <div
              onClick={() => setSample('url', 'http://paytm-support-verify.xyz')}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                “Is this website legitimate?”
              </span>
              <span className="font-mono text-[13px] text-slate-500">
                paytm-support-verify.xyz
              </span>
            </div>

            <div
              onClick={() => setSample('social', '@Paytm_CareHelp')}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                “Is this support account real?”
              </span>
              <span className="font-mono text-[13px] text-slate-500">
                @Paytm_CareHelp
              </span>
            </div>

            <div
              onClick={() => setSample('message', 'URGENT: Your account KYC expires today. Update PAN via link to avoid suspension.')}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                “Is this payment request a scam?”
              </span>
              <span className="font-mono text-[13px] text-slate-500">
                Account suspension SMS lure
              </span>
            </div>

            <div
              onClick={() => setSample('lookalike', 'Paytm Customer Support Helpline')}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                “Is this look-alike support account legitimate?”
              </span>
              <span className="font-mono text-[13px] text-slate-500">
                Combosquatting &amp; name resemblance check
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
