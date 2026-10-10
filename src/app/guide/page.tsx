'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, AlertTriangle, PhoneCall } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SafetyGuidePage() {
  const steps = [
    {
      num: '01',
      title: 'ENCOUNTER',
      subtitle: 'Pause at urgency',
      description: 'Whenever you encounter an unexpected message, link, SMS, or viral post that demands immediate action, pause. Urgency is the primary psychological trigger of digital fraud.',
    },
    {
      num: '02',
      title: 'CHECK',
      subtitle: 'Submit to SAFENET',
      description: 'Before clicking, replying or forwarding, submit the artifact into SAFENET. The platform executes lexical similarity heuristics, homoglyph detection, and AI semantic verification.',
    },
    {
      num: '03',
      title: 'UNDERSTAND',
      subtitle: 'Review explainable evidence',
      description: 'Review the technical evidence: Was brand identity mimicked? Is the domain recently registered? Does it solicit unauthorized UPI payments or sensitive credentials?',
    },
    {
      num: '04',
      title: 'ACT',
      subtitle: 'Decide what happens next',
      description: 'Execute the recommended action: Quarantine entity, block destination, create tracked incident, or broadcast customer safety advisory.',
    },
  ];

  const commonLures = [
    {
      title: 'Bank KYC & Account Block Threats',
      pattern: '"Your Paytm / Bank account will be suspended today. Click here to update PAN/KYC."',
      reality: 'Banks never send SMS links for KYC updates. Always log in directly via the official institution application.',
      severity: 'CRITICAL',
    },
    {
      title: 'Electricity / Utility Disconnection',
      pattern: '"Your power will be disconnected at 9:30 PM due to unpaid bill. Call officer at XXXXXX."',
      reality: 'Utility boards do not provide personal mobile numbers for bill clearance. Check official portals only.',
      severity: 'CRITICAL',
    },
    {
      title: 'Government Subsidies & Free Schemes',
      pattern: '"PM Solar Scheme ₹50,000 cash grant credited. Click to claim via UPI."',
      reality: 'Official welfare programs never distribute direct funds through unofficial web links or UPI collect prompts.',
      severity: 'HIGH',
    },
    {
      title: 'Courier Delivery Address Update',
      pattern: '"Package undeliverable due to wrong PIN code. Pay ₹5 fee to reschedule delivery."',
      reality: 'Nominal token fee links redirect to credential harvesters that steal full debit card OTPs.',
      severity: 'HIGH',
    },
  ];

  return (
    <AppShell
      pageEyebrow="Security Operations Knowledge Base"
      pageTitle="Safety Decision Guide"
      pageSubtitle="Knowledge principles to identify deception patterns, verify indicators, and protect organizations."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. THE 4-STEP VERIFICATION PROCESS (Open, Non-Boxy)                       */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div className="border-b border-[#1E2638] pb-5">
            <span className="eyebrow-text font-sans text-xs font-semibold uppercase tracking-wider text-[#F6821F]">
              DECISION ARCHITECTURE
            </span>
            <h2 className="section-title text-xl sm:text-2xl font-bold font-display text-white mt-1">
              The 4-step verification loop
            </h2>
          </div>

          <div className="divide-y divide-[#1E2638]">
            {steps.map((s) => (
              <div key={s.num} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-xl sm:text-2xl text-[#F6821F] font-bold tabular-nums">
                  {s.num}
                </div>
                <div className="md:col-span-4 space-y-1">
                  <div className="card-title text-base sm:text-lg font-semibold font-display text-white">
                    {s.title}
                  </div>
                  <div className="font-sans text-xs sm:text-sm text-sky-400 font-medium">
                    {s.subtitle}
                  </div>
                </div>
                <div className="md:col-span-7 body-text text-sm sm:text-base text-slate-300 leading-relaxed font-normal font-sans">
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. COMMON DECEPTION PATTERNS                                              */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div className="border-b border-[#1E2638] pb-5">
            <span className="eyebrow-text font-sans text-xs font-semibold uppercase tracking-wider text-[#F6821F]">
              REAL-WORLD LURES
            </span>
            <h3 className="section-title text-xl sm:text-2xl font-bold font-display text-white mt-1">
              Common impersonation archetypes
            </h3>
          </div>

          <div className="divide-y divide-[#1E2638]">
            {commonLures.map((lure, idx) => (
              <div key={idx} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-sm text-slate-400 font-semibold tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <div className="card-title text-base sm:text-lg font-semibold font-display text-white">
                    {lure.title}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold uppercase tracking-wider border ${
                      lure.severity === 'CRITICAL'
                        ? 'text-[#FF5C6C] bg-[#2D1216] border-[#FF5C6C]/40'
                        : 'text-[#FFAB40] bg-[#2C1C0D] border-[#FFAB40]/40'
                    }`}>
                      {lure.severity} SEVERITY
                    </span>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-3">
                  <div className="font-mono text-xs sm:text-sm text-slate-200 bg-[#111625] p-3.5 border border-[#1E2638] rounded-xl font-normal leading-relaxed">
                    {lure.pattern}
                  </div>
                  <p className="body-text text-sm sm:text-base text-slate-300 leading-relaxed font-normal font-sans">
                    <strong className="text-[#F6821F] font-semibold">Reality: </strong> {lure.reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ESCALATION PROTOCOL                                                    */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div className="border-b border-[#1E2638] pb-5">
            <span className="eyebrow-text font-sans text-xs font-semibold uppercase tracking-wider text-[#F6821F]">
              EMERGENCY PROTOCOL
            </span>
            <h3 className="section-title text-xl sm:text-2xl font-bold font-display text-white mt-1">
              National escalation helplines
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#1E2638]">
            <div className="space-y-1.5">
              <div className="stat-label font-sans text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Financial Fraud Helpline
              </div>
              <div className="stat-value font-mono text-3xl sm:text-4xl font-bold text-[#F6821F] tabular-nums tracking-tight">
                1930
              </div>
              <p className="small-text text-xs sm:text-sm text-slate-400 leading-relaxed font-normal font-sans">
                National Cyber Crime Reporting Portal helpline for immediate fund freeze.
              </p>
            </div>

            <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
              <div className="stat-label font-sans text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Reporting Portal
              </div>
              <div className="data-text font-mono text-base sm:text-lg text-white font-semibold pt-1">
                cybercrime.gov.in
              </div>
              <p className="small-text text-xs sm:text-sm text-slate-400 leading-relaxed font-normal font-sans">
                Official MHA portal for formal FIR registration and digital evidence tracking.
              </p>
            </div>

            <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
              <div className="stat-label font-sans text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Telecom Disconnection (Chakshu)
              </div>
              <div className="data-text font-mono text-base sm:text-lg text-white font-semibold pt-1">
                sancharsaathi.gov.in
              </div>
              <p className="small-text text-xs sm:text-sm text-slate-400 leading-relaxed font-normal font-sans">
                DoT facility for reporting fraudulent calls, SMS headers, and rogue WhatsApp numbers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
