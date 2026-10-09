'use client';

/**
 * SAFENET Public Editorial Threat Search & Overview Page
 * Preserved at /home for exploring capabilities and running fast checks.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
      <div className="space-y-28 py-6 max-w-4xl mx-auto">
        <section className="space-y-10">
          <div className="space-y-6">
            <span className="block text-[11px] sm:text-[12px] font-sans tracking-[0.08em] text-[#8A9390] uppercase font-medium">
              DIGITAL TRUST, VERIFIED
            </span>
            <h1 className="text-[44px] sm:text-[68px] lg:text-[88px] font-bold text-[#F2F4F3] tracking-[-0.035em] leading-[0.98]">
              DON&apos;T GUESS.<br />
              KNOW.
            </h1>
            <p className="text-[18px] sm:text-[20px] text-[#8A9390] max-w-[640px] leading-relaxed pt-1">
              Investigate the links, accounts, messages and apps you don&apos;t trust — and see the evidence before you act.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/check"
                className="btn-accent inline-flex items-center gap-2 px-6 py-3 rounded-[4px] text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider cursor-pointer"
              >
                <span>CHECK SOMETHING</span>
                <span>→</span>
              </Link>
              <Link
                href="/overview"
                className="btn-quiet inline-flex items-center px-5 py-3 rounded-[4px] text-[13px] sm:text-[14px] font-medium text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
              >
                <span>EXPLORE DASHBOARD</span>
              </Link>
            </div>
          </div>

          <div className="pt-10 space-y-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-[12px] sm:text-[13px] font-sans uppercase tracking-[0.08em] text-[#F2F4F3] font-semibold">
                WHAT ARE YOU CHECKING?
              </h2>
              <span className="text-[12px] text-[#8A9390]">
                Paste a URL, domain, message, account or application to investigate its risk signals.
              </span>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={typePlaceholders[selectedType]}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] focus:border-[#18E6A3] rounded-[4px] px-4 py-3.5 text-[14px] text-[#F2F4F3] placeholder-[#59625F] outline-none font-mono transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1 text-[11px] font-sans">
                  {(['url', 'message', 'social', 'app', 'lookalike'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedType(mode)}
                      className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer ${
                        selectedType === mode
                          ? 'bg-[rgba(255,255,255,0.08)] text-[#F2F4F3] font-semibold'
                          : 'text-[#8A9390] hover:text-[#F2F4F3]'
                      }`}
                    >
                      {mode === 'lookalike' ? 'Look-alike' : mode}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-accent inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[4px] text-[12px] font-semibold uppercase tracking-wider cursor-pointer self-start sm:self-auto"
                >
                  <span>CHECK RISK</span>
                  <span>→</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-sans uppercase tracking-[0.08em] text-[#59625F] font-semibold pb-1">
            COMMON INVESTIGATIONS
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.06)] border-y border-[rgba(255,255,255,0.06)]">
            <div
              onClick={() => setSample('url', 'http://paytm-support-verify.xyz')}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-[rgba(255,255,255,0.015)] transition-colors"
            >
              <span className="text-[14px] text-[#F2F4F3] group-hover:text-[#18E6A3] transition-colors">
                “Is this website legitimate?”
              </span>
              <span className="font-mono text-[12px] text-[#8A9390]">
                paytm-support-verify.xyz
              </span>
            </div>

            <div
              onClick={() => setSample('social', '@Paytm_CareHelp')}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-[rgba(255,255,255,0.015)] transition-colors"
            >
              <span className="text-[14px] text-[#F2F4F3] group-hover:text-[#18E6A3] transition-colors">
                “Is this support account real?”
              </span>
              <span className="font-mono text-[12px] text-[#8A9390]">
                @Paytm_CareHelp
              </span>
            </div>

            <div
              onClick={() => setSample('message', 'URGENT: Your account KYC expires today. Update PAN via link to avoid suspension.')}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-[rgba(255,255,255,0.015)] transition-colors"
            >
              <span className="text-[14px] text-[#F2F4F3] group-hover:text-[#18E6A3] transition-colors">
                “Is this payment request a scam?”
              </span>
              <span className="font-mono text-[12px] text-[#8A9390]">
                Account suspension SMS lure
              </span>
            </div>

            <div
              onClick={() => setSample('lookalike', 'Paytm Customer Support Helpline')}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group cursor-pointer hover:bg-[rgba(255,255,255,0.015)] transition-colors"
            >
              <span className="text-[14px] text-[#F2F4F3] group-hover:text-[#18E6A3] transition-colors">
                “Is this look-alike support account legitimate?”
              </span>
              <span className="font-mono text-[12px] text-[#8A9390]">
                Combosquatting &amp; name resemblance check
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
