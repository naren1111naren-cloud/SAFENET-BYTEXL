'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  Check,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Globe,
  Share2,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Layers,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, DiscoveredBrandIdentity, DiscoveredSocialProfile, DiscoveredApplication } from '@/types/brand';

type InvestigationState = 'IDLE' | 'INVESTIGATING' | 'DISCOVERING' | 'ANALYZING' | 'COMPLETED' | 'NO_RESULTS' | 'ERROR';
type BrandAnalysisState =
  | 'IDLE'
  | 'VALIDATING'
  | 'FETCHING_WEBSITE'
  | 'EXTRACTING_IDENTITY'
  | 'READY_FOR_REVIEW'
  | 'CONFIRMED'
  | 'ERROR';

export default function SetupPage() {
  const router = useRouter();
  const [brandName, setBrandName] = useState('Paytm');
  const [domain, setDomain] = useState('paytm.com');
  const [officialDomains, setOfficialDomains] = useState('paytm.com, paytmbank.com, paytmmoney.com');
  const [twitter, setTwitter] = useState('@Paytm');
  const [instagram, setInstagram] = useState('@paytm');
  const [telegram, setTelegram] = useState('@paytmofficial');
  const [appPackage, setAppPackage] = useState('net.one97.paytm');
  const [officialDevelopers, setOfficialDevelopers] = useState('One97 Communications Limited, Paytm');
  const [keywords, setKeywords] = useState('Paytm, Paytm Karo, Paytm Wallet, Paytm Payments Bank');
  const [supportChannels, setSupportChannels] = useState('https://paytm.com/care, care@paytm.com');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  // Real-Time Brand Profile Intelligence State
  const [analysisState, setAnalysisState] = useState<BrandAnalysisState>('IDLE');
  const [analysisError, setAnalysisError] = useState<string>('');
  const [discoveredIdentity, setDiscoveredIdentity] = useState<DiscoveredBrandIdentity | null>(null);
  const [selectedSocials, setSelectedSocials] = useState<Record<string, boolean>>({});
  const [selectedApps, setSelectedApps] = useState<Record<string, boolean>>({});

  // Investigation Execution State
  const [investigationState, setInvestigationState] = useState<InvestigationState>('IDLE');
  const [investigationStatusMessage, setInvestigationStatusMessage] = useState<string>('');
  const [investigationSummary, setInvestigationSummary] = useState<any | null>(null);

  useEffect(() => {
    const existing = BrandStore.getBrand();
    if (existing) {
      setBrandName(existing.name);
      setDomain(existing.domain);
      setOfficialDomains(existing.officialDomains?.join(', ') || existing.domain);
      setTwitter(existing.handles?.twitter || '');
      setInstagram(existing.handles?.instagram || '');
      setTelegram(existing.handles?.telegram || '');
      setAppPackage(existing.appPackageName || '');
      setOfficialDevelopers(existing.officialDevelopers?.join(', ') || existing.name);
      setKeywords(existing.brandKeywords?.join(', ') || '');
      setSupportChannels(existing.officialSupportChannels?.join(', ') || '');
      setLogoUrl(existing.logoUrl);
    }
  }, []);

  const handleLoadPreset = (name: 'Nike' | 'Paytm') => {
    const p = PRESET_BRANDS[name];
    if (p) {
      setBrandName(p.name);
      setDomain(p.domain);
      setOfficialDomains(p.officialDomains?.join(', ') || p.domain);
      setTwitter(p.handles?.twitter || '');
      setInstagram(p.handles?.instagram || '');
      setTelegram(p.handles?.telegram || '');
      setAppPackage(p.appPackageName || '');
      setOfficialDevelopers(p.officialDevelopers?.join(', ') || p.name);
      setKeywords(p.brandKeywords?.join(', ') || '');
      setSupportChannels(p.officialSupportChannels?.join(', ') || '');
      setLogoUrl(undefined);
      setInvestigationSummary(null);
      setInvestigationState('IDLE');
      setDiscoveredIdentity(null);
      setAnalysisState('IDLE');
    }
  };

  const getProfilePayload = (): BrandProfile => {
    return {
      id: `brand-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: brandName.trim(),
      domain: domain.trim().toLowerCase().replace(/^https?:\/\//, ''),
      officialDomains: officialDomains.split(',').map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '')).filter(Boolean),
      handles: {
        twitter: twitter.trim() || undefined,
        instagram: instagram.trim() || undefined,
        telegram: telegram.trim() || undefined,
      },
      appPackageName: appPackage.trim() || undefined,
      authorizedAppIds: [appPackage.trim()].filter(Boolean),
      officialDevelopers: officialDevelopers.split(',').map((d) => d.trim()).filter(Boolean),
      brandKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      officialSupportChannels: supportChannels.split(',').map((s) => s.trim()).filter(Boolean),
      logoUrl: logoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = getProfilePayload();
    BrandStore.saveBrand(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  // Feature 1: Real-Time Brand Profile Intelligence - Website Analysis
  const handleAnalyzeBrand = async () => {
    if (!brandName.trim()) {
      setAnalysisError('Brand name is required to analyze brand identity.');
      setAnalysisState('ERROR');
      return;
    }
    if (!domain.trim()) {
      setAnalysisError('Official primary domain is required.');
      setAnalysisState('ERROR');
      return;
    }

    setAnalysisState('VALIDATING');
    setAnalysisError('');
    setDiscoveredIdentity(null);

    try {
      setAnalysisState('FETCHING_WEBSITE');

      const res = await fetch('/api/brands/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          officialWebsite: domain.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Brand website analysis failed with status ${res.status}`);
      }

      setAnalysisState('EXTRACTING_IDENTITY');
      const data: DiscoveredBrandIdentity = await res.json();

      setDiscoveredIdentity(data);

      // Pre-select all discovered assets for analyst confirmation
      const initialSocials: Record<string, boolean> = {};
      data.socialProfiles.forEach((s) => {
        initialSocials[`${s.platform}:${s.username}`] = true;
      });
      setSelectedSocials(initialSocials);

      const initialApps: Record<string, boolean> = {};
      data.applications.forEach((a) => {
        initialApps[`${a.store}:${a.packageId || a.storeUrl}`] = true;
      });
      setSelectedApps(initialApps);

      setAnalysisState('READY_FOR_REVIEW');
    } catch (err: unknown) {
      console.error('[SAFENET] Brand analysis failure:', err);
      setAnalysisState('ERROR');
      setAnalysisError(err instanceof Error ? err.message : 'Website analysis failed.');
    }
  };

  // Toggle selection of discovered social profiles
  const toggleSocialSelection = (key: string) => {
    setSelectedSocials((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle selection of discovered applications
  const toggleAppSelection = (key: string) => {
    setSelectedApps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Confirm Discovered Brand Identity as Ground Truth
  const handleConfirmDiscoveredIdentity = async () => {
    if (!discoveredIdentity) return;

    // Filter confirmed social profiles
    const confirmedSocials = discoveredIdentity.socialProfiles.filter(
      (s) => selectedSocials[`${s.platform}:${s.username}`]
    );

    let newTwitter = twitter;
    let newInstagram = instagram;
    let newTelegram = telegram;

    confirmedSocials.forEach((s) => {
      if (s.platform === 'twitter') newTwitter = s.username;
      if (s.platform === 'instagram') newInstagram = s.username;
      if (s.platform === 'telegram') newTelegram = s.username;
    });

    setTwitter(newTwitter);
    setInstagram(newInstagram);
    setTelegram(newTelegram);

    // Filter confirmed applications
    const confirmedApps = discoveredIdentity.applications.filter(
      (a) => selectedApps[`${a.store}:${a.packageId || a.storeUrl}`]
    );

    let newAppPackage = appPackage;
    if (confirmedApps.length > 0 && confirmedApps[0].packageId) {
      newAppPackage = confirmedApps[0].packageId;
      setAppPackage(newAppPackage);
    }

    // Merge domains
    const discoveredDomainStrings = discoveredIdentity.domains.map((d) => d.domain);
    const existingDomainList = officialDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    const mergedDomains = Array.from(new Set([...existingDomainList, ...discoveredDomainStrings])).join(', ');
    setOfficialDomains(mergedDomains);

    // Merge legal name / developers
    if (discoveredIdentity.legalName) {
      const devList = officialDevelopers.split(',').map((d) => d.trim()).filter(Boolean);
      if (!devList.includes(discoveredIdentity.legalName)) {
        devList.unshift(discoveredIdentity.legalName);
        setOfficialDevelopers(devList.join(', '));
      }
    }

    // Merge aliases into keywords
    if (discoveredIdentity.aliases.length > 0) {
      const kwList = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const mergedKw = Array.from(new Set([...kwList, ...discoveredIdentity.aliases])).join(', ');
      setKeywords(mergedKw);
    }

    if (discoveredIdentity.logoUrl) {
      setLogoUrl(discoveredIdentity.logoUrl);
    }

    // Build normalized profile and persist
    const newProfile: BrandProfile = {
      id: `brand-${discoveredIdentity.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: discoveredIdentity.brandName,
      domain: discoveredIdentity.canonicalDomain,
      officialDomains: Array.from(new Set([...existingDomainList, ...discoveredDomainStrings])),
      handles: {
        twitter: newTwitter || undefined,
        instagram: newInstagram || undefined,
        telegram: newTelegram || undefined,
      },
      appPackageName: newAppPackage || undefined,
      authorizedAppIds: confirmedApps.map((a) => a.packageId || '').filter(Boolean),
      officialDevelopers: discoveredIdentity.legalName
        ? [discoveredIdentity.legalName, discoveredIdentity.brandName]
        : [discoveredIdentity.brandName],
      brandKeywords: Array.from(new Set([discoveredIdentity.brandName, ...discoveredIdentity.aliases])),
      officialSupportChannels: supportChannels.split(',').map((s) => s.trim()).filter(Boolean),
      logoUrl: discoveredIdentity.logoUrl,
      aliases: discoveredIdentity.aliases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    BrandStore.saveBrand(newProfile);

    // Sync to backend baseline
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
    } catch {
      // Graceful offline fallback
    }

    setAnalysisState('CONFIRMED');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleStartInvestigation = async () => {
    const profile = getProfilePayload();
    BrandStore.saveBrand(profile);

    setInvestigationState('INVESTIGATING');
    setInvestigationStatusMessage('Initializing multi-provider investigation pipeline...');
    setInvestigationSummary(null);

    try {
      setInvestigationState('DISCOVERING');
      setInvestigationStatusMessage('Querying live digital providers (Apple App Store, Web & Social Search)...');

      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: profile.name,
          officialWebsite: profile.domain,
          officialDomains: profile.officialDomains,
          officialSocialAccounts: profile.handles,
          officialApps: profile.authorizedAppIds,
          officialDevelopers: profile.officialDevelopers,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Investigation failed with status ${res.status}`);
      }

      setInvestigationState('ANALYZING');
      setInvestigationStatusMessage('Calculating deterministic risk scores & generating evidence explanations...');

      const data = await res.json();

      // Save real threats and investigation into BrandStore
      BrandStore.saveThreats(data.threats || []);
      BrandStore.saveInvestigation(data);

      setInvestigationSummary(data);

      if ((data.threats || []).length === 0) {
        setInvestigationState('NO_RESULTS');
        setInvestigationStatusMessage('Investigation completed. No impersonation candidates discovered from configured sources.');
      } else {
        setInvestigationState('COMPLETED');
        setInvestigationStatusMessage(`Investigation completed: ${data.threats.length} live candidates discovered and analyzed.`);
      }
    } catch (err) {
      console.error('[SAFENET] Investigation error:', err);
      setInvestigationState('ERROR');
      setInvestigationStatusMessage(err instanceof Error ? err.message : 'Investigation failed.');
    }
  };

  return (
    <AppShell
      pageTitle="Brand Protection Baseline"
      pageSubtitle="Establish verified digital ground truth via real-time official website intelligence."
    >
      <div className="max-w-4xl mx-auto space-y-10 pb-16">
        {/* Preset Selector Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
              ENVIRONMENT PRESET
            </span>
            <h3 className="text-[18px] font-normal text-[#F2F4F3]">
              Active organization configuration
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-mono">
            <button
              type="button"
              onClick={() => handleLoadPreset('Paytm')}
              className={`pb-1 transition-colors cursor-pointer ${
                brandName === 'Paytm'
                  ? 'text-[#F2F4F3] border-b border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              Paytm (Financial / UPI)
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('Nike')}
              className={`pb-1 transition-colors cursor-pointer ${
                brandName === 'Nike'
                  ? 'text-[#F2F4F3] border-b border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              Nike (Retail / Global)
            </button>
          </div>
        </div>

        {/* Feature 1: Real-Time Official Website Intelligence Banner */}
        <div className="border border-[rgba(24,230,163,0.25)] bg-[#0A1210] p-6 rounded-[2px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#18E6A3] animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#18E6A3]">
                  FEATURE 1: REAL-TIME BRAND PROFILE INTELLIGENCE
                </span>
              </div>
              <h4 className="text-[15px] font-normal text-[#F2F4F3]">
                Extract ground truth from official website
              </h4>
              <p className="text-[12px] text-[#8A9390] leading-relaxed">
                Connects to the live website, inspects JSON-LD Organization schemas, sameAs profiles, OpenGraph images, and public app links to establish evidence-backed ground truth.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeBrand}
              disabled={analysisState === 'VALIDATING' || analysisState === 'FETCHING_WEBSITE' || analysisState === 'EXTRACTING_IDENTITY'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#18E6A3] text-[#080A0B] text-[13px] font-mono font-semibold rounded-[2px] hover:bg-[#18E6A3]/90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {analysisState === 'VALIDATING' || analysisState === 'FETCHING_WEBSITE' || analysisState === 'EXTRACTING_IDENTITY' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>ANALYZING WEBSITE...</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  <span>ANALYZE BRAND</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Real-time Status Notification */}
          {analysisState !== 'IDLE' && analysisState !== 'READY_FOR_REVIEW' && analysisState !== 'CONFIRMED' && (
            <div className="border-t border-[rgba(24,230,163,0.15)] pt-4 mt-2 font-mono text-[12px] text-[#F2F4F3] flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-[#18E6A3] shrink-0" />
              <span>
                {analysisState === 'VALIDATING' && 'Validating target URL & enforcing SSRF boundaries...'}
                {analysisState === 'FETCHING_WEBSITE' && `Establishing TLS connection to ${domain} (HTTP GET inspection)...`}
                {analysisState === 'EXTRACTING_IDENTITY' && 'Parsing JSON-LD Organization schemas, sameAs links & app store references...'}
                {analysisState === 'ERROR' && `Analysis failed: ${analysisError}`}
              </span>
            </div>
          )}

          {analysisState === 'ERROR' && (
            <div className="border border-[rgba(255,92,92,0.3)] bg-[rgba(255,92,92,0.05)] p-4 rounded-[2px] flex items-start gap-3 text-[12px] text-[#FF5C5C] font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block uppercase">Inspection Error</span>
                <span>{analysisError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Discovered Identity Review Panel */}
        {discoveredIdentity && (
          <div className="border border-[rgba(255,255,255,0.12)] bg-[#0D1011] p-6 rounded-[2px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#18E6A3]">
                  DISCOVERED BRAND IDENTITY (REVIEW & CONFIRM)
                </span>
                <h3 className="text-[17px] text-[#F2F4F3] font-normal flex items-center gap-2">
                  <span>{discoveredIdentity.brandName}</span>
                  {discoveredIdentity.legalName && (
                    <span className="text-[12px] font-mono text-[#8A9390]">
                      ({discoveredIdentity.legalName})
                    </span>
                  )}
                </h3>
              </div>

              {discoveredIdentity.logoUrl && (
                <div className="flex items-center gap-3 bg-[#080A0B] px-3 py-1.5 rounded-[2px] border border-[rgba(255,255,255,0.08)]">
                  <img
                    src={discoveredIdentity.logoUrl}
                    alt="Discovered Logo"
                    className="h-8 w-8 object-contain rounded-[2px]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[11px] font-mono">
                    <span className="text-[#8A9390] block text-[9px] uppercase">LOGO SOURCE</span>
                    <span className="text-[#F2F4F3] uppercase">{discoveredIdentity.logoSource || 'WEBSITE'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Signals Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {discoveredIdentity.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="bg-[#080A0B] p-3 rounded-[2px] border border-[rgba(255,255,255,0.05)] space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#59625F] uppercase truncate">{sig.name}</span>
                    {sig.status === 'verified' || sig.status === 'detected' ? (
                      <CheckCircle2 className="h-3 w-3 text-[#18E6A3]" />
                    ) : (
                      <span className="text-[10px] text-[#59625F]">N/A</span>
                    )}
                  </div>
                  <span className={`text-[12px] block font-light capitalize ${
                    sig.status === 'verified' ? 'text-[#18E6A3]' : sig.status === 'detected' ? 'text-[#F2F4F3]' : 'text-[#59625F]'
                  }`}>
                    {sig.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Discovered Social Profiles */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#59625F] uppercase tracking-wider">
                  DISCOVERED OFFICIAL SOCIAL PRESENCE ({discoveredIdentity.socialProfiles.length})
                </span>
                <span className="text-[11px] text-[#8A9390]">
                  Toggle to include in authoritative baseline
                </span>
              </div>

              {discoveredIdentity.socialProfiles.length === 0 ? (
                <div className="text-[12px] text-[#59625F] bg-[#080A0B] p-3 rounded-[2px]">
                  No official social media links detected on the official website.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {discoveredIdentity.socialProfiles.map((s, idx) => {
                    const key = `${s.platform}:${s.username}`;
                    const isSelected = selectedSocials[key] ?? true;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-[2px] border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#080A0B] border-[rgba(24,230,163,0.3)]'
                            : 'bg-[#080A0B]/50 border-[rgba(255,255,255,0.05)] opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-semibold text-[#18E6A3]">
                              {s.platform}
                            </span>
                            <span className="text-[9px] text-[#59625F] uppercase">
                              [{s.source}]
                            </span>
                          </div>
                          <span className="text-[13px] text-[#F2F4F3] block truncate">
                            {s.username}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSocialSelection(key)}
                          className={`px-2.5 py-1 text-[11px] rounded-[2px] transition-colors cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#18E6A3]/10 text-[#18E6A3] border border-[#18E6A3]/30'
                              : 'bg-transparent text-[#59625F] border border-[rgba(255,255,255,0.1)] hover:text-[#8A9390]'
                          }`}
                        >
                          {isSelected ? 'CONFIRMED' : 'EXCLUDED'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discovered Mobile Applications */}
            <div className="space-y-3 font-mono">
              <span className="text-[11px] text-[#59625F] uppercase tracking-wider block">
                DISCOVERED MOBILE APPLICATIONS ({discoveredIdentity.applications.length})
              </span>

              {discoveredIdentity.applications.length === 0 ? (
                <div className="text-[12px] text-[#59625F] bg-[#080A0B] p-3 rounded-[2px]">
                  No official mobile application links discovered on the website.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {discoveredIdentity.applications.map((app, idx) => {
                    const key = `${app.store}:${app.packageId || app.storeUrl}`;
                    const isSelected = selectedApps[key] ?? true;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-[2px] border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#080A0B] border-[rgba(24,230,163,0.3)]'
                            : 'bg-[#080A0B]/50 border-[rgba(255,255,255,0.05)] opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-semibold text-[#18E6A3]">
                              {app.store}
                            </span>
                          </div>
                          <span className="text-[12px] text-[#F2F4F3] block truncate">
                            {app.packageId || app.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAppSelection(key)}
                          className={`px-2.5 py-1 text-[11px] rounded-[2px] transition-colors cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#18E6A3]/10 text-[#18E6A3] border border-[#18E6A3]/30'
                              : 'bg-transparent text-[#59625F] border border-[rgba(255,255,255,0.1)] hover:text-[#8A9390]'
                          }`}
                        >
                          {isSelected ? 'CONFIRMED' : 'EXCLUDED'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Authoritative Review Confirmation Action */}
            <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-[12px] font-mono text-[#8A9390]">
                Confirming writes verified identities into the authoritative baseline for similarity audits.
              </span>

              <button
                type="button"
                onClick={handleConfirmDiscoveredIdentity}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#18E6A3] text-[#080A0B] text-[13px] font-mono font-semibold rounded-[2px] hover:bg-[#18E6A3]/90 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>CONFIRM OFFICIAL IDENTITY</span>
              </button>
            </div>
          </div>
        )}

        {/* Configuration Form (Continuous Layout) */}
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-6">
            <div className="border-b border-[rgba(255,255,255,0.08)] pb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                IDENTITY PARAMETERS (SOURCE OF TRUTH)
              </span>
              {analysisState === 'CONFIRMED' && (
                <span className="font-mono text-[11px] text-[#18E6A3] uppercase">
                  VERIFIED WITH WEBSITE INTELLIGENCE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Primary Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Domains Allowlist (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDomains}
                  onChange={(e) => setOfficialDomains(e.target.value)}
                  placeholder="e.g. brand.com, brandbank.com, brandmoney.com"
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Telegram / Instagram Handle
                </label>
                <input
                  type="text"
                  value={instagram || telegram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    setTelegram(e.target.value);
                  }}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Mobile App Package ID / Bundle ID
                </label>
                <input
                  type="text"
                  value={appPackage}
                  onChange={(e) => setAppPackage(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Authorized Publishers / Developers (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDevelopers}
                  onChange={(e) => setOfficialDevelopers(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Monitored Brand Keywords & Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[11px] font-mono uppercase text-[#59625F]">
                  Official Support Channels (Comma-separated)
                </label>
                <input
                  type="text"
                  value={supportChannels}
                  onChange={(e) => setSupportChannels(e.target.value)}
                  className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[13px] text-[#F2F4F3] font-mono focus:border-[rgba(255,255,255,0.25)] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <span className="text-[12px] text-[#59625F]">
              Parameters establish the authoritative baseline for distance metrics, app developer comparison, and impersonation auditing.
            </span>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] text-[13px] font-mono rounded-[2px] hover:border-[rgba(255,255,255,0.3)] transition-all cursor-pointer"
              >
                {saved ? <Check className="h-3.5 w-3.5 text-[#18E6A3]" /> : <Save className="h-3.5 w-3.5" />}
                <span>{saved ? 'SAVED BASELINE' : 'SAVE BASELINE'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartInvestigation}
                disabled={investigationState === 'INVESTIGATING' || investigationState === 'DISCOVERING' || investigationState === 'ANALYZING'}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#18E6A3] text-[#080A0B] text-[13px] font-mono font-semibold rounded-[2px] hover:bg-[#18E6A3]/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {investigationState === 'INVESTIGATING' || investigationState === 'DISCOVERING' || investigationState === 'ANALYZING' ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>INVESTIGATING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>START INVESTIGATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Investigation Pipeline Status & Outcome */}
        {investigationState !== 'IDLE' && (
          <div className="border border-[rgba(255,255,255,0.08)] bg-[#0D1011] p-6 rounded-[2px] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#59625F]">STATUS:</span>
                <span
                  className={
                    investigationState === 'COMPLETED'
                      ? 'text-[#18E6A3]'
                      : investigationState === 'ERROR'
                      ? 'text-[#FF5C5C]'
                      : 'text-[#F5B84B]'
                  }
                >
                  {investigationState}
                </span>
              </div>
              <span className="text-[11px] text-[#59625F]">
                Pipeline: Apple iTunes API • Search Feeds • AI Synthesizer
              </span>
            </div>

            <p className="text-[13px] text-[#F2F4F3] leading-relaxed">
              {investigationStatusMessage}
            </p>

            {investigationSummary && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] bg-[#080A0B] p-4 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                  <div>
                    <span className="text-[#59625F] block text-[10px]">CANDIDATES</span>
                    <span className="text-[#F2F4F3] text-[18px] font-light">
                      {investigationSummary.candidatesCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#59625F] block text-[10px]">ELEVATED / HIGH RISK</span>
                    <span className="text-[#FF5C5C] text-[18px] font-light">
                      {investigationSummary.highRiskCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#59625F] block text-[10px]">PROVIDERS QUERIED</span>
                    <span className="text-[#18E6A3] text-[18px] font-light">
                      {Object.keys(investigationSummary.providerRuns || {}).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#59625F] block text-[10px]">STATUS</span>
                    <span className="text-[#F2F4F3] text-[18px] font-light uppercase">
                      {investigationSummary.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[12px] text-[#8A9390]">
                    Results persisted to SAFENET Command Center.
                  </span>
                  <Link
                    href="/overview"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#18E6A3] hover:underline font-semibold"
                  >
                    <span>VIEW RESULTS IN DASHBOARD</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
