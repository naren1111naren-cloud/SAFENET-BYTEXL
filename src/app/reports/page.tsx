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
      pageEyebrow="Longitudinal Risk Telemetry"
      pageTitle="Intelligence Briefings"
      pageSubtitle="Documented outcomes, longitudinal trends, and executive risk briefings."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. REPORT HEADER & ACTIONS                                                */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-2xl flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span className="eyebrow-text text-[#F6821F]">
                EXECUTIVE BRIEFING
              </span>
              <span className="text-[#1E2638]">/</span>
              <span className="eyebrow-text text-slate-400">
                Telemetry Period: Active Session
              </span>
            </div>

            <h1 className="page-title text-white leading-tight">
              Digital Risk Summary: {brand?.name || 'Organization'}
            </h1>

            <p className="body-text text-slate-400 max-w-3xl leading-relaxed">
              Consolidated intelligence on detected impersonation operations, domain takedown notices, and proactive consumer protection advisories for {brand?.name || 'the protected organization'}.
            </p>
          </div>

          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text transition rounded-xl font-semibold shrink-0 shadow-lg cursor-pointer"
          >
            {copiedReport ? <Check className="h-4 w-4 text-[#080B11]" /> : <Copy className="h-4 w-4 text-[#080B11]" />}
            {copiedReport ? 'REPORT COPIED' : 'EXPORT EXECUTIVE REPORT'}
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 2. KEY OUTCOMES (Open, Non-Boxy)                                          */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
            <div className="space-y-1">
              <span className="eyebrow-text text-[#F6821F] block">
                DOCUMENTED IMPACT
              </span>
              <h3 className="section-title text-white">
                Key security outcomes
              </h3>
            </div>
            <span className="eyebrow-text text-slate-400">
              {monitoredVectors.length} Monitored Vector Types
            </span>
          </div>

          <div className="divide-y divide-[#1E2638]">
            {/* 01 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 data-text text-slate-400">
                01
              </div>
              <div className="md:col-span-4">
                <div className="card-title text-white">
                  Identified threat portfolio
                </div>
                <div className="eyebrow-text text-[#F6821F] mt-0.5">
                  {totalThreats} Recorded Assets
                </div>
              </div>
              <div className="md:col-span-5 small-text text-slate-300 leading-relaxed">
                Active monitoring across domains, social channels, and scam vectors targeting {brand?.name || 'this brand'}. {criticalThreats} items classified as critical risk.
              </div>
              <div className={`md:col-span-2 md:text-right eyebrow-text ${criticalThreats > 0 ? 'text-[#FF5C6C]' : 'text-[#F6821F]'}`}>
                {criticalThreats > 0 ? `${criticalThreats} CRITICAL` : 'NORMAL'}
              </div>
            </div>

            {/* 02 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 data-text text-slate-400">
                02
              </div>
              <div className="md:col-span-4">
                <div className="card-title text-white">
                  Highest-risk triage targets
                </div>
                <div className="eyebrow-text text-[#F6821F] mt-0.5">
                  {topThreats.length} Prioritized Targets
                </div>
              </div>
              <div className="md:col-span-5 text-xs text-slate-300 leading-relaxed space-y-1">
                {topThreats.length > 0 ? (
                  topThreats.map((t) => (
                    <div key={t.id} className="truncate">
                      <span className="data-text text-white">{t.targetAsset}</span> (Risk: <span className="data-text text-[#FF5C6C] font-semibold">{t.riskScore}/100</span>)
                    </div>
                  ))
                ) : (
                  <div className="small-text text-slate-400">No critical threat records currently stored.</div>
                )}
              </div>
              <div className="md:col-span-2 md:text-right eyebrow-text text-[#FF5C6C]">
                TRIAGE ACTIVE
              </div>
            </div>

            {/* 03 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 data-text text-slate-400">
                03
              </div>
              <div className="md:col-span-4">
                <div className="card-title text-white">
                  Remediation &amp; takedowns
                </div>
                <div className="eyebrow-text text-[#F6821F] mt-0.5">
                  {resolvedCount} Resolved Records
                </div>
              </div>
              <div className="md:col-span-5 small-text text-slate-300 leading-relaxed">
                Takedown notices and registrar abuse packages generated from verifiable evidence dossiers.
              </div>
              <div className="md:col-span-2 md:text-right eyebrow-text text-[#F6821F]">
                {resolvedCount > 0 ? 'CONTAINED' : 'READY'}
              </div>
            </div>

            {/* 04 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
              <div className="md:col-span-1 data-text text-slate-400">
                04
              </div>
              <div className="md:col-span-4">
                <div className="card-title text-white">
                  Threat vector coverage
                </div>
                <div className="eyebrow-text text-[#F6821F] mt-0.5">
                  Telemetry breadth
                </div>
              </div>
              <div className="md:col-span-5 small-text text-slate-300 leading-relaxed capitalize">
                {monitoredVectors.length > 0 ? monitoredVectors.join(', ').replace(/_/g, ' ') : 'Domain lookahead and link scanner'}
              </div>
              <div className="md:col-span-2 md:text-right eyebrow-text text-[#F6821F]">
                OPERATIONAL
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
