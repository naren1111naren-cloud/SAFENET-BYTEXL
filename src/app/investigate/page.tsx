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
          <div className="text-[14px] text-[#202723] font-bold">No investigation entities selected or available.</div>
          <p className="text-[12px] text-[#626B65] max-w-md mx-auto">
            Run an investigation from the Brand Baseline page to discover live candidate entities and inspect detailed forensic evidence.
          </p>
          <div className="pt-4">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-bold rounded-lg transition-all shadow-xs"
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
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Dossier Header */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
                  INVESTIGATION DOSSIER
                </span>
                <span className="text-[#DDE2DC]">/</span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    threat.riskScore >= 80
                      ? 'text-[#C93643] bg-[#C93643]/10 border border-[#C93643]/30'
                      : 'text-[#D95F36] bg-[#D95F36]/10 border border-[#D95F36]/30'
                  }`}
                >
                  {threat.riskScore >= 80 ? 'CRITICAL RISK' : 'HIGH RISK'}
                </span>
              </div>

              <h1 className="text-[24px] sm:text-[30px] font-mono text-[#202723] font-bold break-all leading-tight">
                {threat.targetAsset}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-[12px] font-mono text-[#626B65] pt-1">
                <span>Targeted brand: <strong className="text-[#202723]">{brand.name}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-[#202723] capitalize">{threat.type.replace('_', ' ')}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-[#477A60] uppercase">{threat.status}</strong></span>
              </div>
            </div>

            {/* Score block */}
            <div className="border border-[#DDE2DC] p-4 rounded-xl bg-[#F7F8F6] shrink-0 min-w-[140px] text-center md:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#858D86] font-bold">
                RISK SCORE
              </span>
              <div className="font-mono text-[34px] font-bold text-[#C93643] leading-none mt-1">
                {threat.riskScore} <span className="text-[12px] text-[#858D86] font-normal">/ 100</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto border-t border-[#DDE2DC] pt-4 text-[13px] font-mono">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`pb-2 transition cursor-pointer whitespace-nowrap font-bold ${
                  activeTab === tab.id
                    ? 'text-[#477A60] border-b-2 border-[#477A60]'
                    : 'text-[#858D86] hover:text-[#202723]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-8">
            <div className="font-mono text-[13px] divide-y divide-[#DDE2DC]">
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#858D86] font-medium">Entity Under Investigation</span>
                <span className="md:col-span-8 text-[#202723] font-bold">{threat.targetAsset}</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#858D86] font-medium">Targeted Brand</span>
                <span className="md:col-span-8 text-[#202723]">{brand.name} ({brand.domain})</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#858D86] font-medium">Threat Vector</span>
                <span className="md:col-span-8 text-[#202723] capitalize">{threat.type.replace('_', ' ')}</span>
              </div>
              <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2">
                <span className="md:col-span-4 text-[#858D86] font-medium">Assigned Analyst</span>
                <span className="md:col-span-8 text-[#202723]">{threat.assignedAnalyst || 'SOC Lead (Level 2)'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t border-[#DDE2DC]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                EXECUTIVE ASSESSMENT
              </span>
              <p className="text-[14px] text-[#626B65] leading-relaxed max-w-3xl">
                SAFENET correlates this entity as an active deceptive brand mimicry operation. Indicators suggest the primary motive is credential harvesting, financial extortion, and deceptive customer support impersonation. Immediate customer warning broadcast and abuse report generation is recommended.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: SIGNALS ── */}
        {activeTab === 'signals' && (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#DDE2DC] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                FLAGGED SIGNALS ({threat.reasons?.length || 0})
              </span>
            </div>

            <div className="divide-y divide-[#DDE2DC]">
              {(threat.reasons || []).map((reason, idx) => (
                <div key={idx} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                  <div className="md:col-span-1 font-mono text-[12px] text-[#858D86] font-bold">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="md:col-span-8 text-[14px] text-[#202723] font-medium">
                    {reason}
                  </div>
                  <div className="md:col-span-3 md:text-right font-mono text-[11px] text-[#626B65]">
                    Deterministic Match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: AI ANALYSIS ── */}
        {activeTab === 'ai_analysis' && (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#DDE2DC] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                SYNTHESIS & ATTRIBUTION
              </span>
            </div>

            <div className="divide-y divide-[#DDE2DC]">
              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#858D86] font-bold">
                  01 / WHAT IS HAPPENING?
                </div>
                <div className="md:col-span-9 text-[14px] text-[#626B65] leading-relaxed">
                  SAFENET analysis indicates an unauthorized actor is operating <code className="text-[#202723] bg-[#F7F8F6] px-1.5 py-0.5 rounded border border-[#DDE2DC] font-mono">{threat.targetAsset}</code> to mirror official services of <strong className="text-[#202723]">{brand.name}</strong>. The asset exhibits deceptive urgency claims and counterfeit KYC verification procedures.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#858D86] font-bold">
                  02 / HOW THE ATTACK WORKS
                </div>
                <div className="md:col-span-9 text-[14px] text-[#626B65] leading-relaxed">
                  The primary motive is consumer credential theft and fraudulent financial diversion. By manufacturing a false sense of urgency around account suspension, the campaign aims to bypass standard security caution and induce victims to reveal banking OTPs or approve UPI transactions.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#858D86] font-bold">
                  03 / WHO IS AFFECTED?
                </div>
                <div className="md:col-span-9 text-[14px] text-[#626B65] leading-relaxed">
                  Potentially affected individuals include active retail customers of {brand.name} receiving unsolicited SMS or WhatsApp messages, particularly those unfamiliar with official domain validation protocols.
                </div>
              </div>

              <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 font-mono text-[11px] uppercase text-[#858D86] font-bold">
                  04 / WHAT TO DO
                </div>
                <div className="md:col-span-9 text-[14px] text-[#626B65] leading-relaxed">
                  Generate an official customer warning broadcast, submit a formal abuse notice to the upstream hosting and registrar provider, and escalate linked UPI identifiers to NPCI / Cyber Crime Cell (1930).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: INFRASTRUCTURE ── */}
        {activeTab === 'infrastructure' && (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#DDE2DC] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                TECHNICAL INFRASTRUCTURE &amp; TELEMETRY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-[#DDE2DC] text-[#858D86] text-[10px] uppercase font-bold">
                    <th className="py-3 pr-4 font-bold">Component</th>
                    <th className="py-3 px-4 font-bold">Observed Indicator</th>
                    <th className="py-3 pl-4 font-bold">Attribution Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2DC]">
                  <tr>
                    <td className="py-3.5 pr-4 text-[#626B65]">Analyzed Entity</td>
                    <td className="py-3.5 px-4 text-[#202723] font-bold">{threat.targetAsset}</td>
                    <td className="py-3.5 pl-4 text-[#858D86]">Target Asset Under Investigation</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#626B65]">Hosting IP</td>
                    <td className="py-3.5 px-4 text-[#202723]">
                      {threat.iocs?.find((i) => i.type === 'ip')?.value || 'Not resolved in historical record'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#858D86]">
                      {threat.iocs?.find((i) => i.type === 'ip') ? 'Observed Resolution Endpoint' : 'Requires live scan query'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#626B65]">Autonomous System</td>
                    <td className="py-3.5 px-4 text-[#202723]">
                      {threat.iocs?.find((i) => i.type === 'asn')?.value || 'Not enriched'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#858D86]">
                      {threat.iocs?.find((i) => i.type === 'asn') ? 'BGP Routing Authority' : 'No ASN attributed'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-[#626B65]">Payment / Scam Pivot</td>
                    <td className="py-3.5 px-4 text-[#C93643] font-bold">
                      {threat.iocs?.find((i) => i.type === 'upi' || i.type === 'phone' || i.type === 'telegram')?.value || 'None captured'}
                    </td>
                    <td className="py-3.5 pl-4 text-[#858D86]">
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
            <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                    CORRELATED BRAND INCIDENTS
                  </span>
                  <div className="text-[12px] text-[#626B65]">
                    Other verified incidents matching brand profile &ldquo;{brand.name}&rdquo;
                  </div>
                </div>
                <Link
                  href="/campaigns"
                  className="font-mono text-[12px] text-[#477A60] hover:text-[#365F49] font-bold"
                >
                  View Campaign Correlation →
                </Link>
              </div>

              {relatedThreats.length > 0 ? (
                <div className="divide-y divide-[#DDE2DC] font-mono text-[12px]">
                  {relatedThreats.slice(0, 5).map((rt) => (
                    <div key={rt.id} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Link href={`/investigate?id=${rt.id}`} className="text-[#202723] font-bold hover:underline">
                          {rt.targetAsset}
                        </Link>
                        <div className="text-[11px] text-[#858D86] capitalize">
                          {rt.type.replace('_', ' ')} • {rt.status.toUpperCase()}
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${rt.riskScore >= 80 ? 'text-[#C93643]' : 'text-[#D95F36]'}`}>
                        Risk {rt.riskScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#858D86] font-mono text-[12px]">
                  No other active threat incidents linked to this asset in local memory.
                </div>
              )}
            </div>
          );
        })()}

        {/* ── TAB 6: RESPONSE ── */}
        {activeTab === 'response' && (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-8">
            {/* Customer Warning Generator */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE2DC] pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase text-[#858D86] font-bold">PUBLIC ADVISORY</span>
                  <h3 className="text-[16px] font-bold text-[#202723]">
                    Customer Safety Warning Generator
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  {(['en', 'hi', 'ta'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setAdvisoryLang(lang)}
                      className={`px-2.5 py-1 rounded-md transition font-semibold ${
                        advisoryLang === lang
                          ? 'bg-[#477A60] text-white'
                          : 'bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] border border-[#DDE2DC]'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F8F6] border border-[#DDE2DC] p-4 rounded-xl font-mono text-[12px] text-[#202723] whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#477A60] hover:bg-[#365F49] text-white text-[12px] font-bold rounded-lg transition shadow-xs"
                >
                  {copiedAdvisory ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedAdvisory ? 'COPIED TO CLIPBOARD' : 'COPY ADVISORY'}
                </button>
              </div>
            </div>

            {/* Abuse Notice Generator */}
            <div className="space-y-4 pt-6 border-t border-[#DDE2DC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE2DC] pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase text-[#858D86] font-bold">REGULATORY DISPATCH</span>
                  <h3 className="text-[16px] font-bold text-[#202723]">
                    Prepare Formal Abuse Notice
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  {(['registrar', 'cert_in', 'npci_bank', 'social_platform'] as const).map((rec) => (
                    <button
                      key={rec}
                      onClick={() => setTakedownRecipient(rec)}
                      className={`px-2.5 py-1 rounded-md capitalize transition font-semibold ${
                        takedownRecipient === rec
                          ? 'bg-[#477A60] text-white'
                          : 'bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] border border-[#DDE2DC]'
                      }`}
                    >
                      {rec.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F8F6] border border-[#DDE2DC] p-4 rounded-xl font-mono text-[11px] text-[#202723] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#477A60] hover:bg-[#365F49] text-white text-[12px] font-bold rounded-lg transition shadow-xs"
                >
                  {copiedNotice ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
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
    <Suspense fallback={<div className="p-12 text-center text-[#858D86] font-mono text-[13px]">Loading investigation dossier...</div>}>
      <InvestigateContent />
    </Suspense>
  );
}
