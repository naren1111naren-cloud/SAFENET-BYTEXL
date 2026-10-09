'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Copy,
  Check,
  Eye,
  ArrowRight,
  Globe,
  Server,
  AtSign,
  Smartphone,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ThreatClusterGraph from '@/components/ThreatClusterGraph';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { ThreatItem, BrandProfile, ThreatIOC } from '@/types/brand';
import { clusterThreatsBySharedIocs, ThreatCluster } from '@/lib/clustering/threat-clusterer';

export default function CampaignsPage() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [showInteractiveGraph, setShowInteractiveGraph] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);

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

  // Compute real clusters dynamically
  const clusterData = React.useMemo(() => {
    return clusterThreatsBySharedIocs(threats);
  }, [threats]);

  const activeCluster: ThreatCluster | null = clusterData.clusters[0] || null;

  const handleCopyDossier = () => {
    if (!activeCluster) return;
    const text = `SAFENET COORDINATED CAMPAIGN INTELLIGENCE DOSSIER
Campaign: "${activeCluster.name}"
ID: ${activeCluster.id}
Risk: ${activeCluster.highestRiskScore >= 80 ? 'CRITICAL' : 'HIGH'} (${activeCluster.highestRiskScore}/100)
Correlated Indicators (${activeCluster.threats.length + activeCluster.sharedIocs.length}):
${activeCluster.threats.map((t: ThreatItem, idx: number) => `${idx + 1}. [${t.type}] ${t.targetAsset}`).join('\n')}
${activeCluster.sharedIocs.map((ioc: ThreatIOC, idx: number) => `${activeCluster.threats.length + idx + 1}. [Shared ${ioc.type}] ${ioc.value}`).join('\n')}

SHARED ATTRIBUTION PATH:
${activeCluster.sharedIocs.map((ioc: ThreatIOC) => `${ioc.type.toUpperCase()}: ${ioc.value}`).join(' → ') || 'Correlated via shared attack vector'}`;
    navigator.clipboard.writeText(text);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  return (
    <AppShell
      pageTitle="Campaign Intelligence"
      pageSubtitle="Correlated infrastructure, shared identifiers, and multi-vector attacker clusters."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. CAMPAIGN HEADER & METRICS                                              */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#303946] pb-8">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[14px] uppercase tracking-wider text-[#D0D7E0] font-extrabold">
                  ACTIVE CAMPAIGN
                </span>
                <span className="text-[#303946]">/</span>
                <span className={`font-mono text-[14px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-lg border ${
                  activeCluster && activeCluster.highestRiskScore >= 80
                    ? 'text-[#FF5C6C] bg-[#2D1216] border-[#FF5C6C]/40'
                    : 'text-[#FFAB40] bg-[#2C1C0D] border-[#FFAB40]/40'
                }`}>
                  {activeCluster
                    ? `${activeCluster.highestRiskScore >= 80 ? 'CRITICAL' : 'ELEVATED'} SEVERITY • ${activeCluster.assetCount} ASSETS CORRELATED`
                    : 'NO ACTIVE CAMPAIGN DETECTED'}
                </span>
              </div>

              <h1 className="text-[32px] sm:text-[42px] font-extrabold text-[#FFFFFF] leading-tight">
                {activeCluster ? `"${activeCluster.name}"` : `No Active Threat Cluster for ${brand?.name || 'Selected Brand'}`}
              </h1>

              <p className="text-[19px] text-[#D0D7E0] max-w-3xl leading-relaxed font-bold">
                {activeCluster ? (
                  <>
                    {activeCluster.threats.length} distinct threat entities share technical infrastructure or identifiers targeting{' '}
                    <span className="text-[#35D0BA] font-extrabold">{brand?.name || 'the protected brand'}</span>.
                  </>
                ) : (
                  <>
                    No multi-vector correlation clusters have been confirmed for {brand?.name || 'this brand'}. Campaign relationships are only established when verified shared infrastructure (IP, registrar, payment handle) is detected across 2 or more distinct threat assets.
                  </>
                )}
              </p>
            </div>

            {activeCluster && (
              <button
                type="button"
                onClick={handleCopyDossier}
                className="inline-flex items-center gap-2.5 px-5 py-3 border border-[#303946] bg-[#121821] hover:bg-[#19222D] text-[#FFFFFF] text-[16px] font-mono transition rounded-xl font-extrabold shrink-0 shadow-md cursor-pointer"
              >
                {copiedDossier ? <Check className="h-4 w-4 text-[#35D0BA]" /> : <Copy className="h-4 w-4 text-[#D0D7E0]" />}
                {copiedDossier ? 'DOSSIER COPIED' : 'EXPORT DOSSIER'}
              </button>
            )}
          </div>

          {activeCluster ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#303946]">
              <div className="space-y-1.5">
                <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                  Correlated Assets
                </div>
                <div className="font-mono text-[42px] font-extrabold text-[#FFFFFF] leading-none">
                  {activeCluster.assetCount}
                </div>
                <div className="font-mono text-[15px] text-[#35D0BA] pt-1 font-bold">
                  {activeCluster.threatTypes.join(', ')}
                </div>
              </div>

              <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                  Primary Shared Pivot
                </div>
                <div className="font-mono text-[20px] text-[#FFFFFF] font-extrabold leading-tight pt-2 truncate">
                  {activeCluster.primaryIoc?.value || 'Shared Vector'}
                </div>
                <div className="font-mono text-[14px] text-[#64A9FF] font-bold">
                  Type: {activeCluster.primaryIoc?.type || 'Vector'}
                </div>
              </div>

              <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                  Average Risk
                </div>
                <div className="font-mono text-[42px] font-extrabold text-[#FF5C6C] leading-none">
                  {activeCluster.avgRiskScore}
                </div>
                <div className="font-mono text-[14px] text-[#D0D7E0] pt-1 font-bold">
                  Peak: {activeCluster.highestRiskScore}/100
                </div>
              </div>

              <div className="space-y-1.5 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[14px] text-[#D0D7E0] uppercase font-extrabold">
                  Shared Identifiers
                </div>
                <div className="font-mono text-[42px] font-extrabold text-[#FFFFFF] leading-none">
                  {activeCluster.sharedIocs.length}
                </div>
                <div className="font-mono text-[14px] text-[#35D0BA] pt-1 font-bold">
                  Linked telemetry
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-[#303946] bg-[#121821] rounded-2xl text-center space-y-2">
              <div className="font-mono text-[17px] text-[#FFFFFF] font-bold">
                Zero active cross-vector campaign clusters for {brand?.name || 'this brand'}.
              </div>
              <div className="text-[15px] text-[#D0D7E0] font-bold">
                SAFENET requires verifiable shared network infrastructure, shared payment accounts, or shared certificate serials before establishing an attacker campaign.
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 2. ATTRIBUTION PATH                                                       */}
        {/* ========================================================================= */}
        {activeCluster && (
          <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
            <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
                  CORRELATION TRAIL
                </span>
                <h3 className="text-[26px] font-extrabold text-[#FFFFFF]">
                  Attribution pipeline
                </h3>
              </div>
              <span className="font-mono text-[15px] text-[#D0D7E0] font-bold">
                {activeCluster.threats.length} Connected Vectors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#303946]">
              {activeCluster.threats.slice(0, 4).map((t: ThreatItem, idx: number) => (
                <div key={t.id} className={`space-y-2.5 ${idx > 0 ? 'md:pl-6 pt-4 md:pt-0' : ''}`}>
                  <div className="font-mono text-[14px] text-[#64A9FF] font-extrabold">
                    {String(idx + 1).padStart(2, '0')} / {t.type.toUpperCase()}
                  </div>
                  <div className="font-mono text-[18px] text-[#FFFFFF] font-extrabold break-all">
                    {t.targetAsset}
                  </div>
                  <div className="text-[16px] text-[#D0D7E0] font-bold">
                    {t.reasons?.[0] || 'Correlated adversary infrastructure node.'}
                  </div>
                  <div className="font-mono text-[15px] text-[#FF5C6C] font-extrabold pt-1">
                    Risk {t.riskScore} / 100
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. CLUSTER NETWORK VISUALIZATION                                          */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl space-y-8">
          <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
            <div className="space-y-1">
              <span className="font-mono text-[14px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
                NETWORK TOPOLOGY
              </span>
              <h3 className="text-[26px] font-extrabold text-[#FFFFFF]">
                Cluster graph
              </h3>
            </div>
            <button
              onClick={() => setShowInteractiveGraph(!showInteractiveGraph)}
              className="font-mono text-[16px] text-[#35D0BA] hover:text-[#2EB8A5] font-extrabold cursor-pointer"
            >
              {showInteractiveGraph ? 'Hide interactive graph' : 'Expand interactive graph →'}
            </button>
          </div>

          {showInteractiveGraph ? (
            <div className="border border-[#303946] bg-[#080B10] rounded-2xl overflow-hidden p-3">
              <ThreatClusterGraph threats={threats} />
            </div>
          ) : (
            <div className="py-10 px-8 border border-[#303946] bg-[#121821] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="text-[19px] text-[#FFFFFF] font-extrabold">
                  Interactive physics network map
                </div>
                <div className="text-[16px] text-[#D0D7E0] font-bold">
                  Renders transitive relationships between brand assets, hosting autonomous systems, and phishing nodes.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInteractiveGraph(true)}
                className="px-6 py-3.5 border border-[#303946] bg-[#080B10] text-[#FFFFFF] hover:bg-[#19222D] text-[16px] font-mono rounded-xl cursor-pointer shrink-0 font-extrabold shadow-md transition"
              >
                Launch interactive graph →
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. OPERATIONAL RESPONSE ACTION                                            */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h4 className="text-[22px] font-extrabold text-[#FFFFFF]">
              Operational campaign response
            </h4>
            <p className="text-[17px] text-[#D0D7E0] font-bold">
              Escalate shared AS44050 endpoints to domain registrar abuse desks and trigger bank freeze on malicious UPI handles.
            </p>
          </div>
          <Link
            href="/incidents"
            className="px-7 py-3.5 bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] text-[18px] font-extrabold rounded-xl transition shrink-0 text-center shadow-lg"
          >
            Manage incidents →
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
