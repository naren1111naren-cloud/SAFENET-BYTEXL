'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
      <div className="max-w-5xl mx-auto space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. THE 4-STEP VERIFICATION PROCESS (NO CARDS)                             */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
              DECISION ARCHITECTURE
            </span>
            <h2 className="text-[24px] sm:text-[30px] font-normal text-[#F2F4F3] mt-1">
              The 4-step verification loop
            </h2>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.08)]">
            {steps.map((s) => (
              <div key={s.num} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[14px] text-[#59625F]">
                  {s.num}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[16px] text-[#F2F4F3] font-medium">
                    {s.title}
                  </div>
                  <div className="text-[13px] text-[#8A9390] mt-0.5 font-mono">
                    {s.subtitle}
                  </div>
                </div>
                <div className="md:col-span-7 text-[14px] text-[#8A9390] leading-relaxed">
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. COMMON DECEPTION PATTERNS                                              */}
        {/* ========================================================================= */}
        <section className="space-y-8 border-t border-[rgba(255,255,255,0.08)] pt-12">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
              REAL-WORLD LURES
            </span>
            <h3 className="text-[22px] font-normal text-[#F2F4F3] mt-1">
              Common impersonation archetypes
            </h3>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.08)]">
            {commonLures.map((lure, idx) => (
              <div key={idx} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[15px] text-[#F2F4F3] font-normal">
                    {lure.title}
                  </div>
                  <div className="font-mono text-[11px] text-[#FF5C5C] mt-1">
                    {lure.severity} SEVERITY
                  </div>
                </div>
                <div className="md:col-span-7 space-y-2">
                  <div className="font-mono text-[12px] text-[#8A9390] bg-[#0D1011] p-3 border border-[rgba(255,255,255,0.08)] rounded-[2px]">
                    {lure.pattern}
                  </div>
                  <p className="text-[13px] text-[#8A9390] leading-relaxed">
                    <strong className="text-[#F2F4F3]">Reality: </strong> {lure.reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ESCALATION PROTOCOL                                                    */}
        {/* ========================================================================= */}
        <section className="space-y-6 border-t border-[rgba(255,255,255,0.08)] pt-12">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
              EMERGENCY PROTOCOL
            </span>
            <h3 className="text-[22px] font-normal text-[#F2F4F3] mt-1">
              National escalation helplines
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.08)]">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Financial Fraud Helpline
              </div>
              <div className="font-mono text-[28px] font-light text-[#F2F4F3]">
                1930
              </div>
              <p className="text-[12px] text-[#8A9390]">
                National Cyber Crime Reporting Portal helpline for immediate fund freeze.
              </p>
            </div>

            <div className="space-y-1 md:pl-8 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Reporting Portal
              </div>
              <div className="font-mono text-[16px] text-[#F2F4F3] pt-2">
                cybercrime.gov.in
              </div>
              <p className="text-[12px] text-[#8A9390]">
                Official MHA portal for formal FIR registration and digital evidence tracking.
              </p>
            </div>

            <div className="space-y-1 md:pl-8 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Telecom Disconnection (Chakshu)
              </div>
              <div className="font-mono text-[16px] text-[#F2F4F3] pt-2">
                sancharsaathi.gov.in
              </div>
              <p className="text-[12px] text-[#8A9390]">
                DoT facility for reporting fraudulent calls, SMS headers, and rogue WhatsApp numbers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
