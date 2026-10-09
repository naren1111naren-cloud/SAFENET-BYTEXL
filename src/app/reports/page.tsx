'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, ThreatItem } from '@/types/brand';

export default function ReportsPage() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    setBrand(activeBrand);
    setThreats(BrandStore.getThreats());

    const handleStorage = () => {
      setBrand(BrandStore.getBrand());
      setThreats(BrandStore.getThreats());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const totalThreats = threats.length;
  const criticalThreats = threats.filter((t) => t.riskScore >= 80).length;
  const highThreats = threats.filter((t) => t.riskScore >= 60 && t.riskScore < 80).length;
  const resolvedCount = threats.filter((t) => t.status === 'resolved').length;
  const topThreats = [...threats].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const monitoredVectors = Array.from(new Set(threats.map((t) => t.type)));

  const handleCopyReport = () => {
    const text = `SAFENET DIGITAL RISK EXECUTIVE BRIEFING
Organization: ${brand?.name || 'Selected Brand'} (${brand?.domain || 'N/A'})
Generated: ${new Date().toUTCString()}

THREAT SUMMARY:
- Total Monitored Incidents: ${totalThreats}
- Critical Severity (>=80): ${criticalThreats}
- Elevated Severity (60-79): ${highThreats}
- Resolved Incidents: ${resolvedCount}

HIGHEST-RISK IDENTIFIERS:
${topThreats.length > 0 ? topThreats.map((t, i) => `${i + 1}. [${t.type.toUpperCase()}] ${t.targetAsset} (Risk: ${t.riskScore}/100)`).join('\n') : 'No high-risk entities identified.'}

DATA SOURCES & REASONING:
All scores and indicators derived from live network telemetry, DNS, RDAP, TLS handshake validation, and deterministic heuristic signals.`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <AppShell
      pageTitle="Intelligence Briefings"
      pageSubtitle="Documented outcomes, longitudinal trends, and executive risk briefings."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. REPORT HEADER & ACTIONS                                                */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-2xl flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
                EXECUTIVE BRIEFING
              </span>
              <span className="text-[#303946]">/</span>
              <span className="font-mono text-[14px] text-[#D0D7E0] font-bold">
                Telemetry Period: Active Session
              </span>
            </div>

            <h1 className="text-[32px] sm:text-[42px] font-extrabold text-[#FFFFFF] leading-tight">
              Digital Risk Summary: {brand?.name || 'Organization'}
            </h1>

            <p className="text-[19px] text-[#D0D7E0] max-w-3xl leading-relaxed font-bold">
              Consolidated intelligence on detected impersonation operations, domain takedown notices, and proactive consumer protection advisories for {brand?.name || 'the protected organization'}.
            </p>
          </div>

          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] text-[17px] font-mono transition rounded-xl font-extrabold shrink-0 shadow-lg cursor-pointer"
          >
            {copiedReport ? <Check className="h-4 w-4 text-[#080B10]" /> : <Copy className="h-4 w-4 text-[#080B10]" />}
            {copiedReport ? 'REPORT COPIED' : 'EXPORT EXECUTIVE REPORT'}
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 2. KEY OUTCOMES (Open, Non-Boxy)                                          */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
            <div className="space-y-1">
              <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
                DOCUMENTED IMPACT
              </span>
              <h3 className="text-[26px] font-extrabold text-[#FFFFFF]">
                Key security outcomes
              </h3>
            </div>
            <span className="font-mono text-[15px] text-[#D0D7E0] font-bold">
              {monitoredVectors.length} Monitored Vector Types
            </span>
          </div>

          <div className="divide-y divide-[#303946]">
            {/* 01 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 font-mono text-[16px] text-[#D0D7E0] font-extrabold">
                01
              </div>
              <div className="md:col-span-4">
                <div className="text-[20px] text-[#FFFFFF] font-extrabold">
                  Identified threat portfolio
                </div>
                <div className="text-[15px] text-[#35D0BA] font-mono mt-0.5 font-bold">
                  {totalThreats} Recorded Assets
                </div>
              </div>
              <div className="md:col-span-5 text-[18px] text-[#D0D7E0] leading-relaxed font-bold">
                Active monitoring across domains, social channels, and scam vectors targeting {brand?.name || 'this brand'}. {criticalThreats} items classified as critical risk.
              </div>
              <div className={`md:col-span-2 md:text-right font-mono text-[15px] font-extrabold ${criticalThreats > 0 ? 'text-[#FF5C6C]' : 'text-[#35D0BA]'}`}>
                {criticalThreats > 0 ? `${criticalThreats} CRITICAL` : 'NORMAL'}
              </div>
            </div>

            {/* 02 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 font-mono text-[16px] text-[#D0D7E0] font-extrabold">
                02
              </div>
              <div className="md:col-span-4">
                <div className="text-[20px] text-[#FFFFFF] font-extrabold">
                  Highest-risk triage targets
                </div>
                <div className="text-[15px] text-[#35D0BA] font-mono mt-0.5 font-bold">
                  {topThreats.length} Prioritized Targets
                </div>
              </div>
              <div className="md:col-span-5 text-[17px] text-[#D0D7E0] leading-relaxed font-mono font-bold">
                {topThreats.length > 0 ? (
                  topThreats.map((t) => (
                    <div key={t.id} className="truncate text-[#FFFFFF]">
                      {t.targetAsset} (Risk: <span className="text-[#FF5C6C] font-extrabold">{t.riskScore}/100</span>)
                    </div>
                  ))
                ) : (
                  <div>No critical threat records currently stored.</div>
                )}
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[15px] text-[#FF5C6C] font-extrabold">
                TRIAGE ACTIVE
              </div>
            </div>

            {/* 03 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 font-mono text-[16px] text-[#D0D7E0] font-extrabold">
                03
              </div>
              <div className="md:col-span-4">
                <div className="text-[20px] text-[#FFFFFF] font-extrabold">
                  Remediation &amp; takedowns
                </div>
                <div className="text-[15px] text-[#35D0BA] font-mono mt-0.5 font-bold">
                  {resolvedCount} Resolved Records
                </div>
              </div>
              <div className="md:col-span-5 text-[18px] text-[#D0D7E0] leading-relaxed font-bold">
                Takedown notices and registrar abuse packages generated from verifiable evidence dossiers.
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[15px] text-[#35D0BA] font-extrabold">
                {resolvedCount > 0 ? 'CONTAINED' : 'READY'}
              </div>
            </div>

            {/* 04 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 font-mono text-[16px] text-[#D0D7E0] font-extrabold">
                04
              </div>
              <div className="md:col-span-4">
                <div className="text-[20px] text-[#FFFFFF] font-extrabold">
                  Threat vector coverage
                </div>
                <div className="text-[15px] text-[#35D0BA] font-mono mt-0.5 font-bold">
                  Telemetry breadth
                </div>
              </div>
              <div className="md:col-span-5 text-[18px] text-[#D0D7E0] leading-relaxed capitalize font-bold">
                {monitoredVectors.length > 0 ? monitoredVectors.join(', ').replace(/_/g, ' ') : 'Domain lookahead and link scanner'}
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[15px] text-[#35D0BA] font-extrabold">
                OPERATIONAL
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
