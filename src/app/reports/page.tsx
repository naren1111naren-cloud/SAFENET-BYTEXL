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
      <div className="max-w-5xl mx-auto space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. REPORT HEADER & ACTIONS                                                */}
        {/* ========================================================================= */}
        <section className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[rgba(255,255,255,0.08)] pb-8">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                EXECUTIVE BRIEFING
              </span>
              <span className="text-[#59625F]">/</span>
              <span className="font-mono text-[11px] text-[#8A9390]">
                Telemetry Period: Active Session
              </span>
            </div>

            <h1 className="text-[26px] sm:text-[32px] font-normal text-[#F2F4F3] leading-tight">
              Digital Risk Summary: {brand?.name || 'Organization'}
            </h1>

            <p className="text-[14px] text-[#8A9390] max-w-2xl leading-relaxed">
              Consolidated intelligence on detected impersonation operations, domain takedown notices, and proactive consumer protection advisories for {brand?.name || 'the protected organization'}.
            </p>
          </div>

          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.08)] text-[#F2F4F3] text-[12px] font-mono hover:border-[rgba(255,255,255,0.25)] transition-colors rounded-[2px] cursor-pointer shrink-0"
          >
            {copiedReport ? <Check className="h-3.5 w-3.5 text-[#18E6A3]" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedReport ? 'REPORT COPIED' : 'EXPORT EXECUTIVE REPORT'}
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 2. KEY OUTCOMES (CONTINUOUS EDITORIAL ROWS)                               */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                DOCUMENTED IMPACT
              </span>
              <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                Key security outcomes
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#59625F]">
              {monitoredVectors.length} Monitored Vector Types
            </span>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.08)]">
            {/* 01 */}
            <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                01
              </div>
              <div className="md:col-span-4">
                <div className="text-[15px] text-[#F2F4F3] font-normal">
                  Identified threat portfolio
                </div>
                <div className="text-[12px] text-[#8A9390] font-mono mt-0.5">
                  {totalThreats} Recorded Assets
                </div>
              </div>
              <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed">
                Active monitoring across domains, social channels, and scam vectors targeting {brand?.name || 'this brand'}. {criticalThreats} items classified as critical risk.
              </div>
              <div className={`md:col-span-2 md:text-right font-mono text-[11px] ${criticalThreats > 0 ? 'text-[#FF5C5C]' : 'text-[#18E6A3]'}`}>
                {criticalThreats > 0 ? `${criticalThreats} CRITICAL` : 'NORMAL'}
              </div>
            </div>

            {/* 02 */}
            <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                02
              </div>
              <div className="md:col-span-4">
                <div className="text-[15px] text-[#F2F4F3] font-normal">
                  Highest-risk triage targets
                </div>
                <div className="text-[12px] text-[#8A9390] font-mono mt-0.5">
                  {topThreats.length} Prioritized Targets
                </div>
              </div>
              <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed font-mono text-[12px]">
                {topThreats.length > 0 ? (
                  topThreats.map((t) => (
                    <div key={t.id} className="truncate">
                      {t.targetAsset} (Risk: {t.riskScore}/100)
                    </div>
                  ))
                ) : (
                  <div>No critical threat records currently stored.</div>
                )}
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[11px] text-[#FF5C5C]">
                TRIAGE ACTIVE
              </div>
            </div>

            {/* 03 */}
            <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                03
              </div>
              <div className="md:col-span-4">
                <div className="text-[15px] text-[#F2F4F3] font-normal">
                  Remediation &amp; takedowns
                </div>
                <div className="text-[12px] text-[#8A9390] font-mono mt-0.5">
                  {resolvedCount} Resolved Records
                </div>
              </div>
              <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed">
                Takedown notices and registrar abuse packages generated from verifiable evidence dossiers.
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[11px] text-[#18E6A3]">
                {resolvedCount > 0 ? 'CONTAINED' : 'READY'}
              </div>
            </div>

            {/* 04 */}
            <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                04
              </div>
              <div className="md:col-span-4">
                <div className="text-[15px] text-[#F2F4F3] font-normal">
                  Threat vector coverage
                </div>
                <div className="text-[12px] text-[#8A9390] font-mono mt-0.5">
                  Telemetry breadth
                </div>
              </div>
              <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed capitalize">
                {monitoredVectors.length > 0 ? monitoredVectors.join(', ').replace(/_/g, ' ') : 'Domain lookahead and link scanner'}
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[11px] text-[#18E6A3]">
                OPERATIONAL
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
