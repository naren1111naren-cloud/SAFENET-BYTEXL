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
      <AppShell pageEyebrow="Forensic Intelligence Dossier" pageTitle="Investigation Dossier">
        <div className="max-w-4xl mx-auto py-24 text-center space-y-5">
          <div className="card-title text-white">No investigation entities selected or available.</div>
          <p className="small-text text-slate-400 max-w-md mx-auto">
            Run an investigation from the Brand Baseline page to discover live candidate entities and inspect detailed forensic evidence.
          </p>
          <div className="pt-4">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text font-semibold rounded-xl transition-all shadow-lg"
            >
              <span>START BRAND INVESTIGATION</span>
              <ArrowRight className="h-4 w-4" />
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
      pageEyebrow="Forensic Intelligence Dossier"
      pageTitle="Investigation Dossier"
      pageSubtitle={`In-depth forensic examination for ${threat.targetAsset}`}
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-16">
        {/* Dossier Header (Open, Non-Boxy) */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="eyebrow-text text-slate-400">
                  INVESTIGATION DOSSIER
                </span>
                <span className="text-[#1E2638]">/</span>
                <span
                  className={`eyebrow-text px-3 py-1 rounded-lg border ${
                    threat.riskScore >= 80
                      ? 'text-[#FF5C6C] bg-[#2D1216] border-[#FF5C6C]/40'
                      : 'text-[#FFAB40] bg-[#2C1C0D] border-[#FFAB40]/40'
                  }`}
                >
                  {threat.riskScore >= 80 ? 'CRITICAL RISK' : 'HIGH RISK'}
                </span>
              </div>

              <h1 className="page-title text-white break-all leading-tight">
                {threat.targetAsset}
              </h1>

              <div className="flex flex-wrap items-center gap-3.5 small-text text-slate-400 pt-1">
                <span>Targeted brand: <strong className="text-[#F6821F] font-semibold">{brand.name}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-white capitalize font-semibold">{threat.type.replace('_', ' ')}</strong></span>
                <span>•</span>
                <span>Status: <strong className="eyebrow-text text-sky-400">{threat.status}</strong></span>
              </div>
            </div>

            {/* Score block */}
            <div className="border border-[#1E2638] p-5 rounded-2xl bg-[#111625] shrink-0 min-w-[170px] text-center md:text-right shadow-md">
              <span className="stat-label text-slate-400 block mb-1">
                RISK SCORE
              </span>
              <div className="stat-value text-3xl text-[#FF5C6C] leading-none mt-1">
                {threat.riskScore} <span className="data-text text-xs text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto border-t border-[#1E2638] pt-4 text-xs font-sans uppercase tracking-wider">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`pb-3 transition cursor-pointer whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
            <div className="text-xs divide-y divide-[#1E2638]">
              <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-4 eyebrow-text text-slate-400">Entity Under Investigation</span>
                <span className="md:col-span-8 data-text text-white font-semibold">{threat.targetAsset}</span>
              </div>
              <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-4 eyebrow-text text-slate-400">Targeted Brand</span>
                <span className="md:col-span-8 small-text text-white font-medium">{brand.name} (<span className="data-text">{brand.domain}</span>)</span>
              </div>
              <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-4 eyebrow-text text-slate-400">Threat Vector</span>
                <span className="md:col-span-8 small-text text-white font-medium capitalize">{threat.type.replace('_', ' ')}</span>
              </div>
              <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-4 eyebrow-text text-slate-400">Assigned Analyst</span>
                <span className="md:col-span-8 small-text text-[#F6821F] font-medium">{threat.assignedAnalyst || 'SOC Lead (Level 2)'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#1E2638]">
              <span className="eyebrow-text text-[#F6821F] block">
                EXECUTIVE ASSESSMENT
              </span>
              <p className="body-text text-slate-300 leading-relaxed max-w-4xl">
                SAFENET correlates this entity as an active deceptive brand mimicry operation. Indicators suggest the primary motive is credential harvesting, financial extortion, and deceptive customer support impersonation. Immediate customer warning broadcast and abuse report generation is recommended.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: SIGNALS ── */}
        {activeTab === 'signals' && (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
            <div className="border-b border-[#1E2638] pb-4">
              <span className="eyebrow-text text-[#F6821F] block">
                FLAGGED SIGNALS ({threat.reasons?.length || 0})
              </span>
            </div>

            <div className="divide-y divide-[#1E2638]">
              {(threat.reasons || []).map((reason, idx) => (
                <div key={idx} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                  <div className="md:col-span-1 data-text text-xs text-slate-400">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="md:col-span-8 small-text text-slate-200 font-sans">
                    {reason}
                  </div>
                  <div className="md:col-span-3 md:text-right eyebrow-text text-[#F6821F]">
                    Deterministic Match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: AI ANALYSIS ── */}
        {activeTab === 'ai_analysis' && (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
            <div className="border-b border-[#1E2638] pb-4">
              <span className="eyebrow-text text-[#F6821F] block">
                SYNTHESIS &amp; ATTRIBUTION
              </span>
            </div>

            <div className="divide-y divide-[#1E2638]">
              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                <div className="md:col-span-3 eyebrow-text text-[#F6821F]">
                  01 / WHAT IS HAPPENING?
                </div>
                <div className="md:col-span-9 small-text text-slate-300 leading-relaxed">
                  SAFENET analysis indicates an unauthorized actor is operating <code className="data-text text-white bg-[#111625] px-2 py-0.5 rounded border border-[#1E2638]">{threat.targetAsset}</code> to mirror official services of <strong className="text-white font-semibold">{brand.name}</strong>. The asset exhibits deceptive urgency claims and counterfeit KYC verification procedures.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                <div className="md:col-span-3 eyebrow-text text-[#F6821F]">
                  02 / HOW THE ATTACK WORKS
                </div>
                <div className="md:col-span-9 small-text text-slate-300 leading-relaxed">
                  The primary motive is consumer credential theft and fraudulent financial diversion. By manufacturing a false sense of urgency around account suspension, the campaign aims to bypass standard security caution and induce victims to reveal banking OTPs or approve UPI transactions.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                <div className="md:col-span-3 eyebrow-text text-[#F6821F]">
                  03 / WHO IS AFFECTED?
                </div>
                <div className="md:col-span-9 small-text text-slate-300 leading-relaxed">
                  Potentially affected individuals include active retail customers of {brand.name} receiving unsolicited SMS or WhatsApp messages, particularly those unfamiliar with official domain validation protocols.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                <div className="md:col-span-3 eyebrow-text text-[#F6821F]">
                  04 / WHAT TO DO
                </div>
                <div className="md:col-span-9 small-text text-slate-300 leading-relaxed">
                  Generate an official customer warning broadcast, submit a formal abuse notice to the upstream hosting and registrar provider, and escalate linked UPI identifiers to NPCI / Cyber Crime Cell (1930).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: INFRASTRUCTURE ── */}
        {activeTab === 'infrastructure' && (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
            <div className="border-b border-[#1E2638] pb-4">
              <span className="eyebrow-text text-[#F6821F] block">
                TECHNICAL INFRASTRUCTURE &amp; TELEMETRY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2638] text-slate-400">
                    <th className="table-header-text py-3 pr-5">Component</th>
                    <th className="table-header-text py-3 px-5">Observed Indicator</th>
                    <th className="table-header-text py-3 pl-5">Attribution Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]">
                  <tr>
                    <td className="py-3.5 pr-5 eyebrow-text text-slate-400">Analyzed Entity</td>
                    <td className="py-3.5 px-5 data-text text-white font-semibold">{threat.targetAsset}</td>
                    <td className="py-3.5 pl-5 small-text text-slate-400">Target Asset Under Investigation</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-5 eyebrow-text text-slate-400">Hosting IP</td>
                    <td className="py-3.5 px-5 data-text text-sky-400 font-semibold">
                      {threat.iocs?.find((i) => i.type === 'ip')?.value || 'Not resolved in historical record'}
                    </td>
                    <td className="py-3.5 pl-5 small-text text-slate-400">
                      {threat.iocs?.find((i) => i.type === 'ip') ? 'Observed Resolution Endpoint' : 'Requires live scan query'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-5 eyebrow-text text-slate-400">Autonomous System</td>
                    <td className="py-3.5 px-5 data-text text-sky-400 font-semibold">
                      {threat.iocs?.find((i) => i.type === 'asn')?.value || 'Not enriched'}
                    </td>
                    <td className="py-3.5 pl-5 small-text text-slate-400">
                      {threat.iocs?.find((i) => i.type === 'asn') ? 'BGP Routing Authority' : 'No ASN attributed'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-5 eyebrow-text text-slate-400">Payment / Scam Pivot</td>
                    <td className="py-3.5 px-5 data-text text-[#FF5C6C] font-semibold">
                      {threat.iocs?.find((i) => i.type === 'upi' || i.type === 'phone' || i.type === 'telegram')?.value || 'None captured'}
                    </td>
                    <td className="py-3.5 pl-5 small-text text-slate-400">
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
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="eyebrow-text text-[#F6821F] block">
                    CORRELATED BRAND INCIDENTS
                  </span>
                  <div className="small-text text-slate-400">
                    Other verified incidents matching brand profile &ldquo;{brand.name}&rdquo;
                  </div>
                </div>
                <Link
                  href="/campaigns"
                  className="button-text text-[#F6821F] hover:text-[#ff9438]"
                >
                  View Campaign Correlation →
                </Link>
              </div>

              {relatedThreats.length > 0 ? (
                <div className="divide-y divide-[#1E2638] text-xs">
                  {relatedThreats.slice(0, 5).map((rt) => (
                    <div key={rt.id} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <Link href={`/investigate?id=${rt.id}`} className="data-text text-white font-semibold hover:text-[#F6821F]">
                          {rt.targetAsset}
                        </Link>
                        <div className="eyebrow-text text-slate-400">
                          {rt.type.replace('_', ' ')} • {rt.status.toUpperCase()}
                        </div>
                      </div>
                      <span className={`data-text font-semibold text-sm ${rt.riskScore >= 80 ? 'text-[#FF5C6C]' : 'text-[#FFAB40]'}`}>
                        Risk {rt.riskScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 small-text">
                  No other active threat incidents linked to this asset in local memory.
                </div>
              )}
            </div>
          );
        })()}

        {/* ── TAB 6: RESPONSE ── */}
        {activeTab === 'response' && (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-10">
            {/* Customer Warning Generator */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="eyebrow-text text-[#F6821F] block">PUBLIC ADVISORY</span>
                  <h3 className="section-title text-white">
                    Customer Safety Warning Generator
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {(['en', 'hi', 'ta'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setAdvisoryLang(lang)}
                      className={`px-3 py-1.5 rounded-lg transition button-text cursor-pointer ${
                        advisoryLang === lang
                          ? 'bg-[#F6821F] text-[#080B11] font-semibold'
                          : 'bg-[#111625] text-slate-400 hover:text-white border border-[#1E2638]'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111625] border border-[#1E2638] p-5 rounded-xl small-text text-slate-200 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text font-semibold rounded-xl transition shadow-lg cursor-pointer"
                >
                  {copiedAdvisory ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedAdvisory ? 'COPIED TO CLIPBOARD' : 'COPY ADVISORY'}
                </button>
              </div>
            </div>

            {/* Abuse Notice Generator */}
            <div className="space-y-5 pt-8 border-t border-[#1E2638]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="eyebrow-text text-[#F6821F] block">REGULATORY DISPATCH</span>
                  <h3 className="section-title text-white">
                    Prepare Formal Abuse Notice
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {(['registrar', 'cert_in', 'npci_bank', 'social_platform'] as const).map((rec) => (
                    <button
                      key={rec}
                      onClick={() => setTakedownRecipient(rec)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition button-text cursor-pointer ${
                        takedownRecipient === rec
                          ? 'bg-[#F6821F] text-[#080B11] font-semibold'
                          : 'bg-[#111625] text-slate-400 hover:text-white border border-[#1E2638]'
                      }`}
                    >
                      {rec.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111625] border border-[#1E2638] p-5 rounded-xl data-text text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text font-semibold rounded-xl transition shadow-lg cursor-pointer"
                >
                  {copiedNotice ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
    <Suspense fallback={<div className="p-12 text-center text-slate-400 small-text">Loading investigation dossier...</div>}>
      <InvestigateContent />
    </Suspense>
  );
}
