'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Globe,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Eye,
  X,
  Check,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Shield,
  Filter,
  ChevronDown,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import {
  BrandIdentityProfile,
  BrandIdentityFingerprint,
  OfficialProfileCandidate,
  SocialCandidateAnalysis,
  SocialPlatform,
  ProviderConfigStatus,
  ThreatClassification,
} from '@/lib/social/types';
import { SocialStore, SocialScanRecord } from '@/lib/social/social-store';
import { BrandDiscoveryResult } from '@/lib/social/brand-discovery';

// Clean platform badge in Organic Monochrome
function PlatformBadge({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case 'youtube':
      return (
        <span className="font-mono text-[10px] font-bold text-[#C93643] bg-[#C93643]/10 px-2 py-0.5 rounded border border-[#C93643]/20">
          YOUTUBE
        </span>
      );
    case 'twitter':
      return (
        <span className="font-mono text-[10px] font-bold text-[#3974C6] bg-[#3974C6]/10 px-2 py-0.5 rounded border border-[#3974C6]/20">
          X / TWITTER
        </span>
      );
    case 'instagram':
      return (
        <span className="font-mono text-[10px] font-bold text-[#E1306C] bg-[#E1306C]/10 px-2 py-0.5 rounded border border-[#E1306C]/20">
          INSTAGRAM
        </span>
      );
    case 'facebook':
      return (
        <span className="font-mono text-[10px] font-bold text-[#1877F2] bg-[#1877F2]/10 px-2 py-0.5 rounded border border-[#1877F2]/20">
          FACEBOOK
        </span>
      );
    case 'linkedin':
      return (
        <span className="font-mono text-[10px] font-bold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded border border-[#0A66C2]/20">
          LINKEDIN
        </span>
      );
    case 'website':
      return (
        <span className="font-mono text-[10px] font-bold text-[#477A60] bg-[#E7F0E9] px-2 py-0.5 rounded border border-[#477A60]/30">
          OFFICIAL WEB
        </span>
      );
    default:
      return (
        <span className="font-mono text-[10px] font-semibold text-[#626B65] bg-[#ECEFEC] px-2 py-0.5 rounded border border-[#DDE2DC]">
          {platform.toUpperCase()}
        </span>
      );
  }
}

// 5-Tier Threat Classification Badge (Organic Monochrome)
function ThreatTierBadge({ tier, score }: { tier?: ThreatClassification; score: number }) {
  switch (tier) {
    case 'LIKELY_OFFICIAL':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#347653] bg-[#347653]/10 border border-[#347653]/30 px-2 py-0.5 rounded">
          <ShieldCheck className="h-3 w-3" />
          LIKELY OFFICIAL ({score}/100)
        </span>
      );
    case 'LOW_CONCERN':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#3974C6] bg-[#3974C6]/10 border border-[#3974C6]/30 px-2 py-0.5 rounded">
          <Shield className="h-3 w-3" />
          RELATED / LOW CONCERN ({score}/100)
        </span>
      );
    case 'SUSPICIOUS':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#B7791F] bg-[#B7791F]/10 border border-[#B7791F]/30 px-2 py-0.5 rounded">
          <AlertTriangle className="h-3 w-3" />
          SUSPICIOUS ({score}/100)
        </span>
      );
    case 'HIGH_RISK':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#D95F36] bg-[#D95F36]/10 border border-[#D95F36]/30 px-2 py-0.5 rounded">
          <AlertOctagon className="h-3 w-3" />
          POTENTIAL IMPERSONATION ({score}/100)
        </span>
      );
    case 'CRITICAL_THREAT':
    default:
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#C93643] bg-[#C93643]/10 border border-[#C93643]/30 px-2 py-0.5 rounded">
          <ShieldAlert className="h-3 w-3" />
          CRITICAL THREAT ({score}/100)
        </span>
      );
  }
}

