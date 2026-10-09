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

  const toggleSocialSelection = (key: string) => {
    setSelectedSocials((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAppSelection = (key: string) => {
    setSelectedApps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmDiscoveredIdentity = async () => {
    if (!discoveredIdentity) return;

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

    const confirmedApps = discoveredIdentity.applications.filter(
      (a) => selectedApps[`${a.store}:${a.packageId || a.storeUrl}`]
    );

    let newAppPackage = appPackage;
    if (confirmedApps.length > 0 && confirmedApps[0].packageId) {
      newAppPackage = confirmedApps[0].packageId;
      setAppPackage(newAppPackage);
    }

    const discoveredDomainStrings = discoveredIdentity.domains.map((d) => d.domain);
    const existingDomainList = officialDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    const mergedDomains = Array.from(new Set([...existingDomainList, ...discoveredDomainStrings])).join(', ');
    setOfficialDomains(mergedDomains);

    if (discoveredIdentity.legalName) {
      const devList = officialDevelopers.split(',').map((d) => d.trim()).filter(Boolean);
      if (!devList.includes(discoveredIdentity.legalName)) {
        devList.unshift(discoveredIdentity.legalName);
        setOfficialDevelopers(devList.join(', '));
      }
    }

    if (discoveredIdentity.logoUrl) {
      setLogoUrl(discoveredIdentity.logoUrl);
    }

    const newProfile: BrandProfile = {
      ...getProfilePayload(),
      domain: discoveredIdentity.domains[0]?.domain || domain,
      handles: {
        twitter: newTwitter || undefined,
        instagram: newInstagram || undefined,
        telegram: newTelegram || undefined,
      },
      appPackageName: newAppPackage || undefined,
      officialDomains: mergedDomains.split(',').map((d) => d.trim()).filter(Boolean),
      logoUrl: discoveredIdentity.logoUrl || logoUrl,
    };

    BrandStore.saveBrand(newProfile);
    setAnalysisState('CONFIRMED');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStartInvestigation = async () => {
    const profile = getProfilePayload();
    BrandStore.saveBrand(profile);

    setInvestigationState('INVESTIGATING');
    setInvestigationStatusMessage('Connecting to real data adapters: Apple iTunes App Store API, Google Play, SerpApi & Live DNS...');
    setInvestigationSummary(null);

    try {
      setInvestigationState('DISCOVERING');
      setInvestigationStatusMessage(`Searching app ecosystems & external infrastructure for brand "${profile.name}"...`);

      const res = await fetch('/api/brands/investigate', {
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
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Preset Selector Banner */}
        <div className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
              ENVIRONMENT PRESET
            </span>
            <h3 className="text-[18px] font-bold text-[#202723]">
              Active organization configuration
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-mono">
            <button
              type="button"
              onClick={() => handleLoadPreset('Paytm')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold ${
                brandName === 'Paytm'
                  ? 'bg-[#477A60] text-white shadow-xs'
                  : 'bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] border border-[#DDE2DC]'
              }`}
            >
              Paytm (Financial / UPI)
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('Nike')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold ${
                brandName === 'Nike'
                  ? 'bg-[#477A60] text-white shadow-xs'
                  : 'bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] border border-[#DDE2DC]'
              }`}
            >
              Nike (Retail / Global)
            </button>
          </div>
        </div>

        {/* Feature 1: Real-Time Official Website Intelligence Banner */}
        <div className="border border-[#477A60]/30 bg-[#E7F0E9] p-6 rounded-xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#477A60] animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                  REAL-TIME BRAND PROFILE INTELLIGENCE
                </span>
              </div>
              <h4 className="text-[16px] font-bold text-[#202723]">
                Extract ground truth from official website
              </h4>
              <p className="text-[13px] text-[#626B65] leading-relaxed">
                Connects to the live website, inspects JSON-LD Organization schemas, sameAs profiles, OpenGraph images, and public app links to establish evidence-backed ground truth.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeBrand}
              disabled={analysisState === 'VALIDATING' || analysisState === 'FETCHING_WEBSITE' || analysisState === 'EXTRACTING_IDENTITY'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-mono font-bold rounded-lg transition cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
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
            <div className="border-t border-[#477A60]/20 pt-4 mt-2 font-mono text-[12px] text-[#202723] flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-[#477A60] shrink-0" />
              <span>
                {analysisState === 'VALIDATING' && 'Validating target URL & enforcing SSRF boundaries...'}
                {analysisState === 'FETCHING_WEBSITE' && `Establishing TLS connection to ${domain} (HTTP GET inspection)...`}
                {analysisState === 'EXTRACTING_IDENTITY' && 'Parsing JSON-LD Organization schemas, sameAs links & app store references...'}
                {analysisState === 'ERROR' && `Analysis failed: ${analysisError}`}
              </span>
            </div>
          )}

          {analysisState === 'ERROR' && (
            <div className="border border-[#C93643]/30 bg-[#C93643]/10 p-4 rounded-xl flex items-start gap-3 text-[13px] text-[#C93643] font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase">Inspection Error</span>
                <span>{analysisError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Discovered Identity Review Panel */}
        {discoveredIdentity && (
          <div className="border border-[#DDE2DC] bg-white p-6 rounded-xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE2DC] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
                  DISCOVERED BRAND IDENTITY (REVIEW & CONFIRM)
                </span>
                <h3 className="text-[18px] text-[#202723] font-bold flex items-center gap-2">
                  <span>{discoveredIdentity.brandName}</span>
                  {discoveredIdentity.legalName && (
                    <span className="text-[12px] font-mono text-[#626B65] font-normal">
                      ({discoveredIdentity.legalName})
                    </span>
                  )}
                </h3>
              </div>

              {discoveredIdentity.logoUrl && (
                <div className="flex items-center gap-3 bg-[#F7F8F6] px-3.5 py-2 rounded-xl border border-[#DDE2DC]">
                  <img
                    src={discoveredIdentity.logoUrl}
                    alt="Discovered Logo"
                    className="h-8 w-8 object-contain rounded-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[11px] font-mono">
                    <span className="text-[#858D86] block text-[9px] uppercase font-bold">LOGO SOURCE</span>
                    <span className="text-[#202723] uppercase font-bold">{discoveredIdentity.logoSource || 'WEBSITE'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Signals Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {discoveredIdentity.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="bg-[#F7F8F6] p-3 rounded-lg border border-[#DDE2DC] space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#858D86] uppercase truncate font-bold">{sig.name}</span>
                    {sig.status === 'verified' || sig.status === 'detected' ? (
                      <CheckCircle2 className="h-3 w-3 text-[#347653]" />
                    ) : (
                      <span className="text-[10px] text-[#858D86]">N/A</span>
                    )}
                  </div>
                  <span className={`text-[12px] block font-bold capitalize ${
                    sig.status === 'verified' ? 'text-[#347653]' : sig.status === 'detected' ? 'text-[#202723]' : 'text-[#858D86]'
                  }`}>
                    {sig.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Discovered Social Profiles */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#858D86] uppercase tracking-wider font-bold">
                  DISCOVERED OFFICIAL SOCIAL PRESENCE ({discoveredIdentity.socialProfiles.length})
                </span>
                <span className="text-[11px] text-[#626B65]">
                  Toggle to include in authoritative baseline
                </span>
              </div>

              {discoveredIdentity.socialProfiles.length === 0 ? (
                <div className="text-[12px] text-[#858D86] bg-[#F7F8F6] p-3.5 rounded-lg border border-[#DDE2DC]">
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
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#E7F0E9] border-[#477A60]/40'
                            : 'bg-[#F7F8F6] border-[#DDE2DC] opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-[#477A60]">
                              {s.platform}
                            </span>
                            <span className="text-[9px] text-[#858D86] uppercase font-semibold">
                              [{s.source}]
                            </span>
                          </div>
                          <span className="text-[13px] text-[#202723] font-bold block truncate">
                            {s.username}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSocialSelection(key)}
                          className={`px-2.5 py-1 text-[11px] rounded-md transition font-bold cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#477A60] text-white shadow-xs'
                              : 'bg-white text-[#858D86] border border-[#DDE2DC] hover:text-[#202723]'
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
              <span className="text-[11px] text-[#858D86] uppercase tracking-wider block font-bold">
                DISCOVERED MOBILE APPLICATIONS ({discoveredIdentity.applications.length})
              </span>

              {discoveredIdentity.applications.length === 0 ? (
                <div className="text-[12px] text-[#858D86] bg-[#F7F8F6] p-3.5 rounded-lg border border-[#DDE2DC]">
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
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#E7F0E9] border-[#477A60]/40'
                            : 'bg-[#F7F8F6] border-[#DDE2DC] opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-[#477A60]">
                              {app.store}
                            </span>
                          </div>
                          <span className="text-[12px] text-[#202723] font-bold block truncate">
                            {app.packageId || app.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAppSelection(key)}
                          className={`px-2.5 py-1 text-[11px] rounded-md transition font-bold cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#477A60] text-white shadow-xs'
                              : 'bg-white text-[#858D86] border border-[#DDE2DC] hover:text-[#202723]'
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
            <div className="pt-4 border-t border-[#DDE2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-[12px] font-mono text-[#626B65]">
                Confirming writes verified identities into the authoritative baseline for similarity audits.
              </span>

              <button
                type="button"
                onClick={handleConfirmDiscoveredIdentity}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-mono font-bold rounded-lg transition cursor-pointer shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>CONFIRM OFFICIAL IDENTITY</span>
              </button>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="bg-white border border-[#DDE2DC] rounded-xl p-6 shadow-xs space-y-8">
          <div className="space-y-6">
            <div className="border-b border-[#DDE2DC] pb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86] font-bold">
                IDENTITY PARAMETERS (SOURCE OF TRUTH)
              </span>
              {analysisState === 'CONFIRMED' && (
                <span className="font-mono text-[11px] text-[#347653] uppercase font-bold">
                  VERIFIED WITH WEBSITE INTELLIGENCE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Primary Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Domains Allowlist (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDomains}
                  onChange={(e) => setOfficialDomains(e.target.value)}
                  placeholder="e.g. brand.com, brandbank.com, brandmoney.com"
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Telegram / Instagram Handle
                </label>
                <input
                  type="text"
                  value={instagram || telegram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    setTelegram(e.target.value);
                  }}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Mobile App Package ID
                </label>
                <input
                  type="text"
                  value={appPackage}
                  onChange={(e) => setAppPackage(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Authorized Publishers / Developers (Comma-separated)
                </label>
                <input
                  type="text"
                  value={officialDevelopers}
                  onChange={(e) => setOfficialDevelopers(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Monitored Brand Keywords & Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#858D86] font-bold">
                  Official Support Channels (Comma-separated)
                </label>
                <input
                  type="text"
                  value={supportChannels}
                  onChange={(e) => setSupportChannels(e.target.value)}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3.5 py-2 text-[13px] text-[#202723] font-mono focus:border-[#477A60] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#DDE2DC]">
            <span className="text-[12px] text-[#858D86]">
              Parameters establish the authoritative baseline for distance metrics, app developer comparison, and impersonation auditing.
            </span>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#DDE2DC] text-[#202723] text-[13px] font-mono font-bold rounded-lg hover:bg-[#ECEFEC] transition cursor-pointer shadow-xs"
              >
                {saved ? <Check className="h-3.5 w-3.5 text-[#347653]" /> : <Save className="h-3.5 w-3.5" />}
                <span>{saved ? 'SAVED BASELINE' : 'SAVE BASELINE'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartInvestigation}
                disabled={investigationState === 'INVESTIGATING' || investigationState === 'DISCOVERING' || investigationState === 'ANALYZING'}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-mono font-bold rounded-lg transition cursor-pointer disabled:opacity-50 shadow-xs"
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
          <div className="border border-[#DDE2DC] bg-white p-6 rounded-xl space-y-4 font-mono shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DDE2DC] pb-3">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#858D86] font-bold">STATUS:</span>
                <span
                  className={
                    investigationState === 'COMPLETED'
                      ? 'text-[#347653] font-bold'
                      : investigationState === 'ERROR'
                      ? 'text-[#C93643] font-bold'
                      : 'text-[#B7791F] font-bold'
                  }
                >
                  {investigationState}
                </span>
              </div>
              <span className="text-[11px] text-[#858D86]">
                Pipeline: Apple iTunes API • Search Feeds • AI Synthesizer
              </span>
            </div>

            <p className="text-[13px] text-[#202723] leading-relaxed">
              {investigationStatusMessage}
            </p>

            {investigationSummary && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] bg-[#F7F8F6] p-4 rounded-xl border border-[#DDE2DC]">
                  <div>
                    <span className="text-[#858D86] block text-[10px] font-bold uppercase">CANDIDATES</span>
                    <span className="text-[#202723] text-[20px] font-bold">
                      {investigationSummary.candidatesCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#858D86] block text-[10px] font-bold uppercase">ELEVATED / HIGH RISK</span>
                    <span className="text-[#C93643] text-[20px] font-bold">
                      {investigationSummary.highRiskCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#858D86] block text-[10px] font-bold uppercase">PROVIDERS QUERIED</span>
                    <span className="text-[#347653] text-[20px] font-bold">
                      {Object.keys(investigationSummary.providerRuns || {}).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#858D86] block text-[10px] font-bold uppercase">STATUS</span>
                    <span className="text-[#202723] text-[18px] font-bold uppercase">
                      {investigationSummary.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[12px] text-[#626B65]">
                    Results persisted to SAFENET Command Center.
                  </span>
                  <Link
                    href="/overview"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#477A60] hover:text-[#365F49] font-bold"
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
