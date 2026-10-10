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
        <span className="font-mono text-[21px] font-bold font-bold text-[#FF5C6C] font-bold bg-[#2D1216] px-2 py-0.5 rounded border border-[#FF5C6C]/40">
          YOUTUBE
        </span>
      );
    case 'twitter':
      return (
        <span className="font-mono text-[21px] font-bold font-bold text-[#64A9FF] font-bold bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#64A9FF]/40">
          X / TWITTER
        </span>
      );
    case 'instagram':
      return (
        <span className="font-mono text-[21px] font-bold font-bold text-[#E1306C] bg-[#E1306C]/10 px-2 py-0.5 rounded border border-[#E1306C]/20">
          INSTAGRAM
        </span>
      );
    case 'facebook':
      return (
        <span className="font-mono text-[21px] font-bold font-bold text-[#1877F2] bg-[#1877F2]/10 px-2 py-0.5 rounded border border-[#1877F2]/20">
          FACEBOOK
        </span>
      );
    case 'linkedin':
      return (
        <span className="font-mono text-[21px] font-bold font-bold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded border border-[#0A66C2]/20">
          LINKEDIN
        </span>
      );
    case 'website':
      return (
        <span className="font-mono text-[21px] font-bold font-bold text-[#F6821F] font-bold bg-[#0F2620] px-2 py-0.5 rounded border border-[#F6821F]/40">
          OFFICIAL WEB
        </span>
      );
    default:
      return (
        <span className="font-mono text-[21px] font-bold font-semibold text-[#9CA3AF] font-bold bg-[#161D2F] px-2 py-0.5 rounded border border-[#1E2638]">
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
        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#F6821F] font-bold bg-[#347653]/10 border border-[#F6821F]/40 px-2 py-0.5 rounded">
          <ShieldCheck className="h-3 w-3" />
          LIKELY OFFICIAL ({score}/100)
        </span>
      );
    case 'LOW_CONCERN':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#64A9FF] font-bold bg-[#0D1B2A] border border-[#64A9FF]/40 px-2 py-0.5 rounded">
          <Shield className="h-3 w-3" />
          RELATED / LOW CONCERN ({score}/100)
        </span>
      );
    case 'SUSPICIOUS':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#FFAB40] font-bold bg-[#2C1C0D] border border-[#FFAB40]/40 px-2 py-0.5 rounded">
          <AlertTriangle className="h-3 w-3" />
          SUSPICIOUS ({score}/100)
        </span>
      );
    case 'HIGH_RISK':
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#FFAB40] font-bold bg-[#2C1C0D] border border-[#FFAB40]/40 px-2 py-0.5 rounded">
          <AlertOctagon className="h-3 w-3" />
          POTENTIAL IMPERSONATION ({score}/100)
        </span>
      );
    case 'CRITICAL_THREAT':
    default:
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#FF5C6C] font-bold bg-[#2D1216] border border-[#FF5C6C]/40 px-2 py-0.5 rounded">
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
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[28px] font-bold font-bold uppercase tracking-wider text-[#F6821F] font-bold">
                BRAND PERIMETER PROTECTION
              </span>
              <p className="text-[24px] font-bold text-[#9CA3AF] font-bold mt-0.5">
                Discover canonical enterprise identities, map official channels, and surface impersonation campaigns.
              </p>
            </div>

            {/* Quick Switcher of previously investigated brands */}
            {brands.length > 0 && (
              <div className="flex items-center gap-2 text-[17px] font-bold font-mono">
                <span className="text-[#9CA3AF] font-bold">History:</span>
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
                      className={`px-2.5 py-1 rounded-md text-[28px] font-bold font-bold font-semibold transition ${
                        activeBrand?.id === b.id
                          ? 'bg-[#0F2620] text-[#F6821F] font-bold border border-[#F6821F]/40'
                          : 'bg-[#161D2F] text-[#9CA3AF] font-bold hover:text-[#FFFFFF] font-bold hover:bg-[#161D2F]'
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
                <Search className="h-4 w-4 text-[#9CA3AF] font-bold absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter brand name (e.g. Nike, Paytm, HDFC Bank, PayPal)..."
                  value={inputBrandName}
                  onChange={(e) => setInputBrandName(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] text-[19px] font-bold rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F6821F]/40 focus:ring-1 focus:ring-[#477A60] transition"
                />
              </div>

              <button
                type="submit"
                disabled={isInvestigating || !inputBrandName.trim()}
                className={`px-6 py-3 rounded-xl text-[24px] font-bold font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                  isInvestigating
                    ? 'bg-[#0F2620] text-[#F6821F] font-bold border border-[#F6821F]/40 cursor-not-allowed'
                    : 'bg-[#F6821F] text-[#080B11] font-extrabold hover:bg-[#2EB8A5] text-white shadow-xs'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${isInvestigating ? 'animate-spin' : ''}`} />
                {isInvestigating ? 'Investigating...' : 'Investigate Brand'}
              </button>
            </div>

            {/* Optional manual fields toggle */}
            <div className="flex items-center justify-between text-[17px] font-bold text-[#9CA3AF] font-bold">
              <button
                type="button"
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="hover:text-[#FFFFFF] font-bold flex items-center gap-1 font-medium transition"
              >
                <ChevronDown className={`h-3.5 w-3.5 transform ${showAdvancedInputs ? 'rotate-180' : ''}`} />
                {showAdvancedInputs ? 'Hide optional official URLs' : 'Optional: Specify official website or handles manually'}
              </button>

              {activeBrand && lastScanRecord && (
                <div className="flex items-center gap-1.5 text-[#9CA3AF] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Last scanned: {new Date(lastScanRecord.completedAt || lastScanRecord.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {showAdvancedInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#111625] border border-[#1E2638] rounded-xl text-[17px] font-bold">
                <div>
                  <label className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold font-semibold block mb-1">Official Website (optional)</label>
                  <input
                    type="text"
                    placeholder="https://nike.com"
                    value={optionalWebsite}
                    onChange={(e) => setOptionalWebsite(e.target.value)}
                    className="w-full bg-[#0E131F] border border-[#1E2638] rounded-lg px-3 py-2 text-[#FFFFFF] font-bold text-[24px] font-bold focus:outline-none focus:border-[#F6821F]/40"
                  />
                </div>
                <div>
                  <label className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold font-semibold block mb-1">X (Twitter) Handle (optional)</label>
                  <input
                    type="text"
                    placeholder="@Nike"
                    value={optionalTwitter}
                    onChange={(e) => setOptionalTwitter(e.target.value)}
                    className="w-full bg-[#0E131F] border border-[#1E2638] rounded-lg px-3 py-2 text-[#FFFFFF] font-bold text-[24px] font-bold focus:outline-none focus:border-[#F6821F]/40"
                  />
                </div>
                <div>
                  <label className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold font-semibold block mb-1">Instagram Handle (optional)</label>
                  <input
                    type="text"
                    placeholder="@nike"
                    value={optionalInstagram}
                    onChange={(e) => setOptionalInstagram(e.target.value)}
                    className="w-full bg-[#0E131F] border border-[#1E2638] rounded-lg px-3 py-2 text-[#FFFFFF] font-bold text-[24px] font-bold focus:outline-none focus:border-[#F6821F]/40"
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
          <section className="bg-[#0E131F] border border-[#F6821F]/40 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
              <div className="flex items-center gap-2 text-[#F6821F] font-bold font-mono text-[24px] font-bold font-bold">
                <RefreshCw className="h-4 w-4 animate-spin" />
                DIGITAL RISK INVESTIGATION RUNNING FOR &quot;{inputBrandName.toUpperCase()}&quot;
              </div>
              <span className="font-mono text-[28px] font-bold font-bold text-[#9CA3AF] font-bold">
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
                    className={`flex items-start gap-3 p-3 rounded-lg text-[17px] font-bold border ${
                      isCurrent
                        ? 'bg-[#0F2620] border-[#F6821F]/40 text-[#F6821F] font-bold'
                        : isPast
                        ? 'bg-[#111625] border-[#1E2638] text-[#F6821F] font-bold'
                        : 'bg-[#0E131F] border-[#1E2638] text-[#9CA3AF] font-bold'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <CheckCircle2 className="h-4 w-4 text-[#F6821F] font-bold" />
                      ) : isCurrent ? (
                        <RefreshCw className="h-4 w-4 text-[#F6821F] font-bold animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-[#1E2638]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold font-mono">{stage.title}</div>
                      <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">{stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {scanError && (
          <div className="p-4 rounded-xl bg-[#2D1216] border border-[#FF5C6C]/40 text-[#FF5C6C] font-bold text-[24px] font-bold flex items-center gap-2 font-medium">
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
                <div className="p-4 rounded-xl bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] font-bold text-[24px] font-bold flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-[#FFAB40] font-bold shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Trusted identity could not be established.</div>
                    <div className="text-[#9CA3AF] font-bold text-[17px] font-bold mt-0.5">
                      SAFENET could not establish a trusted digital identity for &quot;{brandDisplayName}&quot; from the available sources.
                      Lookalike threat scanning and impersonation scoring are disabled until a verified identity baseline exists.
                    </div>
                  </div>
                </div>
              )}

              <section className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[28px] font-bold font-bold uppercase tracking-wider text-[#9CA3AF] font-bold">
                        OFFICIAL IDENTITY BASELINE
                      </span>
                      {isEstablished ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#F6821F] font-bold bg-[#347653]/10 border border-[#F6821F]/40 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="h-3 w-3" />
                          {status.replace('_', ' ')} • {confidence}% CONFIDENCE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[28px] font-bold font-bold text-[#FFAB40] font-bold bg-[#2C1C0D] border border-[#FFAB40]/40 px-2.5 py-0.5 rounded-full">
                          <AlertOctagon className="h-3 w-3" />
                          IDENTITY STATUS: UNVERIFIED • Low ({confidence}%)
                        </span>
                      )}
                    </div>
                    <h3 className="text-[30px] font-extrabold font-bold text-[#FFFFFF] font-bold mt-1">
                      {brandDisplayName}
                    </h3>
                  </div>

                  {visualId ? (
                    <div className="font-mono text-[17px] font-bold text-[#9CA3AF] font-bold bg-[#111625] border border-[#1E2638] px-3.5 py-1.5 rounded-lg">
                      <span className="text-[#9CA3AF] font-bold">Visual Identity:</span> {visualId}
                    </div>
                  ) : (
                    <div className="font-mono text-[17px] font-bold text-[#9CA3AF] font-bold bg-[#111625] border border-[#1E2638] px-3.5 py-1.5 rounded-lg">
                      Visual Identity: None verified
                    </div>
                  )}
                </div>

                {/* Official Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profiles.map((prof) => (
                    <div
                      key={`${prof.platform}-${prof.username}`}
                      className="p-3.5 bg-[#111625] border border-[#1E2638] rounded-xl space-y-2 text-[17px] font-bold"
                    >
                      <div className="flex items-center justify-between">
                        <PlatformBadge platform={prof.platform} />
                        <span className={`text-[21px] font-bold font-bold px-2 py-0.5 rounded uppercase border ${
                          prof.verificationStatus === 'VERIFIED'
                            ? 'bg-[#347653]/10 text-[#F6821F] font-bold border-[#F6821F]/40'
                            : prof.verificationStatus === 'LIKELY'
                            ? 'bg-[#F6821F] text-[#080B11] font-extrabold/10 text-[#F6821F] font-bold border-[#F6821F]/40'
                            : prof.verificationStatus === 'POSSIBLE'
                            ? 'bg-[#0D1B2A] text-[#64A9FF] font-bold border-[#64A9FF]/40'
                            : prof.verificationStatus === 'UNAVAILABLE'
                            ? 'bg-[#161D2F] text-[#9CA3AF] font-bold border-[#1E2638]'
                            : 'bg-[#2C1C0D] text-[#FFAB40] font-bold border-[#FFAB40]/40'
                        }`}>
                          {prof.verificationStatus ? prof.verificationStatus.replace('_', ' ') : 'UNVERIFIED'}
                        </span>
                      </div>

                      <div className="font-bold text-[#FFFFFF] font-bold truncate">
                        {prof.username}
                      </div>

                      <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold line-clamp-2">
                        {prof.verificationReason}
                      </div>

                      {prof.trustEvidence && prof.trustEvidence.length > 0 ? (
                        <div className="pt-2 border-t border-[#1E2638] text-[28px] font-bold font-bold space-y-1">
                          <span className="text-[#9CA3AF] font-bold font-semibold block text-[21px] font-bold uppercase">Why SAFENET trusts this:</span>
                          {prof.trustEvidence.map((ev, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[#F6821F] font-bold text-[28px] font-bold font-bold">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{ev}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#1E2638] text-[28px] font-bold font-bold text-[#9CA3AF] font-bold">
                          ✕ Insufficient evidence to verify ownership
                        </div>
                      )}

                      {prof.url ? (
                        <div className="pt-1.5 border-t border-[#1E2638]">
                          <a
                            href={prof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[28px] font-bold font-bold text-[#F6821F] font-bold hover:text-[#365F49] font-medium flex items-center gap-1 truncate"
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
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#1E2638] text-[17px] font-bold text-[#9CA3AF] font-bold">
                    {aliases.length > 0 && (
                      <>
                        <span className="text-[#9CA3AF] font-bold font-semibold text-[28px] font-bold font-bold uppercase">Aliases:</span>
                        {aliases.map((al) => (
                          <span key={al} className="bg-[#161D2F] px-2.5 py-0.5 rounded-md text-[28px] font-bold font-bold font-mono text-[#FFFFFF] font-bold">
                            {al}
                          </span>
                        ))}
                      </>
                    )}

                    {keywords.length > 0 && (
                      <>
                        <span className="text-[#9CA3AF] font-bold font-semibold text-[28px] font-bold font-bold uppercase ml-3">Keywords:</span>
                        {keywords.map((kw) => (
                          <span key={kw} className="bg-[#161D2F] px-2.5 py-0.5 rounded-md text-[28px] font-bold font-bold font-mono text-[#FFFFFF] font-bold">
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
          <div className="border border-[#1E2638] bg-[#0E131F] rounded-xl p-12 text-center space-y-3 shadow-xs">
            <ShieldAlert className="h-10 w-10 text-[#FFAB40] font-bold mx-auto" />
            <div className="text-[#FFFFFF] font-bold text-[21px] font-bold">
              Lookalike Threat Discovery Disabled
            </div>
            <div className="text-[#9CA3AF] font-bold text-[24px] font-bold max-w-lg mx-auto leading-relaxed">
              SAFENET could not establish a trusted digital identity for &quot;{discoveryResult.brandName}&quot; from the available sources.
              To prevent false positives, lookalike mutation scans and threat scoring require an established official identity baseline.
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-3">
                <div>
                  <span className="font-mono text-[28px] font-bold font-bold uppercase tracking-wider text-[#9CA3AF] font-bold">
                    THREAT LANDSCAPE
                  </span>
                  <div className="text-[24px] font-bold text-[#FFFFFF] font-bold mt-0.5">
                    {totalDiscovered} candidate entities investigated
                  </div>
                </div>

                {/* Provider Connectivity Summary Bar */}
                <div className="flex items-center gap-2 text-[28px] font-bold font-bold font-mono flex-wrap">
                  <span className="text-[#9CA3AF] font-bold">Sources:</span>
                  <span className="px-2 py-0.5 rounded bg-[#161D2F] border border-[#1E2638] text-[#FFFFFF] font-bold">
                    YouTube: {providerStatuses.youtube?.status === 'connected' ? '✓ LIVE' : 'NOT CONFIGURED'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#161D2F] border border-[#1E2638] text-[#FFFFFF] font-bold">
                    X: {providerStatuses.twitter?.status === 'connected' ? '✓ ACTIVE' : 'UNAVAILABLE'}
                  </span>
                  {isDemoModeActive && (
                    <span className="px-2 py-0.5 rounded bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] font-bold">
                      DEMO BENCHMARK ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Tiles (Organic Monochrome Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1E2638] shadow-xs">
                  <div className="text-[28px] font-bold font-bold font-mono text-[#FF5C6C] font-bold uppercase tracking-wider">Critical Threats</div>
                  <div className="text-[36px] font-extrabold font-bold font-mono text-[#FF5C6C] font-bold mt-1">{criticalCount}</div>
                  <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">Urgent scam risks</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1E2638] shadow-xs">
                  <div className="text-[28px] font-bold font-bold font-mono text-[#FFAB40] font-bold uppercase tracking-wider">High Risk</div>
                  <div className="text-[36px] font-extrabold font-bold font-mono text-[#FFAB40] font-bold mt-1">{highRiskCount}</div>
                  <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">Impersonation alerts</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1E2638] shadow-xs">
                  <div className="text-[28px] font-bold font-bold font-mono text-[#FFAB40] font-bold uppercase tracking-wider">Suspicious</div>
                  <div className="text-[36px] font-extrabold font-bold font-mono text-[#FFAB40] font-bold mt-1">{suspiciousCount}</div>
                  <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">Combosquatting</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1E2638] shadow-xs">
                  <div className="text-[28px] font-bold font-bold font-mono text-[#64A9FF] font-bold uppercase tracking-wider">Low Concern</div>
                  <div className="text-[36px] font-extrabold font-bold font-mono text-[#64A9FF] font-bold mt-1">{lowConcernCount}</div>
                  <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">Related community</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1E2638] shadow-xs">
                  <div className="text-[28px] font-bold font-bold font-mono text-[#F6821F] font-bold uppercase tracking-wider">Likely Official</div>
                  <div className="text-[36px] font-extrabold font-bold font-mono text-[#F6821F] font-bold mt-1">{likelyOfficialCount}</div>
                  <div className="text-[28px] font-bold font-bold text-[#9CA3AF] font-bold mt-0.5">Verified brand channels</div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. INVESTIGATION FEED & FILTERING                                         */}
            {/* ========================================================================= */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap text-[17px] font-bold font-mono">
                  <span className="text-[#9CA3AF] font-bold font-semibold mr-1">Filter:</span>
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
                          ? 'bg-[#111625] text-white font-bold'
                          : 'bg-[#0E131F] border border-[#1E2638] text-[#9CA3AF] font-bold hover:text-[#FFFFFF] font-bold'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <span className="text-[#9CA3AF] font-bold font-semibold ml-2 mr-1">Platform:</span>
                  {['ALL', 'youtube', 'twitter', 'instagram', 'facebook', 'linkedin'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPlatform(p)}
                      className={`px-3 py-1 rounded-md transition uppercase ${
                        filterPlatform === p
                          ? 'bg-[#F6821F] text-[#080B11] font-extrabold text-white font-bold'
                          : 'bg-[#0E131F] border border-[#1E2638] text-[#9CA3AF] font-bold hover:text-[#FFFFFF] font-bold'
                      }`}
                    >
                      {p === 'twitter' ? 'X' : p}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#9CA3AF] font-bold absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidates by handle..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="bg-[#0E131F] border border-[#1E2638] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] text-[17px] font-bold rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#F6821F]/40 w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Candidate Feed Items */}
              {filteredCandidates.length === 0 ? (
                <div className="border border-[#1E2638] bg-[#0E131F] rounded-xl p-12 text-center space-y-2 shadow-xs">
                  <ShieldCheck className="h-8 w-8 text-[#F6821F] font-bold mx-auto" />
                  <div className="text-[#FFFFFF] font-bold text-[19px] font-bold">
                    No high-confidence impersonation threats discovered in the sources scanned.
                  </div>
                  <div className="text-[#9CA3AF] font-bold text-[17px] font-bold">
                    The perimeter for &quot;{activeBrand?.brandName || inputBrandName}&quot; has been checked across configured discovery adapters.
                  </div>
                </div>
              ) : (
                <div className="border border-[#1E2638] rounded-xl overflow-hidden bg-[#0E131F] divide-y divide-[#1E2638] shadow-xs">
                  {filteredCandidates.map((item) => {
                    const cand = item.candidate;
                    const risk = item.risk;
                    const tier = risk.threatClassification;

                    return (
                      <div
                        key={cand.id}
                        className="p-4 hover:bg-[#111625] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Left: Identity info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ThreatTierBadge tier={tier} score={risk.riskScore} />
                            <PlatformBadge platform={cand.platform} />

                            <span className="text-[19px] font-bold text-[#FFFFFF] font-bold font-mono">
                              {cand.username}
                            </span>

                            <span className="text-[24px] font-bold text-[#9CA3AF] font-bold truncate">
                              {cand.displayName}
                            </span>

                            {cand.isDemoData && (
                              <span className="bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] font-bold text-[21px] font-bold px-1.5 py-0.5 rounded font-bold font-mono">
                                DEMO DATA
                              </span>
                            )}

                            {item.status === 'watchlist' && (
                              <span className="bg-[#F6821F] text-[#080B11] font-extrabold/10 border border-[#F6821F]/40 text-[#F6821F] font-bold text-[21px] font-bold px-1.5 py-0.5 rounded font-bold font-mono">
                                WATCHLIST
                              </span>
                            )}
                          </div>

                          {cand.description && (
                            <p className="text-[17px] font-bold text-[#9CA3AF] font-bold line-clamp-1">
                              {cand.description}
                            </p>
                          )}

                          {/* Signals summary */}
                          <div className="flex items-center gap-4 text-[28px] font-bold font-bold text-[#9CA3AF] font-bold pt-0.5 flex-wrap font-mono">
                            <span>
                              Name Sim: <strong className="text-[#FFFFFF] font-bold">{risk.nameSimilarity}%</strong>
                            </span>
                            <span>
                              Username Sim: <strong className="text-[#FFFFFF] font-bold">{risk.usernameSimilarity}%</strong>
                            </span>
                            {risk.isCombosquatting && (
                              <span className="text-[#FFAB40] font-bold font-semibold">
                                ⚠️ Combosquatting Detected
                              </span>
                            )}
                            {risk.domainAnalysis?.length > 0 && (
                              <span>
                                External Link:{' '}
                                <strong className="text-[#FFFFFF] font-bold">{risk.domainAnalysis[0].hostname}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Investigate Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => setInvestigatingCandidate(item)}
                            className={`px-3.5 py-1.5 rounded-lg text-[17px] font-bold transition flex items-center gap-1.5 font-bold ${
                              tier === 'LIKELY_OFFICIAL'
                                ? 'bg-[#161D2F] text-[#FFFFFF] font-bold hover:bg-[#161D2F] border border-[#1E2638]'
                                : 'bg-[#0F2620] text-[#F6821F] font-bold hover:bg-[#F6821F] text-[#080B11] font-extrabold hover:text-white border border-[#F6821F]/40'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B11]/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ThreatTierBadge
                      tier={investigatingCandidate.risk.threatClassification}
                      score={investigatingCandidate.risk.riskScore}
                    />
                    <PlatformBadge platform={investigatingCandidate.candidate.platform} />
                    {investigatingCandidate.candidate.isDemoData && (
                      <span className="bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] font-bold text-[21px] font-bold px-1.5 py-0.5 rounded font-bold font-mono">
                        DEMO DATA
                      </span>
                    )}
                  </div>

                  <h2 className="text-[30px] font-extrabold font-bold text-[#FFFFFF] font-bold pt-1 font-mono">
                    {investigatingCandidate.candidate.username}
                  </h2>
                  <div className="text-[24px] font-bold text-[#9CA3AF] font-bold">
                    {investigatingCandidate.candidate.displayName} • Source: {investigatingCandidate.candidate.source}
                  </div>
                </div>

                <button
                  onClick={() => setInvestigatingCandidate(null)}
                  className="p-1.5 rounded-lg text-[#9CA3AF] font-bold hover:text-[#FFFFFF] font-bold hover:bg-[#161D2F] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bio & Profile summary */}
              {investigatingCandidate.candidate.description && (
                <div className="p-3.5 bg-[#111625] border border-[#1E2638] rounded-xl text-[24px] font-bold text-[#FFFFFF] font-bold">
                  <span className="text-[#9CA3AF] font-bold block text-[21px] font-bold uppercase font-bold mb-0.5">Bio / Description:</span>
                  {investigatingCandidate.candidate.description}
                </div>
              )}

              {/* Identity Analysis */}
              <div className="space-y-3">
                <h3 className="text-[17px] font-bold uppercase tracking-wider text-[#9CA3AF] font-bold font-mono">
                  1. Identity & Combosquatting Signals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[17px] font-bold">
                  <div className="p-3 bg-[#111625] border border-[#1E2638] rounded-xl">
                    <div className="text-[#9CA3AF] font-bold text-[21px] font-bold font-mono">USERNAME SIMILARITY</div>
                    <div className="text-xl font-bold text-[#FFFFFF] font-bold mt-0.5 font-mono">
                      {investigatingCandidate.risk.usernameSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#111625] border border-[#1E2638] rounded-xl">
                    <div className="text-[#9CA3AF] font-bold text-[21px] font-bold font-mono">DISPLAY NAME SIMILARITY</div>
                    <div className="text-xl font-bold text-[#FFFFFF] font-bold mt-0.5 font-mono">
                      {investigatingCandidate.risk.nameSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#111625] border border-[#1E2638] rounded-xl">
                    <div className="text-[#9CA3AF] font-bold text-[21px] font-bold font-mono">BRANDING INTENT</div>
                    <div className="text-xl font-bold text-[#FFFFFF] font-bold mt-0.5 font-mono">
                      {investigatingCandidate.risk.brandingSimilarity}%
                    </div>
                  </div>
                  <div className="p-3 bg-[#111625] border border-[#1E2638] rounded-xl">
                    <div className="text-[#9CA3AF] font-bold text-[21px] font-bold font-mono">OFFICIAL STATUS</div>
                    <div className="text-[17px] font-bold text-[#FFFFFF] font-bold mt-1 uppercase font-mono">
                      {investigatingCandidate.risk.officialAccountMatch ? 'AUTHENTICATED' : 'UNAUTHORIZED'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link Intelligence */}
              <div className="space-y-3">
                <h3 className="text-[17px] font-bold uppercase tracking-wider text-[#9CA3AF] font-bold font-mono">
                  2. Link Intelligence (SAFENET Domain Engine)
                </h3>
                {investigatingCandidate.candidate.externalUrls.length === 0 ? (
                  <div className="p-3.5 bg-[#111625] border border-[#1E2638] rounded-xl text-[#9CA3AF] font-bold text-[17px] font-bold">
                    No external URLs linked in this profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {investigatingCandidate.risk.domainAnalysis.map((dom, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-[#111625] border border-[#1E2638] rounded-xl space-y-1.5 text-[17px] font-bold"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFFFFF] font-bold font-mono">{dom.hostname}</span>
                          <span
                            className={`text-[21px] font-bold px-2 py-0.5 rounded font-bold font-mono ${
                              dom.isOfficialDomain
                                ? 'bg-[#347653]/10 text-[#F6821F] font-bold border border-[#F6821F]/40'
                                : 'bg-[#2D1216] text-[#FF5C6C] font-bold border border-[#FF5C6C]/40'
                            }`}
                          >
                            {dom.isOfficialDomain ? 'OFFICIAL DOMAIN' : 'UNAUTHORIZED DOMAIN'}
                          </span>
                        </div>
                        <div className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold break-all">{dom.url}</div>
                        {dom.details.length > 0 && (
                          <div className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold pt-1.5 border-t border-[#1E2638]">
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
                <h3 className="text-[17px] font-bold uppercase tracking-wider text-[#9CA3AF] font-bold font-mono">
                  3. Structured Risk Evidence Attribution
                </h3>
                <div className="space-y-2">
                  {(investigatingCandidate.risk.structuredEvidence || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#111625] border border-[#1E2638] rounded-xl text-[17px] font-bold flex items-start gap-3"
                    >
                      <span
                        className={`text-[21px] font-bold font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 mt-0.5 ${
                          ev.severity === 'CRITICAL'
                            ? 'bg-[#2D1216] text-[#FF5C6C] font-bold border border-[#FF5C6C]/40'
                            : ev.severity === 'HIGH'
                            ? 'bg-[#2C1C0D] text-[#FFAB40] font-bold border border-[#FFAB40]/40'
                            : ev.severity === 'MEDIUM'
                            ? 'bg-[#2C1C0D] text-[#FFAB40] font-bold border border-[#FFAB40]/40'
                            : 'bg-[#161D2F] text-[#9CA3AF] font-bold border border-[#1E2638]'
                        }`}
                      >
                        {ev.severity}
                      </span>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#FFFFFF] font-bold">{ev.signal}</span>
                          <span className="text-[21px] font-bold text-[#9CA3AF] font-bold font-mono">{ev.source}</span>
                        </div>
                        <div className="text-[#9CA3AF] font-bold text-[28px] font-bold font-bold">{ev.explanation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1E2638] flex-wrap gap-3">
                <a
                  href={investigatingCandidate.candidate.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-[24px] font-bold bg-[#0E131F] border border-[#1E2638] hover:bg-[#161D2F] text-[#FFFFFF] font-bold transition flex items-center gap-1.5 font-medium"
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
                      className="px-4 py-2 rounded-lg text-[24px] font-bold bg-[#161D2F] text-[#FFFFFF] font-bold hover:bg-[#161D2F] transition flex items-center gap-1.5 font-medium"
                    >
                      <BookmarkCheck className="h-4 w-4 text-[#F6821F] font-bold" />
                      Remove from Watchlist
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'watchlist')
                      }
                      className="px-4 py-2 rounded-lg text-[24px] font-bold bg-[#0E131F] border border-[#1E2638] hover:bg-[#161D2F] text-[#FFFFFF] font-bold transition flex items-center gap-1.5 font-medium"
                    >
                      <Bookmark className="h-4 w-4 text-[#9CA3AF] font-bold" />
                      Add to Watchlist
                    </button>
                  )}

                  {investigatingCandidate.status === 'reviewed' ? (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'new')
                      }
                      className="px-4 py-2 rounded-lg text-[24px] font-bold bg-[#0F2620] text-[#F6821F] font-bold border border-[#F6821F]/40 hover:bg-[#F6821F] text-[#080B11] font-extrabold hover:text-white transition flex items-center gap-1.5 font-bold"
                    >
                      <Check className="h-4 w-4" />
                      Reviewed
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateStatus(investigatingCandidate.candidate.id, 'reviewed')
                      }
                      className="px-4 py-2 rounded-lg text-[24px] font-bold bg-[#F6821F] text-[#080B11] font-extrabold hover:bg-[#2EB8A5] text-white transition flex items-center gap-1.5 font-bold shadow-xs"
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
