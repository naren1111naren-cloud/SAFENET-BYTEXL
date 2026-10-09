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
      <div className="max-w-5xl mx-auto space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. CAMPAIGN HEADER & METRICS                                              */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#DDE2DC] pb-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
                  ACTIVE CAMPAIGN
                </span>
                <span className="text-[#DDE2DC]">/</span>
                <span className={`font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  activeCluster && activeCluster.highestRiskScore >= 80
                    ? 'text-[#C93643] bg-[#C93643]/10 border border-[#C93643]/30'
                    : 'text-[#D95F36] bg-[#D95F36]/10 border border-[#D95F36]/30'
                }`}>
                  {activeCluster
                    ? `${activeCluster.highestRiskScore >= 80 ? 'CRITICAL' : 'ELEVATED'} SEVERITY • ${activeCluster.assetCount} ASSETS CORRELATED`
                    : 'NO ACTIVE CAMPAIGN DETECTED'}
                </span>
              </div>

              <h1 className="text-[26px] sm:text-[32px] font-bold text-[#202723] leading-tight">
                {activeCluster ? `"${activeCluster.name}"` : `No Active Threat Cluster for ${brand?.name || 'Selected Brand'}`}
              </h1>

              <p className="text-[14px] text-[#626B65] max-w-2xl leading-relaxed">
                {activeCluster ? (
                  <>
                    {activeCluster.threats.length} distinct threat entities share technical infrastructure or identifiers targeting{' '}
                    <span className="text-[#202723] font-bold">{brand?.name || 'the protected brand'}</span>.
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
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#DDE2DC] bg-[#F7F8F6] hover:bg-[#ECEFEC] text-[#202723] text-[12px] font-mono transition rounded-lg font-bold shrink-0 shadow-xs"
              >
                {copiedDossier ? <Check className="h-3.5 w-3.5 text-[#347653]" /> : <Copy className="h-3.5 w-3.5 text-[#858D86]" />}
                {copiedDossier ? 'DOSSIER COPIED' : 'EXPORT DOSSIER'}
              </button>
            )}
          </div>

          {activeCluster ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DDE2DC]">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                  Correlated Assets
                </div>
                <div className="font-mono text-[32px] font-bold text-[#202723] leading-none">
                  {activeCluster.assetCount}
                </div>
                <div className="font-mono text-[11px] text-[#626B65] pt-1">
                  {activeCluster.threatTypes.join(', ')}
                </div>
              </div>

              <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                  Primary Shared Pivot
                </div>
                <div className="font-mono text-[15px] text-[#202723] font-bold leading-tight pt-2 truncate">
                  {activeCluster.primaryIoc?.value || 'Shared Vector'}
                </div>
                <div className="font-mono text-[11px] text-[#858D86]">
                  Type: {activeCluster.primaryIoc?.type || 'Vector'}
                </div>
              </div>

              <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                  Average Risk
                </div>
                <div className="font-mono text-[32px] font-bold text-[#C93643] leading-none">
                  {activeCluster.avgRiskScore}
                </div>
                <div className="font-mono text-[11px] text-[#858D86] pt-1">
                  Peak: {activeCluster.highestRiskScore}/100
                </div>
              </div>

              <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
                <div className="font-mono text-[11px] text-[#858D86] uppercase font-bold">
                  Shared Identifiers
                </div>
                <div className="font-mono text-[32px] font-bold text-[#202723] leading-none">
                  {activeCluster.sharedIocs.length}
                </div>
                <div className="font-mono text-[11px] text-[#858D86] pt-1">
                  Linked telemetry
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-[#DDE2DC] bg-[#F7F8F6] rounded-xl text-center space-y-2">
              <div className="font-mono text-[13px] text-[#626B65]">
                Zero active cross-vector campaign clusters for {brand?.name || 'this brand'}.
              </div>
              <div className="text-[12px] text-[#858D86]">
                SAFENET requires verifiable shared network infrastructure, shared payment accounts, or shared certificate serials before establishing an attacker campaign.
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 2. ATTRIBUTION PATH                                                       */}
        {/* ========================================================================= */}
        {activeCluster && (
          <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                  CORRELATION TRAIL
                </span>
                <h3 className="text-[20px] font-bold text-[#202723]">
                  Attribution pipeline
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#858D86]">
                {activeCluster.threats.length} Connected Vectors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DDE2DC]">
              {activeCluster.threats.slice(0, 4).map((t: ThreatItem, idx: number) => (
                <div key={t.id} className={`space-y-2 ${idx > 0 ? 'md:pl-6 pt-4 md:pt-0' : ''}`}>
                  <div className="font-mono text-[11px] text-[#858D86] font-bold">
                    {String(idx + 1).padStart(2, '0')} / {t.type.toUpperCase()}
                  </div>
                  <div className="font-mono text-[13px] text-[#202723] font-bold break-all">
                    {t.targetAsset}
                  </div>
                  <div className="text-[12px] text-[#626B65]">
                    {t.reasons?.[0] || 'Correlated adversary infrastructure node.'}
                  </div>
                  <div className="font-mono text-[11px] text-[#C93643] font-bold pt-1">
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
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
            <div className="space-y-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                NETWORK TOPOLOGY
              </span>
              <h3 className="text-[20px] font-bold text-[#202723]">
                Cluster graph
              </h3>
            </div>
            <button
              onClick={() => setShowInteractiveGraph(!showInteractiveGraph)}
              className="font-mono text-[12px] text-[#477A60] hover:text-[#365F49] font-bold cursor-pointer"
            >
              {showInteractiveGraph ? 'Hide interactive graph' : 'Expand interactive graph →'}
            </button>
          </div>

          {showInteractiveGraph ? (
            <div className="border border-[#DDE2DC] bg-[#F7F8F6] rounded-xl overflow-hidden p-2">
              <ThreatClusterGraph threats={threats} />
            </div>
          ) : (
            <div className="py-8 px-6 border border-[#DDE2DC] bg-[#F7F8F6] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[14px] text-[#202723] font-bold">
                  Interactive physics network map
                </div>
                <div className="text-[12px] text-[#626B65]">
                  Renders transitive relationships between brand assets, hosting autonomous systems, and phishing nodes.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInteractiveGraph(true)}
                className="px-4 py-2 border border-[#DDE2DC] bg-white text-[#202723] hover:bg-[#ECEFEC] text-[12px] font-mono rounded-lg cursor-pointer shrink-0 font-bold shadow-xs transition"
              >
                Launch interactive graph →
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. OPERATIONAL RESPONSE ACTION                                            */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-[16px] font-bold text-[#202723]">
              Operational campaign response
            </h4>
            <p className="text-[13px] text-[#626B65]">
              Escalate shared AS44050 endpoints to domain registrar abuse desks and trigger bank freeze on malicious UPI handles.
            </p>
          </div>
          <Link
            href="/incidents"
            className="px-5 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-bold rounded-lg transition shrink-0 text-center shadow-xs"
          >
            Manage incidents →
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