export default function SocialMonitoringPage() {
  // Brand Input State
  const [inputBrandName, setInputBrandName] = useState('Nike');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [optionalWebsite, setOptionalWebsite] = useState('');
  const [optionalTwitter, setOptionalTwitter] = useState('');
  const [optionalInstagram, setOptionalInstagram] = useState('');

  // Selected Brand & Fingerprint & Discovery Result
  const [brands, setBrands] = useState<BrandIdentityProfile[]>([]);
  const [activeBrand, setActiveBrand] = useState<BrandIdentityProfile | null>(null);
  const [fingerprint, setFingerprint] = useState<BrandIdentityFingerprint | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<BrandDiscoveryResult | null>(null);

  // Providers & Config
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderConfigStatus>>({});
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);

  // Scanning Progress & Status
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeScanStep, setActiveScanStep] = useState(0);
  const [scanError, setScanError] = useState('');
  const [lastScanRecord, setLastScanRecord] = useState<SocialScanRecord | null>(null);

  // Candidates & Threat Feed
  const [candidates, setCandidates] = useState<SocialCandidateAnalysis[]>([]);
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [feedSearch, setFeedSearch] = useState('');

  // Deep Investigation Drawer
  const [investigatingCandidate, setInvestigatingCandidate] = useState<SocialCandidateAnalysis | null>(null);

  // Load Initial Brand Baseline
  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    const list = SocialStore.getBrands();
    setBrands(list);

    // Look for Nike or first brand
    const nikeBrand = list.find((b) => b.brandName.toLowerCase() === 'nike') || list[0];
    if (nikeBrand) {
      setActiveBrand(nikeBrand);
      setInputBrandName(nikeBrand.brandName);
      if (nikeBrand.fingerprint) {
        setFingerprint(nikeBrand.fingerprint);
      }
      loadCandidatesForBrand(nikeBrand.id);
    }

    try {
      const res = await fetch('/api/social/providers');
      if (res.ok) {
        const data = await res.json();
        setProviderStatuses(data.providers || {});
        setIsDemoModeActive(Boolean(data.demoMode));
      }
    } catch {
      // offline fallback
    }
  };

  const loadCandidatesForBrand = (brandId: string) => {
    const list = SocialStore.getCandidates({ brandId });
    setCandidates(list);
    const scans = SocialStore.getScans(brandId);
    if (scans.length > 0) {
      setLastScanRecord(scans[0]);
    }
  };

  // Real Multi-Stage Progress Stepper
  const scanStages = [
    { title: 'DISCOVERING BRAND IDENTITY', desc: 'Validating canonical domain & Organization schemas' },
    { title: 'DISCOVERING OFFICIAL PROFILES', desc: 'Querying YouTube, X, Meta, LinkedIn registries' },
    { title: 'BUILDING IDENTITY FINGERPRINT', desc: 'Normalizing trusted usernames, domains, and keywords' },
    { title: 'SEARCHING FOR LOOKALIKES', desc: 'Synthesizing combosquatting & typographic mutations' },
    { title: 'ANALYZING LINKS & NETWORKS', desc: 'Executing SAFENET domain intelligence & DNS checks' },
    { title: 'CALCULATING EXPLAINABLE RISK', desc: 'Attributing technical evidence and threat classification' },
  ];

  // Primary Investigation Flow: "Just enter brand name"
  const handleInvestigateBrand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputBrandName.trim();
    if (!query) return;

    setIsInvestigating(true);
    setScanError('');
    setActiveScanStep(0);

    // Dynamic progress stepper timer
    const stepInterval = setInterval(() => {
      setActiveScanStep((prev) => {
        if (prev < scanStages.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      // Step 1: Register / Discover Brand Identity
      const regRes = await fetch('/api/social/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: query,
          officialWebsite: optionalWebsite || undefined,
          officialSocialHandles: {
            twitter: optionalTwitter || undefined,
            instagram: optionalInstagram || undefined,
          },
        }),
      });

      if (!regRes.ok) {
        throw new Error('Failed to establish brand identity baseline.');
      }

      const regData = await regRes.json();
      const brand: BrandIdentityProfile = regData.brand;
      setActiveBrand(brand);
      setDiscoveryResult(regData.discovery);

      if (!regData.isIdentityEstablished || !regData.fingerprint) {
        // Stop here: Identity is NOT established!
        setFingerprint(null);
        setCandidates([]);
        clearInterval(stepInterval);
        setActiveScanStep(scanStages.length - 1);
        setIsInvestigating(false);
        return;
      }

      setFingerprint(regData.fingerprint);

      // Step 2: Trigger Full Perimeter Scan
      const scanRes = await fetch(`/api/social/brands/${brand.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeDemoData: isDemoModeActive,
        }),
      });

      clearInterval(stepInterval);
      setActiveScanStep(scanStages.length - 1);

      if (scanRes.ok) {
        const scanData = await scanRes.json();
        setLastScanRecord(scanData.scan);
        if (scanData.fingerprint) {
          setFingerprint(scanData.fingerprint);
        }
        loadCandidatesForBrand(brand.id);
        const updatedBrands = SocialStore.getBrands();
        setBrands(updatedBrands);
      } else {
        const errJson = await scanRes.json();
        setScanError(errJson.error || 'Perimeter investigation failed.');
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setScanError(err?.message || 'Error executing brand investigation.');
    } finally {
      setTimeout(() => {
        setIsInvestigating(false);
      }, 500);
    }
  };

  // Status updates
  const handleUpdateStatus = async (
    candidateId: string,
    newStatus: 'reviewed' | 'watchlist' | 'new'
  ) => {
    try {
      await fetch(`/api/social/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      SocialStore.updateCandidateStatus(candidateId, newStatus);
      if (activeBrand) loadCandidatesForBrand(activeBrand.id);
      if (investigatingCandidate && investigatingCandidate.candidate.id === candidateId) {
        setInvestigatingCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((item) => {
    const tier = item.risk.threatClassification || 'LOW_CONCERN';

    if (filterTier === 'HIGH_RISK') {
      if (tier !== 'HIGH_RISK' && tier !== 'CRITICAL_THREAT') return false;
    } else if (filterTier === 'SUSPICIOUS') {
      if (tier !== 'SUSPICIOUS') return false;
    } else if (filterTier === 'OFFICIAL') {
      if (tier !== 'LIKELY_OFFICIAL') return false;
    }

    if (filterPlatform !== 'ALL' && item.candidate.platform.toLowerCase() !== filterPlatform.toLowerCase()) {
      return false;
    }

    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase();
      const matchHandle = item.candidate.username.toLowerCase().includes(q);
      const matchName = item.candidate.displayName.toLowerCase().includes(q);
      const matchDesc = item.candidate.description.toLowerCase().includes(q);
      if (!matchHandle && !matchName && !matchDesc) return false;
    }

    return true;
  });

  // Threat Landscape Counts
  const totalDiscovered = candidates.length;
  const criticalCount = candidates.filter((c) => c.risk.threatClassification === 'CRITICAL_THREAT').length;
  const highRiskCount = candidates.filter((c) => c.risk.threatClassification === 'HIGH_RISK').length;
  const suspiciousCount = candidates.filter((c) => c.risk.threatClassification === 'SUSPICIOUS').length;
  const lowConcernCount = candidates.filter((c) => c.risk.threatClassification === 'LOW_CONCERN').length;
  const likelyOfficialCount = candidates.filter((c) => c.risk.threatClassification === 'LIKELY_OFFICIAL').length;

  return (
    <AppShell
      pageTitle="Digital Risk & Brand Monitoring"
      pageSubtitle="Establish verified identity baselines, discover deceptive lookalikes, and safeguard social perimeter."
    >
      <div className="space-y-8 pb-16">
        {/* ========================================================================= */}
        {/* 1. BRAND INVESTIGATION HEADER                                             */}
        {/* ========================================================================= */}
        <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                BRAND PERIMETER PROTECTION
              </span>
              <p className="text-[13px] text-[#626B65] mt-0.5">
                Discover canonical enterprise identities, map official channels, and surface impersonation campaigns.
              </p>
            </div>

            {/* Quick Switcher of previously investigated brands */}
            {brands.length > 0 && (
              <div className="flex items-center gap-2 text-[12px] font-mono">
                <span className="text-[#858D86]">History:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {brands.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBrand(b);
                        setInputBrandName(b.brandName);
                        if (b.fingerprint) setFingerprint(b.fingerprint);
                        loadCandidatesForBrand(b.id);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        activeBrand?.id === b.id
                          ? 'bg-[#E7F0E9] text-[#477A60] border border-[#477A60]/40'
                          : 'bg-[#ECEFEC] text-[#626B65] hover:text-[#202723] hover:bg-[#DDE2DC]'
                      }`}
                    >
                      {b.brandName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Input Bar */}
          <form onSubmit={handleInvestigateBrand} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#858D86] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter brand name (e.g. Nike, Paytm, HDFC Bank, PayPal)..."
                  value={inputBrandName}
                  onChange={(e) => setInputBrandName(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] text-[#202723] placeholder-[#858D86] text-[14px] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#477A60] focus:ring-1 focus:ring-[#477A60] transition"
                />
              </div>

              <button
                type="submit"
                disabled={isInvestigating || !inputBrandName.trim()}
                className={`px-6 py-3 rounded-xl text-[13px] font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                  isInvestigating
                    ? 'bg-[#E7F0E9] text-[#477A60] border border-[#477A60]/40 cursor-not-allowed'
                    : 'bg-[#477A60] hover:bg-[#365F49] text-white shadow-xs'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${isInvestigating ? 'animate-spin' : ''}`} />
                {isInvestigating ? 'Investigating...' : 'Investigate Brand'}
              </button>
            </div>

            {/* Optional manual fields toggle */}
            <div className="flex items-center justify-between text-[12px] text-[#626B65]">
              <button
                type="button"
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="hover:text-[#202723] flex items-center gap-1 font-medium transition"
              >
                <ChevronDown className={`h-3.5 w-3.5 transform ${showAdvancedInputs ? 'rotate-180' : ''}`} />
                {showAdvancedInputs ? 'Hide optional official URLs' : 'Optional: Specify official website or handles manually'}
              </button>

              {activeBrand && lastScanRecord && (
                <div className="flex items-center gap-1.5 text-[#858D86]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Last scanned: {new Date(lastScanRecord.completedAt || lastScanRecord.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {showAdvancedInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl text-[12px]">
                <div>
                  <label className="text-[#626B65] text-[11px] font-semibold block mb-1">Official Website (optional)</label>
                  <input
                    type="text"
                    placeholder="https://nike.com"
                    value={optionalWebsite}
                    onChange={(e) => setOptionalWebsite(e.target.value)}
                    className="w-full bg-white border border-[#DDE2DC] rounded-lg px-3 py-2 text-[#202723] text-[13px] focus:outline-none focus:border-[#477A60]"
                  />
                </div>
                <div>
                  <label className="text-[#626B65] text-[11px] font-semibold block mb-1">X (Twitter) Handle (optional)</label>
                  <input
                    type="text"
                    placeholder="@Nike"
                    value={optionalTwitter}
                    onChange={(e) => setOptionalTwitter(e.target.value)}
                    className="w-full bg-white border border-[#DDE2DC] rounded-lg px-3 py-2 text-[#202723] text-[13px] focus:outline-none focus:border-[#477A60]"
                  />
                </div>
                <div>
                  <label className="text-[#626B65] text-[11px] font-semibold block mb-1">Instagram Handle (optional)</label>
                  <input
                    type="text"
                    placeholder="@nike"
                    value={optionalInstagram}
                    onChange={(e) => setOptionalInstagram(e.target.value)}
                    className="w-full bg-white border border-[#DDE2DC] rounded-lg px-3 py-2 text-[#202723] text-[13px] focus:outline-none focus:border-[#477A60]"
                  />
                </div>
              </div>
            )}
          </form>
        </section>

        {/* ========================================================================= */}
        {/* 2. REAL SCAN STATUS & MULTI-STAGE PROGRESS                                */}
        {/* ========================================================================= */}
        {isInvestigating && (
          <section className="bg-white border border-[#477A60]/40 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DDE2DC] pb-3">
              <div className="flex items-center gap-2 text-[#477A60] font-mono text-[13px] font-bold">
                <RefreshCw className="h-4 w-4 animate-spin" />
                DIGITAL RISK INVESTIGATION RUNNING FOR &quot;{inputBrandName.toUpperCase()}&quot;
              </div>
              <span className="font-mono text-[11px] text-[#626B65]">
                Stage {activeScanStep + 1} of {scanStages.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scanStages.map((stage, idx) => {
                const isCurrent = idx === activeScanStep;
                const isPast = idx < activeScanStep;
                return (
                  <div
                    key={stage.title}
                    className={`flex items-start gap-3 p-3 rounded-lg text-[12px] border ${
                      isCurrent
                        ? 'bg-[#E7F0E9] border-[#477A60]/40 text-[#477A60]'
                        : isPast
                        ? 'bg-[#F7F8F6] border-[#DDE2DC] text-[#347653]'
                        : 'bg-white border-[#ECEFEC] text-[#858D86]'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <CheckCircle2 className="h-4 w-4 text-[#347653]" />
                      ) : isCurrent ? (
                        <RefreshCw className="h-4 w-4 text-[#477A60] animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-[#DDE2DC]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold font-mono">{stage.title}</div>
                      <div className="text-[11px] text-[#626B65] mt-0.5">{stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {scanError && (
          <div className="p-4 rounded-xl bg-[#C93643]/10 border border-[#C93643]/30 text-[#C93643] text-[13px] flex items-center gap-2 font-medium">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            {scanError}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. OFFICIAL IDENTITY SECTION                                              */}
        {/* ========================================================================= */}
        {(discoveryResult || fingerprint) && (() => {
          const isEstablished = discoveryResult ? discoveryResult.isIdentityEstablished : Boolean(fingerprint);
          const brandDisplayName = discoveryResult?.brandName || fingerprint?.brandName || activeBrand?.brandName || inputBrandName;
          const status = discoveryResult?.identityStatus || (fingerprint ? 'STRONGLY_VERIFIED' : 'UNVERIFIED');
          const confidence = discoveryResult?.overallConfidence ?? fingerprint?.confidence ?? 0;
          const profiles = discoveryResult?.officialProfiles || fingerprint?.officialProfiles || [];
          const visualId = discoveryResult?.visualIdentity || fingerprint?.visualIdentity;
          const aliases = discoveryResult?.aliases || fingerprint?.aliases || [];
          const keywords = discoveryResult?.brandKeywords || fingerprint?.knownKeywords || [];

          return (
            <div className="space-y-4">
              {!isEstablished && (
                <div className="p-4 rounded-xl bg-[#B7791F]/10 border border-[#B7791F]/30 text-[#B7791F] text-[13px] flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-[#B7791F] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Trusted identity could not be established.</div>
                    <div className="text-[#626B65] text-[12px] mt-0.5">
                      SAFENET could not establish a trusted digital identity for &quot;{brandDisplayName}&quot; from the available sources.
                      Lookalike threat scanning and impersonation scoring are disabled until a verified identity baseline exists.
                    </div>
                  </div>
                </div>
              )}

              <section className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE2DC] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
                        OFFICIAL IDENTITY BASELINE
                      </span>
                      {isEstablished ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#347653] bg-[#347653]/10 border border-[#347653]/30 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="h-3 w-3" />
                          {status.replace('_', ' ')} • {confidence}% CONFIDENCE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#B7791F] bg-[#B7791F]/10 border border-[#B7791F]/30 px-2.5 py-0.5 rounded-full">
                          <AlertOctagon className="h-3 w-3" />
                          IDENTITY STATUS: UNVERIFIED • Low ({confidence}%)
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-[#202723] mt-1">
                      {brandDisplayName}
                    </h3>
                  </div>

                  {visualId ? (
                    <div className="font-mono text-[12px] text-[#626B65] bg-[#F7F8F6] border border-[#DDE2DC] px-3.5 py-1.5 rounded-lg">
                      <span className="text-[#858D86]">Visual Identity:</span> {visualId}
                    </div>
                  ) : (
                    <div className="font-mono text-[12px] text-[#858D86] bg-[#F7F8F6] border border-[#DDE2DC] px-3.5 py-1.5 rounded-lg">
                      Visual Identity: None verified
                    </div>
                  )}
                </div>

                {/* Official Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profiles.map((prof) => (
                    <div
                      key={`${prof.platform}-${prof.username}`}
                      className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl space-y-2 text-[12px]"
                    >
                      <div className="flex items-center justify-between">
                        <PlatformBadge platform={prof.platform} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          prof.verificationStatus === 'VERIFIED'
                            ? 'bg-[#347653]/10 text-[#347653] border-[#347653]/30'
                            : prof.verificationStatus === 'LIKELY'
                            ? 'bg-[#477A60]/10 text-[#477A60] border-[#477A60]/30'
                            : prof.verificationStatus === 'POSSIBLE'
                            ? 'bg-[#3974C6]/10 text-[#3974C6] border-[#3974C6]/30'
                            : prof.verificationStatus === 'UNAVAILABLE'
                            ? 'bg-[#ECEFEC] text-[#858D86] border-[#DDE2DC]'
                            : 'bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/30'
                        }`}>
                          {prof.verificationStatus ? prof.verificationStatus.replace('_', ' ') : 'UNVERIFIED'}
                        </span>
                      </div>

                      <div className="font-bold text-[#202723] truncate">
                        {prof.username}
                      </div>

                      <div className="text-[11px] text-[#626B65] line-clamp-2">
                        {prof.verificationReason}
                      </div>

                      {prof.trustEvidence && prof.trustEvidence.length > 0 ? (
                        <div className="pt-2 border-t border-[#DDE2DC] text-[11px] space-y-1">
                          <span className="text-[#858D86] font-semibold block text-[10px] uppercase">Why SAFENET trusts this:</span>
                          {prof.trustEvidence.map((ev, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[#347653] text-[11px]">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{ev}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#DDE2DC] text-[11px] text-[#858D86]">
                          ✕ Insufficient evidence to verify ownership
                        </div>
                      )}

                      {prof.url ? (
                        <div className="pt-1.5 border-t border-[#DDE2DC]">
                          <a
                            href={prof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#477A60] hover:text-[#365F49] font-medium flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{prof.url}</span>
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Aliases & Known Keywords if established */}
                {isEstablished && (aliases.length > 0 || keywords.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DDE2DC] text-[12px] text-[#626B65]">
                    {aliases.length > 0 && (
                      <>
                        <span className="text-[#858D86] font-semibold text-[11px] uppercase">Aliases:</span>
                        {aliases.map((al) => (
                          <span key={al} className="bg-[#ECEFEC] px-2.5 py-0.5 rounded-md text-[11px] font-mono text-[#202723]">
                            {al}
                          </span>
                        ))}
                      </>
                    )}

                    {keywords.length > 0 && (
                      <>
                        <span className="text-[#858D86] font-semibold text-[11px] uppercase ml-3">Keywords:</span>
                        {keywords.map((kw) => (
                          <span key={kw} className="bg-[#ECEFEC] px-2.5 py-0.5 rounded-md text-[11px] font-mono text-[#202723]">
                            {kw}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 4. THREAT LANDSCAPE OVERVIEW                                              */}
        {/* ========================================================================= */}
        {discoveryResult && !discoveryResult.isIdentityEstablished ? (
          <div className="border border-[#DDE2DC] bg-white rounded-xl p-12 text-center space-y-3 shadow-xs">
            <ShieldAlert className="h-10 w-10 text-[#B7791F] mx-auto" />
            <div className="text-[#202723] text-base font-bold">
              Lookalike Threat Discovery Disabled
            </div>
            <div className="text-[#626B65] text-[13px] max-w-lg mx-auto leading-relaxed">
              SAFENET could not establish a trusted digital identity for &quot;{discoveryResult.brandName}&quot; from the available sources.
              To prevent false positives, lookalike mutation scans and threat scoring require an established official identity baseline.
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE2DC] pb-3">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
                    THREAT LANDSCAPE
                  </span>
                  <div className="text-lg font-bold text-[#202723] mt-0.5">
                    {totalDiscovered} candidate entities investigated
                  </div>
                </div>

                {/* Provider Connectivity Summary Bar */}
                <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
                  <span className="text-[#858D86]">Sources:</span>
                  <span className="px-2 py-0.5 rounded bg-[#ECEFEC] border border-[#DDE2DC] text-[#202723]">
                    YouTube: {providerStatuses.youtube?.status === 'connected' ? '✓ LIVE' : 'NOT CONFIGURED'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#ECEFEC] border border-[#DDE2DC] text-[#202723]">
                    X: {providerStatuses.twitter?.status === 'connected' ? '✓ ACTIVE' : 'UNAVAILABLE'}
                  </span>
                  {isDemoModeActive && (
                    <span className="px-2 py-0.5 rounded bg-[#B7791F]/10 border border-[#B7791F]/30 text-[#B7791F] font-bold">
                      DEMO BENCHMARK ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Tiles (Organic Monochrome Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-white border border-[#DDE2DC] shadow-xs">
                  <div className="text-[11px] font-mono text-[#C93643] font-bold uppercase tracking-wider">Critical Threats</div>
                  <div className="text-3xl font-bold font-mono text-[#C93643] mt-1">{criticalCount}</div>
                  <div className="text-[11px] text-[#858D86] mt-0.5">Urgent scam risks</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DDE2DC] shadow-xs">
                  <div className="text-[11px] font-mono text-[#D95F36] font-bold uppercase tracking-wider">High Risk</div>
                  <div className="text-3xl font-bold font-mono text-[#D95F36] mt-1">{highRiskCount}</div>
                  <div className="text-[11px] text-[#858D86] mt-0.5">Impersonation alerts</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DDE2DC] shadow-xs">
                  <div className="text-[11px] font-mono text-[#B7791F] font-bold uppercase tracking-wider">Suspicious</div>
                  <div className="text-3xl font-bold font-mono text-[#B7791F] mt-1">{suspiciousCount}</div>
                  <div className="text-[11px] text-[#858D86] mt-0.5">Combosquatting</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DDE2DC] shadow-xs">
                  <div className="text-[11px] font-mono text-[#3974C6] font-bold uppercase tracking-wider">Low Concern</div>
                  <div className="text-3xl font-bold font-mono text-[#3974C6] mt-1">{lowConcernCount}</div>
                  <div className="text-[11px] text-[#858D86] mt-0.5">Related community</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#DDE2DC] shadow-xs">
                  <div className="text-[11px] font-mono text-[#347653] font-bold uppercase tracking-wider">Likely Official</div>
                  <div className="text-3xl font-bold font-mono text-[#347653] mt-1">{likelyOfficialCount}</div>
                  <div className="text-[11px] text-[#858D86] mt-0.5">Verified brand channels</div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. INVESTIGATION FEED & FILTERING                                         */}
            {/* ========================================================================= */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap text-[12px] font-mono">
                  <span className="text-[#858D86] font-semibold mr-1">Filter:</span>
                  {[
                    { label: 'ALL', id: 'ALL' },
                    { label: 'HIGH RISK & CRITICAL', id: 'HIGH_RISK' },
                    { label: 'SUSPICIOUS', id: 'SUSPICIOUS' },
                    { label: 'OFFICIAL', id: 'OFFICIAL' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterTier(f.id)}
                      className={`px-3 py-1 rounded-md transition ${
                        filterTier === f.id
                          ? 'bg-[#202723] text-white font-bold'
                          : 'bg-white border border-[#DDE2DC] text-[#626B65] hover:text-[#202723]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <span className="text-[#858D86] font-semibold ml-2 mr-1">Platform:</span>
                  {['ALL', 'youtube', 'twitter', 'instagram', 'facebook', 'linkedin'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPlatform(p)}
                      className={`px-3 py-1 rounded-md transition uppercase ${
                        filterPlatform === p
                          ? 'bg-[#477A60] text-white font-bold'
                          : 'bg-white border border-[#DDE2DC] text-[#626B65] hover:text-[#202723]'
                      }`}
                    >
                      {p === 'twitter' ? 'X' : p}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#858D86] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidates by handle..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="bg-white border border-[#DDE2DC] text-[#202723] placeholder-[#858D86] text-[12px] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#477A60] w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Candidate Feed Items */}
              {filteredCandidates.length === 0 ? (
                <div className="border border-[#DDE2DC] bg-white rounded-xl p-12 text-center space-y-2 shadow-xs">
                  <ShieldCheck className="h-8 w-8 text-[#347653] mx-auto" />
                  <div className="text-[#202723] text-[14px] font-bold">
                    No high-confidence impersonation threats discovered in the sources scanned.
                  </div>
                  <div className="text-[#626B65] text-[12px]">
                    The perimeter for &quot;{activeBrand?.brandName || inputBrandName}&quot; has been checked across configured discovery adapters.
                  </div>
                </div>
              ) : (
                <div className="border border-[#DDE2DC] rounded-xl overflow-hidden bg-white divide-y divide-[#DDE2DC] shadow-xs">
                  {filteredCandidates.map((item) => {
                    const cand = item.candidate;
                    const risk = item.risk;
                    const tier = risk.threatClassification;

                    return (
                      <div
                        key={cand.id}
                        className="p-4 hover:bg-[#F7F8F6] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Left: Identity info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ThreatTierBadge tier={tier} score={risk.riskScore} />
                            <PlatformBadge platform={cand.platform} />

                            <span className="text-[14px] font-bold text-[#202723] font-mono">
                              {cand.username}
                            </span>

                            <span className="text-[13px] text-[#626B65] truncate">
                              {cand.displayName}
                            </span>

                            {cand.isDemoData && (
                              <span className="bg-[#B7791F]/10 border border-[#B7791F]/30 text-[#B7791F] text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                                DEMO DATA
                              </span>
                            )}

                            {item.status === 'watchlist' && (
                              <span className="bg-[#477A60]/10 border border-[#477A60]/30 text-[#477A60] text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                                WATCHLIST
                              </span>
                            )}
                          </div>

                          {cand.description && (
                            <p className="text-[12px] text-[#626B65] line-clamp-1">
                              {cand.description}
                            </p>
                          )}

                          {/* Signals summary */}
                          <div className="flex items-center gap-4 text-[11px] text-[#858D86] pt-0.5 flex-wrap font-mono">
                            <span>
                              Name Sim: <strong className="text-[#202723]">{risk.nameSimilarity}%</strong>
                            </span>
                            <span>
                              Username Sim: <strong className="text-[#202723]">{risk.usernameSimilarity}%</strong>
                            </span>
                            {risk.isCombosquatting && (
                              <span className="text-[#D95F36] font-semibold">
                                ⚠️ Combosquatting Detected
                              </span>
                            )}
                            {risk.domainAnalysis?.length > 0 && (
                              <span>
                                External Link:{' '}
                                <strong className="text-[#202723]">{risk.domainAnalysis[0].hostname}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Investigate Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => setInvestigatingCandidate(item)}
                            className={`px-3.5 py-1.5 rounded-lg text-[12px] transition flex items-center gap-1.5 font-bold ${
                              tier === 'LIKELY_OFFICIAL'
                                ? 'bg-[#ECEFEC] text-[#202723] hover:bg-[#DDE2DC] border border-[#DDE2DC]'
                                : 'bg-[#E7F0E9] text-[#477A60] hover:bg-[#477A60] hover:text-white border border-[#477A60]/30'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {tier === 'LIKELY_OFFICIAL' ? 'View Identity' : 'Investigate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* 6. THREAT INVESTIGATION DRAWER / MODAL                                    */}
        {/* ========================================================================= */}
        {investigatingCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202723]/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-[#DDE2DC] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#DDE2DC] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ThreatTierBadge
                      tier={investigatingCandidate.risk.threatClassification}
                      score={investigatingCandidate.risk.riskScore}
                    />
                    <PlatformBadge platform={investigatingCandidate.candidate.platform} />
                    {investigatingCandidate.candidate.isDemoData && (
                      <span className="bg-[#B7791F]/10 border border-[#B7791F]/30 text-[#B7791F] text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                        DEMO DATA
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-[#202723] pt-1 font-mono">
                    {investigatingCandidate.candidate.username}
                  </h2>
                  <div className="text-[13px] text-[#626B65]">
                    {investigatingCandidate.candidate.displayName} • Source: {investigatingCandidate.candidate.source}
                  </div>
                </div>

                <button
                  onClick={() => setInvestigatingCandidate(null)}
                  className="p-1.5 rounded-lg text-[#858D86] hover:text-[#202723] hover:bg-[#ECEFEC] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bio & Profile summary */}
              {investigatingCandidate.candidate.description && (
                <div className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl text-[13px] text-[#202723]">
                  <span className="text-[#858D86] block text-[10px] uppercase font-bold mb-0.5">Bio / Description:</span>
                  {investigatingCandidate.candidate.description}
                </div>
              )}

              {/* Identity Analysis */}
              <div className="space-y-3">
                <h3 className="text-[12px] uppercase tracking-wider text-[#858D86] font-bold font-mono">
                  1. Identity & Combosquatting Signals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                  <div className="p-3 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl">
                    <div className="text-[#858D86] text-[10px] font-mono">USERNAME SIMILARITY</div>
                    <div className="text-xl font-bold text-[#202723] mt-0.5 font-mono">
                      {investigatingCandidate.risk.usernameSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl">
                    <div className="text-[#858D86] text-[10px] font-mono">DISPLAY NAME SIMILARITY</div>
                    <div className="text-xl font-bold text-[#202723] mt-0.5 font-mono">
                      {investigatingCandidate.risk.nameSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl">
                    <div className="text-[#858D86] text-[10px] font-mono">BRANDING INTENT</div>
                    <div className="text-xl font-bold text-[#202723] mt-0.5 font-mono">
                      {investigatingCandidate.risk.brandingSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl">
                    <div className="text-[#858D86] text-[10px] font-mono">OFFICIAL STATUS</div>
                    <div className="text-[12px] font-bold text-[#202723] mt-1 uppercase font-mono">
                      {investigatingCandidate.risk.officialAccountMatch ? 'AUTHENTICATED' : 'UNAUTHORIZED'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link Intelligence */}
              <div className="space-y-3">
                <h3 className="text-[12px] uppercase tracking-wider text-[#858D86] font-bold font-mono">
                  2. Link Intelligence (SAFENET Domain Engine)
                </h3>
                {investigatingCandidate.candidate.externalUrls.length === 0 ? (
                  <div className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl text-[#858D86] text-[12px]">
                    No external URLs linked in this profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {investigatingCandidate.risk.domainAnalysis.map((dom, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl space-y-1.5 text-[12px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#202723] font-mono">{dom.hostname}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                              dom.isOfficialDomain
                                ? 'bg-[#347653]/10 text-[#347653] border border-[#347653]/30'
                                : 'bg-[#C93643]/10 text-[#C93643] border border-[#C93643]/30'
                            }`}
                          >
                            {dom.isOfficialDomain ? 'OFFICIAL DOMAIN' : 'UNAUTHORIZED DOMAIN'}
                          </span>
                        </div>
                        <div className="text-[#626B65] text-[11px] break-all">{dom.url}</div>
                        {dom.details.length > 0 && (
                          <div className="text-[#858D86] text-[11px] pt-1.5 border-t border-[#DDE2DC]">
                            {dom.details.join(' • ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Attribution */}
              <div className="space-y-3">
                <h3 className="text-[12px] uppercase tracking-wider text-[#858D86] font-bold font-mono">
                  3. Structured Risk Evidence Attribution
                </h3>
                <div className="space-y-2">
                  {(investigatingCandidate.risk.structuredEvidence || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl text-[12px] flex items-start gap-3"
                    >
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 mt-0.5 ${
                          ev.severity === 'CRITICAL'
                            ? 'bg-[#C93643]/10 text-[#C93643] border border-[#C93643]/30'
                            : ev.severity === 'HIGH'
                            ? 'bg-[#D95F36]/10 text-[#D95F36] border border-[#D95F36]/30'
                            : ev.severity === 'MEDIUM'
                            ? 'bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/30'
                            : 'bg-[#ECEFEC] text-[#626B65] border border-[#DDE2DC]'
                        }`}
                      >
                        {ev.severity}
                      </span>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#202723]">{ev.signal}</span>
                          <span className="text-[10px] text-[#858D86] font-mono">{ev.source}</span>
                        </div>
                        <div className="text-[#626B65] text-[11px]">{ev.explanation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#DDE2DC] flex-wrap gap-3">
                <a
                  href={investigatingCandidate.candidate.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-[13px] bg-white border border-[#DDE2DC] hover:bg-[#ECEFEC] text-[#202723] transition flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Profile
                </a>

                <div className="flex items-center gap-2">
                  {investigatingCandidate.status === 'watchlist' ? (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'new')
                      }
                      className="px-4 py-2 rounded-lg text-[13px] bg-[#ECEFEC] text-[#202723] hover:bg-[#DDE2DC] transition flex items-center gap-1.5 font-medium"
                    >
                      <BookmarkCheck className="h-4 w-4 text-[#477A60]" />
                      Remove from Watchlist
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'watchlist')
                      }
                      className="px-4 py-2 rounded-lg text-[13px] bg-white border border-[#DDE2DC] hover:bg-[#ECEFEC] text-[#202723] transition flex items-center gap-1.5 font-medium"
                    >
                      <Bookmark className="h-4 w-4 text-[#858D86]" />
                      Add to Watchlist
                    </button>
                  )}

                  {investigatingCandidate.status === 'reviewed' ? (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'new')
                      }
                      className="px-4 py-2 rounded-lg text-[13px] bg-[#E7F0E9] text-[#477A60] border border-[#477A60]/30 hover:bg-[#477A60] hover:text-white transition flex items-center gap-1.5 font-bold"
                    >
                      <Check className="h-4 w-4" />
                      Reviewed
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'reviewed')
                      }
                      className="px-4 py-2 rounded-lg text-[13px] bg-[#477A60] hover:bg-[#365F49] text-white transition flex items-center gap-1.5 font-bold shadow-xs"
                    >
                      <Check className="h-4 w-4" />
                      Mark as Reviewed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
