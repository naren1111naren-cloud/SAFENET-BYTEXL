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
      pageTitle="Safety Decision Guide"
      pageSubtitle="Knowledge principles to identify deception patterns, verify indicators, and protect organizations."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. THE 4-STEP VERIFICATION PROCESS (Open, Non-Boxy)                       */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="border-b border-[#303946] pb-5">
            <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
              DECISION ARCHITECTURE
            </span>
            <h2 className="text-[30px] sm:text-[38px] font-extrabold text-[#FFFFFF] mt-1">
              The 4-step verification loop
            </h2>
          </div>

          <div className="divide-y divide-[#303946]">
            {steps.map((s) => (
              <div key={s.num} className="py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[22px] text-[#35D0BA] font-extrabold">
                  {s.num}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[22px] text-[#FFFFFF] font-extrabold">
                    {s.title}
                  </div>
                  <div className="text-[16px] text-[#64A9FF] mt-1 font-mono font-bold">
                    {s.subtitle}
                  </div>
                </div>
                <div className="md:col-span-7 text-[19px] text-[#D0D7E0] leading-relaxed font-bold">
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. COMMON DECEPTION PATTERNS                                              */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="border-b border-[#303946] pb-5">
            <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
              REAL-WORLD LURES
            </span>
            <h3 className="text-[28px] font-extrabold text-[#FFFFFF] mt-1">
              Common impersonation archetypes
            </h3>
          </div>

          <div className="divide-y divide-[#303946]">
            {commonLures.map((lure, idx) => (
              <div key={idx} className="py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[16px] text-[#D0D7E0] font-extrabold">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[20px] text-[#FFFFFF] font-extrabold">
                    {lure.title}
                  </div>
                  <div className="font-mono text-[14px] font-extrabold mt-1.5">
                    <span className={`px-3 py-1 rounded-md border ${
                      lure.severity === 'CRITICAL'
                        ? 'text-[#FF5C6C] bg-[#2D1216] border-[#FF5C6C]/40'
                        : 'text-[#FFAB40] bg-[#2C1C0D] border-[#FFAB40]/40'
                    }`}>
                      {lure.severity} SEVERITY
                    </span>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-3">
                  <div className="font-mono text-[16px] text-[#FFFFFF] bg-[#121821] p-4 border border-[#303946] rounded-xl font-bold">
                    {lure.pattern}
                  </div>
                  <p className="text-[18px] text-[#D0D7E0] leading-relaxed font-bold">
                    <strong className="text-[#35D0BA]">Reality: </strong> {lure.reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ESCALATION PROTOCOL                                                    */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="border-b border-[#303946] pb-5">
            <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
              EMERGENCY PROTOCOL
            </span>
            <h3 className="text-[28px] font-extrabold text-[#FFFFFF] mt-1">
              National escalation helplines
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#303946]">
            <div className="space-y-1.5">
              <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                Financial Fraud Helpline
              </div>
              <div className="font-mono text-[42px] font-extrabold text-[#35D0BA]">
                1930
              </div>
              <p className="text-[17px] text-[#D0D7E0] font-bold">
                National Cyber Crime Reporting Portal helpline for immediate fund freeze.
              </p>
            </div>

            <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
              <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                Reporting Portal
              </div>
              <div className="font-mono text-[22px] text-[#FFFFFF] font-extrabold pt-2">
                cybercrime.gov.in
              </div>
              <p className="text-[17px] text-[#D0D7E0] font-bold">
                Official MHA portal for formal FIR registration and digital evidence tracking.
              </p>
            </div>

            <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
              <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                Telecom Disconnection (Chakshu)
              </div>
              <div className="font-mono text-[22px] text-[#FFFFFF] font-extrabold pt-2">
                sancharsaathi.gov.in
              </div>
              <p className="text-[17px] text-[#D0D7E0] font-bold">
                DoT facility for reporting fraudulent calls, SMS headers, and rogue WhatsApp numbers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
