'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  FileText,
  ArrowRight,
  AlertOctagon,
  GitBranch,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { ThreatItem, BrandProfile } from '@/types/brand';
import { generateCustomerAdvisories } from '@/lib/advisory/customer-advisory';
import { generateTakedownNotice, TakedownRecipient } from '@/lib/takedown/takedown-generator';

type TabView = 'overview' | 'signals' | 'ai_analysis' | 'infrastructure' | 'related' | 'response';

function InvestigateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get('id');
  const initialTab = (searchParams.get('tab') as TabView) || 'overview';

  const [activeTab, setActiveTab] = useState<TabView>(initialTab);
  const [threat, setThreat] = useState<ThreatItem | null>(null);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [takedownRecipient, setTakedownRecipient] = useState<TakedownRecipient>('registrar');
  const [advisoryLang, setAdvisoryLang] = useState<'en' | 'hi' | 'ta'>('en');
  const [copiedAdvisory, setCopiedAdvisory] = useState(false);

  useEffect(() => {
    const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    setBrand(activeBrand);

    const threats = BrandStore.getThreats();
    if (threats.length > 0) {
      if (idParam) {
        const found = threats.find((t) => t.id === idParam);
        setThreat(found || threats[0]);
      } else {
        setThreat(threats[0]);
      }
    }
  }, [idParam]);

  if (!threat || !brand) {
    return (
      <AppShell pageTitle="Investigation Dossier">
        <div className="max-w-4xl mx-auto py-24 text-center space-y-4 font-mono">
          <div className="text-[14px] text-[#F2F4F3]">No investigation entities selected or available.</div>
          <p className="text-[12px] text-[#8A9390] max-w-md mx-auto">
            Run an investigation from the Brand Baseline page to discover live candidate entities and inspect detailed forensic evidence.
          </p>
          <div className="pt-4">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#18E6A3] text-[#080A0B] text-[13px] font-semibold rounded-[2px] hover:bg-[#18E6A3]/90 transition-all"
            >
              <span>START BRAND INVESTIGATION</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const notice = generateTakedownNotice(threat, brand, takedownRecipient);
  const advisories = generateCustomerAdvisories(threat, brand, advisoryLang);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'Signals' },
    { id: 'ai_analysis', label: 'AI Analysis' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'related', label: 'Related Threats' },
    { id: 'response', label: 'Response' },
  ];

  return (
    <AppShell
      pageTitle="Investigation Dossier"
      pageSubtitle={`In-depth forensic examination for ${threat.targetAsset}`}
    >
      <div className="max-w-5xl mx-auto space-y-12 pb-16">
        {/* Dossier Header (Continuous layout, zero cards) */}
        <section className="space-y-6 pb-6 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                  INVESTIGATION DOSSIER
                </span>
                <span className="text-[#59625F]">/</span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                    threat.riskScore >= 80 ? 'text-[#FF5C5C]' : 'text-[#F5B84B]'
                  }`}
                >
                  {threat.riskScore >= 80 ? 'CRITICAL RISK' : 'HIGH RISK'}
                </span>
              </div>

              <h1 className="text-[24px] sm:text-[32px] font-mono text-[#F2F4F3] font-normal break-all leading-tight">
                {threat.targetAsset}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-[12px] font-mono text-[#8A9390] pt-1">
                <span>Targeted brand: <strong className="text-[#F2F4F3]">{brand.name}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-[#F2F4F3] capitalize">{threat.type.replace('_', ' ')}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-[#18E6A3] uppercase">{threat.status}</strong></span>
              </div>
            </div>

            {/* Score block */}
            <div className="border border-[rgba(255,255,255,0.08)] p-4 rounded-[2px] bg-[#0D1011]/40 shrink-0 min-w-[140px] text-center md:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#59625F]">
                RISK SCORE
              </span>
              <div className="font-mono text-[32px] font-light text-[#FF5C5C] leading-none mt-1">
                {threat.riskScore} <span className="text-[12px] text-[#59625F]">/ 100</span>
              </div>
            </div>
          </div>

          {/* Clean Editorial Navigation Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto border-t border-[rgba(255,255,255,0.08)] pt-4 text-[12px] font-mono">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`pb-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                    : 'text-[#59625F] hover:text-[#8A9390]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="font-mono text-[13px] divide-y divide-[rgba(255,255,255,0.08)]">
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#59625F]">Entity Under Investigation</span>
                <span className="md:col-span-8 text-[#F2F4F3]">{threat.targetAsset}</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#59625F]">Targeted Brand</span>
                <span className="md:col-span-8 text-[#F2F4F3]">{brand.name} ({brand.domain})</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#59625F]">Threat Vector</span>
                <span className="md:col-span-8 text-[#F2F4F3] capitalize">{threat.type.replace('_', ' ')}</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#59625F]">Assigned Analyst</span>
                <span className="md:col-span-8 text-[#F2F4F3]">{threat.assignedAnalyst || 'SOC Lead (Level 2)'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-[rgba(255,255,255,0.08)]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                EXECUTIVE ASSESSMENT
              </span>
              <p className="text-[14px] text-[#8A9390] leading-relaxed max-w-3xl">
                SAFENET correlates this entity as an active deceptive brand mimicry operation. Indicators suggest the primary motive is credential harvesting, financial extortion, and deceptive customer support impersonation. Immediate customer warning broadcast and abuse report generation is recommended.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: SIGNALS ── */}
        {activeTab === 'signals' && (
          <div className="space-y-6">
            <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                FLAGGED SIGNALS ({threat.reasons?.length || 0})
              </span>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.08)]">
              {(threat.reasons || []).map((reason, idx) => (
                <div key={idx} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                  <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="md:col-span-8 text-[14px] text-[#F2F4F3]">
                    {reason}
                  </div>
                  <div className="md:col-span-3 md:text-right font-mono text-[11px] text-[#8A9390]">
                    Deterministic Match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: AI ANALYSIS ── */}
        {activeTab === 'ai_analysis' && (
          <div className="space-y-8">
            <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                SYNTHESIS & ATTRIBUTION
              </span>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.08)]">
              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#59625F]">
                  01 / WHAT IS HAPPENING?
                </div>
                <div className="md:col-span-9 text-[14px] text-[#8A9390] leading-relaxed">
                  SAFENET analysis indicates an unauthorized actor is operating <code className="text-[#F2F4F3] font-mono">{threat.targetAsset}</code> to mirror official services of <strong className="text-[#F2F4F3]">{brand.name}</strong>. The asset exhibits deceptive urgency claims and counterfeit KYC verification procedures.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#59625F]">
                  02 / HOW THE ATTACK WORKS
                </div>
                <div className="md:col-span-9 text-[14px] text-[#8A9390] leading-relaxed">
                  The primary motive is consumer credential theft and fraudulent financial diversion. By manufacturing a false sense of urgency around account suspension, the campaign aims to bypass standard security caution and induce victims to reveal banking OTPs or approve UPI transactions.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#59625F]">
                  03 / WHO IS AFFECTED?
                </div>
                <div className="md:col-span-9 text-[14px] text-[#8A9390] leading-relaxed">
                  Potentially affected individuals include active retail customers of {brand.name} receiving unsolicited SMS or WhatsApp messages, particularly those unfamiliar with official domain validation protocols.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#59625F]">
                  04 / WHAT TO DO
                </div>
                <div className="md:col-span-9 text-[14px] text-[#8A9390] leading-relaxed">
                  Generate an official customer warning broadcast, submit a formal abuse notice to the upstream hosting and registrar provider, and escalate linked UPI identifiers to NPCI / Cyber Crime Cell (1930).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: INFRASTRUCTURE ── */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                TECHNICAL INFRASTRUCTURE &amp; TELEMETRY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#59625F] text-[10px] uppercase">
                    <th className="py-3 pr-4 font-normal">Component</th>
                    <th className="py-3 px-4 font-normal">Observed Indicator</th>
                    <th className="py-3 pl-4 font-normal">Attribution Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                  <tr>
                    <td className="py-3.5 pr-4 text-[#8A9390]">Analyzed Entity</td>
                    <td className="py-3.5 px-4 text-[#F2F4F3]">{threat.targetAsset}</td>
                    <td className="py-3.5 pl-4 text-[#59625F]">Target Asset Under Investigation</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#8A9390]">Hosting IP</td>
                    <td className="py-3.5 px-4 text-[#F2F4F3]">
                      {threat.iocs?.find((i) => i.type === 'ip')?.value || 'Not resolved in historical record'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#59625F]">
                      {threat.iocs?.find((i) => i.type === 'ip') ? 'Observed Resolution Endpoint' : 'Requires live scan query'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#8A9390]">Autonomous System</td>
                    <td className="py-3.5 px-4 text-[#F2F4F3]">
                      {threat.iocs?.find((i) => i.type === 'asn')?.value || 'Not enriched'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#59625F]">
                      {threat.iocs?.find((i) => i.type === 'asn') ? 'BGP Routing Authority' : 'No ASN attributed'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#8A9390]">Payment / Scam Pivot</td>
                    <td className="py-3.5 px-4 text-[#FF5C5C]">
                      {threat.iocs?.find((i) => i.type === 'upi' || i.type === 'phone' || i.type === 'telegram')?.value || 'None captured'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#59625F]">
                      {threat.iocs?.some((i) => i.type === 'upi' || i.type === 'phone' || i.type === 'telegram')
                        ? 'Attributed Extraction Mechanism'
                        : 'No direct payment identifier extracted'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: RELATED THREATS ── */}
        {activeTab === 'related' && (() => {
          const relatedThreats = BrandStore.getThreats().filter(
            (t) => t.id !== threat.id && (t.brandId === threat.brandId || t.type === threat.type)
          );

          return (
            <div className="space-y-8">
              <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    CORRELATED BRAND INCIDENTS
                  </span>
                  <div className="text-[12px] text-[#8A9390]">
                    Other verified incidents matching brand profile &ldquo;{brand.name}&rdquo;
                  </div>
                </div>
                <Link
                  href="/campaigns"
                  className="font-mono text-[11px] text-[#8A9390] hover:text-[#F2F4F3] transition-colors"
                >
                  View Campaign Correlation →
                </Link>
              </div>

              {relatedThreats.length > 0 ? (
                <div className="divide-y divide-[rgba(255,255,255,0.08)] font-mono text-[12px]">
                  {relatedThreats.slice(0, 5).map((rt) => (
                    <div key={rt.id} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Link href={`/investigate?id=${rt.id}`} className="text-[#F2F4F3] hover:underline">
                          {rt.targetAsset}
                        </Link>
                        <div className="text-[11px] text-[#59625F] capitalize">
                          {rt.type.replace('_', ' ')} • {rt.status.toUpperCase()}
                        </div>
                      </div>
                      <span className={`font-mono ${rt.riskScore >= 80 ? 'text-[#FF5C5C]' : 'text-[#F5B84B]'}`}>
                        Risk {rt.riskScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#59625F] font-mono text-[12px]">
                  No other active threat incidents linked to this asset in local memory.
                </div>
              )}
            </div>
          );
        })()}

        {/* ── TAB 6: RESPONSE ── */}
        {activeTab === 'response' && (
          <div className="space-y-12">
            {/* Customer Warning Generator */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase text-[#59625F]">PUBLIC ADVISORY</span>
                  <h3 className="text-[16px] font-normal text-[#F2F4F3]">
                    Customer Safety Warning Generator
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {(['en', 'hi', 'ta'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setAdvisoryLang(lang)}
                      className={`px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                        advisoryLang === lang
                          ? 'bg-[#F2F4F3] text-[#080A0B] font-medium'
                          : 'text-[#8A9390] hover:text-[#F2F4F3]'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-4 font-mono text-[12px] text-[#F2F4F3] whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                {advisories.social.content}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(advisories.social.content);
                    setCopiedAdvisory(true);
                    setTimeout(() => setCopiedAdvisory(false), 2000);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F4F3] text-[#080A0B] text-[12px] font-medium rounded-[2px] hover:bg-white transition-all cursor-pointer"
                >
                  {copiedAdvisory ? <Check className="h-3.5 w-3.5 text-[#18E6A3]" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedAdvisory ? 'COPIED TO CLIPBOARD' : 'COPY ADVISORY'}
                </button>
              </div>
            </div>

            {/* Abuse Notice Generator */}
            <div className="space-y-4 pt-6 border-t border-[rgba(255,255,255,0.08)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase text-[#59625F]">REGULATORY DISPATCH</span>
                  <h3 className="text-[16px] font-normal text-[#F2F4F3]">
                    Prepare Formal Abuse Notice
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {(['registrar', 'cert_in', 'npci_bank', 'social_platform'] as const).map((rec) => (
                    <button
                      key={rec}
                      onClick={() => setTakedownRecipient(rec)}
                      className={`px-2 py-0.5 rounded-[2px] capitalize cursor-pointer transition-colors ${
                        takedownRecipient === rec
                          ? 'bg-[#F2F4F3] text-[#080A0B] font-medium'
                          : 'text-[#8A9390] hover:text-[#F2F4F3]'
                      }`}
                    >
                      {rec.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-4 font-mono text-[11px] text-[#F2F4F3] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                {notice.body}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(notice.body);
                    setCopiedNotice(true);
                    setTimeout(() => setCopiedNotice(false), 2000);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F4F3] text-[#080A0B] text-[12px] font-medium rounded-[2px] hover:bg-white transition-all cursor-pointer"
                >
                  {copiedNotice ? <Check className="h-3.5 w-3.5 text-[#18E6A3]" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedNotice ? 'REPORT COPIED' : 'PREPARE REPORT & COPY EVIDENCE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function InvestigatePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#59625F] font-mono text-[13px]">Loading investigation dossier...</div>}>
      <InvestigateContent />
    </Suspense>
  );
}
