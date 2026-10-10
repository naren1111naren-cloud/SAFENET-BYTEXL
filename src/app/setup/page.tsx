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
import { BrandProfile, DiscoveredBrandIdentity } from '@/types/brand';

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const splitDomains = officialDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const splitDevelopers = officialDevelopers
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const splitSupport = supportChannels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const existing = BrandStore.getBrand();
    const profile: BrandProfile = {
      id: existing?.id || `brand-${Date.now()}`,
      name: brandName.trim(),
      domain: domain.trim(),
      handles: {
        twitter: twitter.trim() || undefined,
        instagram: instagram.trim() || undefined,
        telegram: telegram.trim() || undefined,
      },
      appPackageName: appPackage.trim() || undefined,
      officialDomains: splitDomains.length > 0 ? splitDomains : [domain.trim()],
      officialDevelopers: splitDevelopers.length > 0 ? splitDevelopers : undefined,
      officialSupportChannels: splitSupport.length > 0 ? splitSupport : undefined,
      brandKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      logoUrl: logoUrl || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    BrandStore.saveBrand(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAnalyzeBrand = async () => {
    setAnalysisError('');
    setAnalysisState('VALIDATING');
    setDiscoveredIdentity(null);

    try {
      setAnalysisState('FETCHING_WEBSITE');
      const res = await fetch('/api/brand/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          domain: domain.trim(),
        }),
      });

      setAnalysisState('EXTRACTING_IDENTITY');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract ground truth from website.');
      }

      setDiscoveredIdentity(data.identity);

      // Pre-select all discovered items
      const initialSocials: Record<string, boolean> = {};
      data.identity.socialProfiles.forEach((s: any) => {
        initialSocials[`${s.platform}:${s.username}`] = true;
      });
      setSelectedSocials(initialSocials);

      const initialApps: Record<string, boolean> = {};
      data.identity.applications.forEach((a: any) => {
        initialApps[`${a.store}:${a.packageId || a.storeUrl}`] = true;
      });
      setSelectedApps(initialApps);

      setAnalysisState('READY_FOR_REVIEW');
    } catch (err: any) {
      setAnalysisState('ERROR');
      setAnalysisError(err.message || 'An unexpected error occurred during brand analysis.');
    }
  };

  const toggleSocialSelection = (key: string) => {
    setSelectedSocials((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAppSelection = (key: string) => {
    setSelectedApps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirmDiscoveredIdentity = () => {
    if (!discoveredIdentity) return;

    // Apply discovered brand name & official domains
    setBrandName(discoveredIdentity.brandName);
    if (discoveredIdentity.domains.length > 0) {
      const domainStrings = discoveredIdentity.domains.map((d: any) => (typeof d === 'string' ? d : d.domain));
      setDomain(domainStrings[0]);
      setOfficialDomains(domainStrings.join(', '));
    }

    // Apply confirmed social handles
    discoveredIdentity.socialProfiles.forEach((s) => {
      const key = `${s.platform}:${s.username}`;
      if (selectedSocials[key]) {
        if (s.platform === 'twitter') setTwitter(s.username.startsWith('@') ? s.username : `@${s.username}`);
        if (s.platform === 'instagram') setInstagram(s.username.startsWith('@') ? s.username : `@${s.username}`);
        if (s.platform === 'telegram') setTelegram(s.username.startsWith('@') ? s.username : `@${s.username}`);
      }
    });

    // Apply confirmed mobile app package
    const confirmedApp = discoveredIdentity.applications.find((a) => {
      const key = `${a.store}:${a.packageId || a.storeUrl}`;
      return selectedApps[key] && a.packageId;
    });
    if (confirmedApp?.packageId) {
      setAppPackage(confirmedApp.packageId);
    }

    // Apply confirmed developers
    const appDevelopers = discoveredIdentity.applications
      .map((a) => a.developer)
      .filter((d): d is string => Boolean(d));
    if (appDevelopers.length > 0) {
      setOfficialDevelopers(Array.from(new Set(appDevelopers)).join(', '));
    }

    // Apply logo if discovered
    if (discoveredIdentity.logoUrl) {
      setLogoUrl(discoveredIdentity.logoUrl);
    }

    setAnalysisState('CONFIRMED');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStartInvestigation = async () => {
    setInvestigationState('INVESTIGATING');
    setInvestigationStatusMessage('Initializing multi-provider query pipeline...');
    setInvestigationSummary(null);

    try {
      const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
      setInvestigationState('DISCOVERING');
      setInvestigationStatusMessage(`Querying live app stores, domain registers and social networks for "${activeBrand.name}"...`);

      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: activeBrand.name,
          brandDomain: activeBrand.domain,
          country: 'in',
        }),
      });

      setInvestigationState('ANALYZING');
      setInvestigationStatusMessage('Correlating lexical distances, publisher signatures and threat intelligence...');

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete investigation pipeline.');
      }

      setInvestigationSummary(data);
      setInvestigationState('COMPLETED');
      setInvestigationStatusMessage(
        `Investigation finished: Evaluated ${data.candidatesCount || 0} candidates. Discovered ${data.highRiskCount || 0} high-risk impersonation entities.`
      );
    } catch (err: any) {
      setInvestigationState('ERROR');
      setInvestigationStatusMessage(`Investigation failed: ${err.message || 'Unknown network error'}`);
    }
  };

  return (
    <AppShell
      pageTitle="Brand Baseline Parameters"
      pageSubtitle="Authoritative ground truth registry against which lexical resemblance and unauthorized infrastructure are evaluated."
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* Preset Selector Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#1E2638] pb-5">
          <div className="space-y-1">
            <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-extrabold">
              FAST-LOAD DEMO TEMPLATES
            </span>
            <p className="text-[17px] text-[#9CA3AF] font-bold">
              Select an authoritative baseline profile for instant sandbox evaluation:
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleLoadPreset('Paytm')}
              className={`px-4 py-2 rounded-xl transition font-extrabold text-[16px] cursor-pointer ${
                brandName === 'Paytm'
                  ? 'bg-[#F6821F] text-[#080B11]'
                  : 'bg-[#111625] text-[#9CA3AF] hover:text-[#FFFFFF] border border-[#1E2638]'
              }`}
            >
              Paytm (Fintech / India)
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('Nike')}
              className={`px-4 py-2 rounded-xl transition font-extrabold text-[16px] cursor-pointer ${
                brandName === 'Nike'
                  ? 'bg-[#F6821F] text-[#080B11]'
                  : 'bg-[#111625] text-[#9CA3AF] hover:text-[#FFFFFF] border border-[#1E2638]'
              }`}
            >
              Nike (Retail / Global)
            </button>
          </div>
        </div>

        {/* Feature 1: Real-Time Official Website Intelligence Banner (Open, Non-Boxy) */}
        <div className="border border-[#1E2638] bg-[#0E131F] p-7 sm:p-9 rounded-2xl space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F6821F] animate-pulse" />
                <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-extrabold">
                  REAL-TIME BRAND PROFILE INTELLIGENCE
                </span>
              </div>
              <h4 className="text-[22px] font-extrabold text-[#FFFFFF]">
                Extract ground truth from official website
              </h4>
              <p className="text-[17px] text-[#9CA3AF] leading-relaxed font-bold">
                Connects to the live website, inspects JSON-LD Organization schemas, sameAs profiles, OpenGraph images, and public app links to establish evidence-backed ground truth.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeBrand}
              disabled={analysisState === 'VALIDATING' || analysisState === 'FETCHING_WEBSITE' || analysisState === 'EXTRACTING_IDENTITY'}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-[17px] font-mono font-extrabold rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0 shadow-lg"
            >
              {analysisState === 'VALIDATING' || analysisState === 'FETCHING_WEBSITE' || analysisState === 'EXTRACTING_IDENTITY' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>ANALYZING WEBSITE...</span>
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  <span>ANALYZE BRAND</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Real-time Status Notification */}
          {analysisState !== 'IDLE' && analysisState !== 'READY_FOR_REVIEW' && analysisState !== 'CONFIRMED' && (
            <div className="border-t border-[#1E2638] pt-4 mt-2 font-mono text-[16px] text-[#FFFFFF] font-bold flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-[#F6821F] shrink-0" />
              <span>
                {analysisState === 'VALIDATING' && 'Validating target URL & enforcing SSRF boundaries...'}
                {analysisState === 'FETCHING_WEBSITE' && `Establishing TLS connection to ${domain} (HTTP GET inspection)...`}
                {analysisState === 'EXTRACTING_IDENTITY' && 'Parsing JSON-LD Organization schemas, sameAs links & app store references...'}
                {analysisState === 'ERROR' && `Analysis failed: ${analysisError}`}
              </span>
            </div>
          )}

          {analysisState === 'ERROR' && (
            <div className="border border-[#FF5C6C]/40 bg-[#2D1216] p-5 rounded-xl flex items-start gap-3.5 text-[17px] text-[#FF5C6C] font-bold">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block uppercase">Inspection Error</span>
                <span>{analysisError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Discovered Identity Review Panel */}
        {discoveredIdentity && (
          <div className="border border-[#1E2638] bg-[#0E131F] p-7 sm:p-9 rounded-2xl space-y-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#1E2638] pb-5">
              <div className="space-y-1.5">
                <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-extrabold">
                  DISCOVERED BRAND IDENTITY (REVIEW &amp; CONFIRM)
                </span>
                <h3 className="text-[26px] text-[#FFFFFF] font-extrabold flex items-center gap-2.5">
                  <span>{discoveredIdentity.brandName}</span>
                  {discoveredIdentity.legalName && (
                    <span className="text-[17px] font-mono text-[#9CA3AF] font-normal">
                      ({discoveredIdentity.legalName})
                    </span>
                  )}
                </h3>
              </div>

              {discoveredIdentity.logoUrl && (
                <div className="flex items-center gap-3 bg-[#111625] px-4 py-2.5 rounded-xl border border-[#1E2638]">
                  <img
                    src={discoveredIdentity.logoUrl}
                    alt="Discovered Logo"
                    className="h-10 w-10 object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[14px] font-mono">
                    <span className="text-[#9CA3AF] block text-[11px] uppercase font-bold">LOGO SOURCE</span>
                    <span className="text-[#F6821F] uppercase font-extrabold">{discoveredIdentity.logoSource || 'WEBSITE'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Signals Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {discoveredIdentity.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="bg-[#111625] p-4 rounded-xl border border-[#1E2638] space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#9CA3AF] uppercase truncate font-bold">{sig.name}</span>
                    {sig.status === 'verified' || sig.status === 'detected' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#F6821F]" />
                    ) : (
                      <span className="text-[13px] text-[#8F9CAE]">N/A</span>
                    )}
                  </div>
                  <span className={`text-[16px] block font-extrabold capitalize ${
                    sig.status === 'verified' ? 'text-[#F6821F]' : sig.status === 'detected' ? 'text-[#FFFFFF]' : 'text-[#8F9CAE]'
                  }`}>
                    {sig.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Discovered Social Profiles */}
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#9CA3AF] uppercase tracking-wider font-extrabold">
                  DISCOVERED OFFICIAL SOCIAL PRESENCE ({discoveredIdentity.socialProfiles.length})
                </span>
                <span className="text-[14px] text-[#F6821F] font-bold">
                  Toggle to include in authoritative baseline
                </span>
              </div>

              {discoveredIdentity.socialProfiles.length === 0 ? (
                <div className="text-[16px] text-[#9CA3AF] bg-[#111625] p-4 rounded-xl border border-[#1E2638] font-bold">
                  No official social media links detected on the official website.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {discoveredIdentity.socialProfiles.map((s, idx) => {
                    const key = `${s.platform}:${s.username}`;
                    const isSelected = selectedSocials[key] ?? true;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#111625] border-[#F6821F]'
                            : 'bg-[#080B11] border-[#1E2638] opacity-60'
                        }`}
                      >
                        <div className="space-y-1 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] uppercase font-extrabold text-[#F6821F]">
                              {s.platform}
                            </span>
                            <span className="text-[11px] text-[#9CA3AF] uppercase font-bold">
                              [{s.source}]
                            </span>
                          </div>
                          <span className="text-[17px] text-[#FFFFFF] font-extrabold block truncate">
                            {s.username}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSocialSelection(key)}
                          className={`px-3 py-1.5 text-[14px] rounded-lg transition font-extrabold cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#F6821F] text-[#080B11]'
                              : 'bg-[#111625] text-[#9CA3AF] border border-[#1E2638] hover:text-[#FFFFFF]'
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
            <div className="space-y-4 font-mono">
              <span className="text-[14px] text-[#9CA3AF] uppercase tracking-wider block font-extrabold">
                DISCOVERED MOBILE APPLICATIONS ({discoveredIdentity.applications.length})
              </span>

              {discoveredIdentity.applications.length === 0 ? (
                <div className="text-[16px] text-[#9CA3AF] bg-[#111625] p-4 rounded-xl border border-[#1E2638] font-bold">
                  No official mobile application links discovered on the website.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {discoveredIdentity.applications.map((app, idx) => {
                    const key = `${app.store}:${app.packageId || app.storeUrl}`;
                    const isSelected = selectedApps[key] ?? true;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#111625] border-[#F6821F]'
                            : 'bg-[#080B11] border-[#1E2638] opacity-60'
                        }`}
                      >
                        <div className="space-y-1 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] uppercase font-extrabold text-[#F6821F]">
                              {app.store}
                            </span>
                          </div>
                          <span className="text-[16px] text-[#FFFFFF] font-extrabold block truncate">
                            {app.packageId || app.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAppSelection(key)}
                          className={`px-3 py-1.5 text-[14px] rounded-lg transition font-extrabold cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#F6821F] text-[#080B11]'
                              : 'bg-[#111625] text-[#9CA3AF] border border-[#1E2638] hover:text-[#FFFFFF]'
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
            <div className="pt-5 border-t border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-[16px] font-mono text-[#9CA3AF] font-bold">
                Confirming writes verified identities into the authoritative baseline for similarity audits.
              </span>

              <button
                type="button"
                onClick={handleConfirmDiscoveredIdentity}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-[17px] font-mono font-extrabold rounded-xl transition cursor-pointer shadow-lg"
              >
                <Check className="h-4 w-4" />
                <span>CONFIRM OFFICIAL IDENTITY</span>
              </button>
            </div>
          </div>
        )}

        {/* Configuration Form (Open, Non-Boxy) */}
        <form onSubmit={handleSave} className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-xl space-y-9">
          <div className="space-y-7">
            <div className="border-b border-[#1E2638] pb-3 flex items-center justify-between">
              <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-extrabold">
                IDENTITY PARAMETERS (SOURCE OF TRUTH)
              </span>
              {analysisState === 'CONFIRMED' && (
                <span className="font-mono text-[14px] text-[#F6821F] uppercase font-extrabold">
                  VERIFIED WITH WEBSITE INTELLIGENCE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Primary Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Domains Allowlist (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDomains}
                  onChange={(e) => setOfficialDomains(e.target.value)}
                  placeholder="e.g. brand.com, brandbank.com, brandmoney.com"
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Telegram / Instagram Handle
                </label>
                <input
                  type="text"
                  value={instagram || telegram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    setTelegram(e.target.value);
                  }}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Mobile App Package ID
                </label>
                <input
                  type="text"
                  value={appPackage}
                  onChange={(e) => setAppPackage(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Authorized Publishers / Developers (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDevelopers}
                  onChange={(e) => setOfficialDevelopers(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Monitored Brand Keywords &amp; Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[15px] font-mono uppercase text-[#9CA3AF] font-bold">
                  Official Support Channels (Comma-separated)
                </label>
                <input
                  type="text"
                  value={supportChannels}
                  onChange={(e) => setSupportChannels(e.target.value)}
                  className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold focus:border-[#F6821F] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-7 border-t border-[#1E2638]">
            <span className="text-[16px] text-[#9CA3AF] font-bold">
              Parameters establish the authoritative baseline for distance metrics, app developer comparison, and impersonation auditing.
            </span>

            <div className="flex items-center gap-3.5 shrink-0">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#1E2638] text-[#FFFFFF] text-[17px] font-mono font-extrabold rounded-xl hover:bg-[#111625] transition cursor-pointer shadow-md"
              >
                {saved ? <Check className="h-4 w-4 text-[#F6821F]" /> : <Save className="h-4 w-4" />}
                <span>{saved ? 'SAVED BASELINE' : 'SAVE BASELINE'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartInvestigation}
                disabled={investigationState === 'INVESTIGATING' || investigationState === 'DISCOVERING' || investigationState === 'ANALYZING'}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-[17px] font-mono font-extrabold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-lg"
              >
                {investigationState === 'INVESTIGATING' || investigationState === 'DISCOVERING' || investigationState === 'ANALYZING' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>INVESTIGATING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>START INVESTIGATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Investigation Pipeline Status & Outcome */}
        {investigationState !== 'IDLE' && (
          <div className="border border-[#1E2638] bg-[#0E131F] p-7 sm:p-9 rounded-2xl space-y-5 font-mono shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-4">
              <div className="flex items-center gap-3 text-[15px]">
                <span className="text-[#9CA3AF] font-extrabold">STATUS:</span>
                <span
                  className={
                    investigationState === 'COMPLETED'
                      ? 'text-[#F6821F] font-extrabold'
                      : investigationState === 'ERROR'
                      ? 'text-[#FF5C6C] font-extrabold'
                      : 'text-[#FFAB40] font-extrabold'
                  }
                >
                  {investigationState}
                </span>
              </div>
              <span className="text-[14px] text-[#9CA3AF] font-bold">
                Pipeline: Apple iTunes API • Search Feeds • AI Synthesizer
              </span>
            </div>

            <p className="text-[18px] text-[#FFFFFF] leading-relaxed font-bold">
              {investigationStatusMessage}
            </p>

            {investigationSummary && (
              <div className="space-y-5 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-[15px] bg-[#111625] p-5 rounded-xl border border-[#1E2638]">
                  <div>
                    <span className="text-[#9CA3AF] block text-[13px] font-extrabold uppercase">CANDIDATES</span>
                    <span className="text-[#FFFFFF] text-[26px] font-extrabold">
                      {investigationSummary.candidatesCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[13px] font-extrabold uppercase">ELEVATED / HIGH RISK</span>
                    <span className="text-[#FF5C6C] text-[26px] font-extrabold">
                      {investigationSummary.highRiskCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[13px] font-extrabold uppercase">PROVIDERS QUERIED</span>
                    <span className="text-[#F6821F] text-[26px] font-extrabold">
                      {Object.keys(investigationSummary.providerRuns || {}).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[13px] font-extrabold uppercase">STATUS</span>
                    <span className="text-[#FFFFFF] text-[24px] font-extrabold uppercase">
                      {investigationSummary.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[16px] text-[#9CA3AF] font-bold">
                    Results persisted to SAFENET Command Center.
                  </span>
                  <Link
                    href="/overview"
                    className="inline-flex items-center gap-2 text-[16px] text-[#F6821F] hover:text-[#2EB8A5] font-extrabold"
                  >
                    <span>VIEW RESULTS IN DASHBOARD</span>
                    <ArrowRight className="h-4 w-4" />
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
