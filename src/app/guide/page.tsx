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
      <div className="max-w-5xl mx-auto space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. THE 4-STEP VERIFICATION PROCESS                                        */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#DDE2DC] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
              DECISION ARCHITECTURE
            </span>
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#202723] mt-1">
              The 4-step verification loop
            </h2>
          </div>

          <div className="divide-y divide-[#DDE2DC]">
            {steps.map((s) => (
              <div key={s.num} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[16px] text-[#477A60] font-bold">
                  {s.num}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[16px] text-[#202723] font-bold">
                    {s.title}
                  </div>
                  <div className="text-[13px] text-[#626B65] mt-0.5 font-mono">
                    {s.subtitle}
                  </div>
                </div>
                <div className="md:col-span-7 text-[14px] text-[#626B65] leading-relaxed">
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. COMMON DECEPTION PATTERNS                                              */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#DDE2DC] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
              REAL-WORLD LURES
            </span>
            <h3 className="text-[22px] font-bold text-[#202723] mt-1">
              Common impersonation archetypes
            </h3>
          </div>

          <div className="divide-y divide-[#DDE2DC]">
            {commonLures.map((lure, idx) => (
              <div key={idx} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                <div className="md:col-span-1 font-mono text-[12px] text-[#858D86] font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-4">
                  <div className="text-[15px] text-[#202723] font-bold">
                    {lure.title}
                  </div>
                  <div className="font-mono text-[11px] font-bold mt-1">
                    <span className={`px-2 py-0.5 rounded-full ${
                      lure.severity === 'CRITICAL'
                        ? 'text-[#C93643] bg-[#C93643]/10 border border-[#C93643]/30'
                        : 'text-[#D95F36] bg-[#D95F36]/10 border border-[#D95F36]/30'
                    }`}>
                      {lure.severity} SEVERITY
                    </span>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-2">
                  <div className="font-mono text-[12px] text-[#202723] bg-[#F7F8F6] p-3.5 border border-[#DDE2DC] rounded-lg">
                    {lure.pattern}
                  </div>
                  <p className="text-[13px] text-[#626B65] leading-relaxed">
                    <strong className="text-[#202723]">Reality: </strong> {lure.reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ESCALATION PROTOCOL                                                    */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#DDE2DC] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
              EMERGENCY PROTOCOL
            </span>
            <h3 className="text-[22px] font-bold text-[#202723] mt-1">
              National escalation helplines
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DDE2DC]">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                Financial Fraud Helpline
              </div>
              <div className="font-mono text-[30px] font-bold text-[#477A60]">
                1930
              </div>
              <p className="text-[12px] text-[#626B65]">
                National Cyber Crime Reporting Portal helpline for immediate fund freeze.
              </p>
            </div>

            <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                Reporting Portal
              </div>
              <div className="font-mono text-[16px] text-[#202723] font-bold pt-2">
                cybercrime.gov.in
              </div>
              <p className="text-[12px] text-[#626B65]">
                Official MHA portal for formal FIR registration and digital evidence tracking.
              </p>
            </div>

            <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                Telecom Disconnection (Chakshu)
              </div>
              <div className="font-mono text-[16px] text-[#202723] font-bold pt-2">
                sancharsaathi.gov.in
              </div>
              <p className="text-[12px] text-[#626B65]">
                DoT facility for reporting fraudulent calls, SMS headers, and rogue WhatsApp numbers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
