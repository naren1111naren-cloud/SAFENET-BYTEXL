'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Search,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  FileCode,
  Globe,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
  Terminal,
  Activity,
  ArrowRight,
  X,
  FileText,
  Bookmark,
  BookmarkCheck,
  Copy,
  Download,
  Send,
  Filter,
  Check,
  Shield,
  AlertOctagon,
  HelpCircle,
  ChevronDown,
  Clock,
  History,
  Calendar,
  BarChart2,
  ListFilter,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile } from '@/types/brand';
import {
  NormalizedAppCandidate,
  AppSearchResponse,
  ApkCorrelationReport,
  AppIdentityComparison,
  ThreatLifecycleStatus,
  ThreatHistoryItem,
  AppMonitoringConfig,
  ScanResultSummary,
} from '@/lib/apps/types';

type AppMonitorTab = 'search' | 'apk';
type ThreatStatusFilter =
  | 'ALL'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NEW'
  | 'UNDER REVIEW'
  | 'CONFIRMED'
  | 'RESOLVED'
  | 'WATCHLIST';

type ThreatSortOption = 'severity' | 'confidence' | 'signals' | 'recency';

export default function AppThreatIntelligencePage() {
  const [activeTab, setActiveTab] = useState<AppMonitorTab>('search');

  // Protected Brand Baseline State
  const [currentBrand, setCurrentBrand] = useState<BrandProfile | null>(null);
  const [showBrandSelector, setShowBrandSelector] = useState(false);

  // Monitoring State & Controls
  const [monitoringConfig, setMonitoringConfig] = useState<AppMonitoringConfig>({
    enabled: true,
    schedule: 'daily',
    last_scan: null,
    next_scan: null,
    scan_status: 'idle',
    total_monitored: 0,
    high_critical_count: 0,
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleOption, setScheduleOption] = useState<'daily' | 'twelve_hours' | 'weekly' | 'manual'>('daily');

  // Search & Scan State
  const [searchQuery, setSearchQuery] = useState('PayPal');
  const [searchCountry, setSearchCountry] = useState('in');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResponse, setSearchResponse] = useState<AppSearchResponse | null>(null);
  const [scanSummary, setScanSummary] = useState<ScanResultSummary | null>(null);

  // Persistent Candidates & Threat Inbox State
  const [storedCandidates, setStoredCandidates] = useState<NormalizedAppCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<NormalizedAppCandidate | null>(null);
  const [threatStatusFilter, setThreatStatusFilter] = useState<ThreatStatusFilter>('ALL');
  const [threatSort, setThreatSort] = useState<ThreatSortOption>('severity');

  // Watchlist State (Persisted via BrandStore)
  const [watchlist, setWatchlist] = useState<NormalizedAppCandidate[]>([]);

  // Escalate Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateCandidate, setEscalateCandidate] = useState<NormalizedAppCandidate | null>(null);
  const [escalateReason, setEscalateReason] = useState('Potential brand impersonation');
  const [escalateNotes, setEscalateNotes] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // APK Mode State
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkTargetBrand, setApkTargetBrand] = useState('PayPal');
  const [isAnalyzingApk, setIsAnalyzingApk] = useState(false);
  const [apkError, setApkError] = useState('');
  const [apkReport, setApkReport] = useState<ApkCorrelationReport | null>(null);

  // Initial load
  useEffect(() => {
    const brand = BrandStore.getBrand();
    const activeBrand = (brand && brand.name) ? brand : (PRESET_BRANDS['PayPal'] || PRESET_BRANDS['Nike']);
    setCurrentBrand(activeBrand);
    setSearchQuery(activeBrand.name);
    setApkTargetBrand(activeBrand.name);

    // Load monitoring config & candidates
    const cfg = BrandStore.getAppMonitoringConfig(activeBrand.name);
    setMonitoringConfig(cfg);
    setScheduleOption(cfg.schedule);

    const candidates = BrandStore.getStoredAppCandidates();
    setStoredCandidates(candidates);
    setWatchlist(BrandStore.getAppWatchlist());
  }, []);

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch Protected Brand Target
  const handleSelectBrand = (brandKey: string) => {
    const selected = PRESET_BRANDS[brandKey];
    if (selected) {
      BrandStore.saveBrand(selected);
      setCurrentBrand(selected);
      setSearchQuery(selected.name);
      setApkTargetBrand(selected.name);
      setShowBrandSelector(false);

      const cfg = BrandStore.getAppMonitoringConfig(selected.name);
      setMonitoringConfig(cfg);
      setScheduleOption(cfg.schedule);

      triggerToast(`Protected brand target switched to ${selected.name}`);
    }
  };

  // Toggle Watchlist
  const handleToggleWatchlist = (candidate: NormalizedAppCandidate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyIn = BrandStore.isInAppWatchlist(candidate.package_id || candidate.id);

    if (isCurrentlyIn) {
      BrandStore.removeFromAppWatchlist(candidate.package_id || candidate.id);
      const updatedList = BrandStore.getAppWatchlist();
      setWatchlist(updatedList);
      setStoredCandidates((prev) =>
        prev.map((c) =>
          (c.package_id === candidate.package_id || c.id === candidate.id)
            ? { ...c, watchlisted: false }
            : c
        )
      );
      if (selectedCandidate && (selectedCandidate.package_id === candidate.package_id || selectedCandidate.id === candidate.id)) {
        setSelectedCandidate((prev) => prev ? { ...prev, watchlisted: false } : null);
      }
      triggerToast(`Removed "${candidate.app_name}" from Security Watchlist.`);
    } else {
      BrandStore.addToAppWatchlist(candidate);
      const updatedList = BrandStore.getAppWatchlist();
      setWatchlist(updatedList);
      setStoredCandidates((prev) =>
        prev.map((c) =>
          (c.package_id === candidate.package_id || c.id === candidate.id)
            ? { ...c, watchlisted: true }
            : c
        )
      );
      if (selectedCandidate && (selectedCandidate.package_id === candidate.package_id || selectedCandidate.id === candidate.id)) {
        setSelectedCandidate((prev) => prev ? { ...prev, watchlisted: true } : null);
      }
      triggerToast(`Added "${candidate.app_name}" to Security Watchlist.`);
    }
  };

  // Update Threat Lifecycle Status
  const handleUpdateStatus = (
    candidate: NormalizedAppCandidate,
    newStatus: ThreatLifecycleStatus,
    notes?: string
  ) => {
    const updated = BrandStore.updateAppThreatStatus(candidate.package_id || candidate.id, newStatus, notes);
    if (updated) {
      setStoredCandidates(BrandStore.getStoredAppCandidates());
      if (selectedCandidate && (selectedCandidate.package_id === candidate.package_id || selectedCandidate.id === candidate.id)) {
        setSelectedCandidate(updated);
      }
      triggerToast(`Threat lifecycle status updated to ${newStatus}.`);
    }
  };

  // Save Monitoring Schedule
  const handleSaveSchedule = () => {
    const brandName = currentBrand?.name || 'default';
    const updated = BrandStore.saveAppMonitoringConfig(brandName, {
      schedule: scheduleOption,
      next_scan: scheduleOption === 'daily'
        ? new Date(Date.now() + 86400000).toISOString()
        : scheduleOption === 'twelve_hours'
        ? new Date(Date.now() + 43200000).toISOString()
        : scheduleOption === 'weekly'
        ? new Date(Date.now() + 604800000).toISOString()
        : null,
    });
    setMonitoringConfig(updated);
    setShowScheduleModal(false);
    triggerToast(`App monitoring schedule updated to ${scheduleOption.replace('_', ' ')}.`);
  };

  // Confirm Internal Security Escalation
  const handleConfirmEscalation = () => {
    if (!escalateCandidate) return;
    const updated = BrandStore.escalateAppThreat(
      escalateCandidate.package_id || escalateCandidate.id,
      escalateReason,
      escalateNotes
    );
    if (updated) {
      setStoredCandidates(BrandStore.getStoredAppCandidates());
      if (selectedCandidate && (selectedCandidate.package_id === escalateCandidate.package_id || selectedCandidate.id === escalateCandidate.id)) {
        setSelectedCandidate(updated);
      }
      setShowEscalateModal(false);
      setEscalateNotes('');
      triggerToast(`Threat "${escalateCandidate.app_name}" escalated to internal security operations.`);
    }
  };

  // Export Forensic Report as JSON file
  const handleExportReport = (candidate: NormalizedAppCandidate) => {
    const reportData = {
      investigation_id: `SAFENET-APP-${candidate.id.toUpperCase()}`,
      export_timestamp: new Date().toISOString(),
      platform: 'Google Play Store',
      brand_protected: currentBrand?.name || 'PayPal',
      candidate: {
        app_name: candidate.app_name,
        package_id: candidate.package_id,
        developer: candidate.developer,
        app_url: candidate.app_url,
        first_seen_at: candidate.first_seen_at,
        last_seen_at: candidate.last_seen_at,
        lifecycle_status: candidate.lifecycle_status,
        watchlisted: candidate.watchlisted,
      },
      risk_evaluation: {
        risk_score: candidate.risk_score,
        risk_level: candidate.risk_level,
        confidence: candidate.confidence,
        confidence_score: candidate.confidence_score,
        verdict_summary: candidate.verdict_summary,
        why_flagged: candidate.why_flagged || candidate.evidence,
        risk_breakdown: candidate.risk_breakdown,
        identity_comparison: candidate.identity_comparison,
      },
      audit_history: candidate.threat_history,
      escalation_record: candidate.escalation_record || null,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safenet-threat-${candidate.package_id || candidate.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Forensic investigation report exported successfully.');
  };

  // Copy Evidence to Clipboard
  const handleCopyEvidence = (candidate: NormalizedAppCandidate) => {
    const brief = `
[SAFENET APPLICATION THREAT BRIEF]
Target App: ${candidate.app_name}
Publisher: ${candidate.developer}
Package ID: ${candidate.package_id}
First Seen: ${candidate.first_seen_at || 'Today'}
Last Seen: ${candidate.last_seen_at || 'Today'}
Status: ${candidate.lifecycle_status || 'DISCOVERED'}
Verdict: ${candidate.risk_level} (${candidate.risk_score}/100) — ${candidate.verdict_summary}
Confidence: ${candidate.confidence_score ? `${candidate.confidence_score}%` : candidate.confidence}
Store URL: ${candidate.app_url}

Primary Detections:
${(candidate.why_flagged || candidate.evidence || []).map((e, i) => `${i + 1}. ${e}`).join('\n')}

External Domains: ${(candidate.extracted_domains || []).join(', ') || 'None declared'}
`;
    navigator.clipboard.writeText(brief);
    triggerToast('Evidence brief copied to clipboard.');
  };

  // Execute App Scan
  const handleSearch = async (queryToRun?: string, isMultiScan: boolean = false) => {
    const q = (queryToRun || searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch('/api/apps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          country: searchCountry,
          brandContext: currentBrand || undefined,
          scanVariants: isMultiScan,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Search failed with status ${res.status}`);
      }

      const data: AppSearchResponse = await res.json();
      setSearchResponse(data);

      const { candidates: syncedList, summary } = BrandStore.syncAndDeduplicateCandidates(
        data.candidates,
        q
      );
      setStoredCandidates(syncedList);
      setScanSummary(summary);

      const brandName = currentBrand?.name || q;
      const updatedCfg = BrandStore.saveAppMonitoringConfig(brandName, {
        last_scan: new Date().toISOString(),
        total_monitored: syncedList.length,
        high_critical_count: summary.high_critical_count,
        scan_status: 'completed',
      });
      setMonitoringConfig(updatedCfg);

      triggerToast(`Threat scan complete: ${summary.applications_discovered} discovered, ${summary.high_critical_count} require investigation.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search Google Play.';
      console.error('[App Intelligence] Search error:', msg);
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // APK Upload & Analysis Handler
  const handleApkUpload = async (file: File) => {
    setApkFile(file);
    setIsAnalyzingApk(true);
    setApkError('');
    setApkReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetBrand', apkTargetBrand);

      const res = await fetch('/api/apps/analyze-apk', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `APK analysis failed with status ${res.status}`);
      }

      const data: ApkCorrelationReport = await res.json();
      setApkReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze APK.';
      setApkError(msg);
    } finally {
      setIsAnalyzingApk(false);
    }
  };

  // Sample APK Preset Handler
  const handleLoadSampleApk = async (type: 'trojan' | 'clean') => {
    setIsAnalyzingApk(true);
    setApkError('');
    setApkReport(null);

    try {
      const testPayload =
        type === 'trojan'
          ? generateTestApkBase64(
              'com.paypal.security.verification.support',
              'PayPal Security Support & Refund',
              [
                'android.permission.INTERNET',
                'android.permission.RECEIVE_SMS',
                'android.permission.READ_SMS',
                'android.permission.SYSTEM_ALERT_WINDOW',
              ],
              ['https://paypal-verify-login.xyz/auth', 'https://secure-refund-portal.net/gate']
            )
          : generateTestApkBase64(
              'com.paypal.android.p2pmobile',
              'PayPal',
              ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
              ['https://api.paypal.com/v1']
            );

      const analyzeRes = await fetch('/api/apps/analyze-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apkBase64: testPayload,
          fileName: type === 'trojan' ? 'PayPal_Security_Support_v2.apk' : 'PayPal_Official_Release.apk',
          targetBrand: currentBrand?.name || 'PayPal',
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Sample APK analysis failed.');
      }

      const data: ApkCorrelationReport = await analyzeRes.json();
      setApkReport(data);
    } catch (err: unknown) {
      setApkError(err instanceof Error ? err.message : 'Sample APK analysis error.');
    } finally {
      setIsAnalyzingApk(false);
    }
  };

  // Base list to filter and sort
  const allCandidates = storedCandidates.length > 0 ? storedCandidates : (searchResponse?.candidates || []);

  // Filter candidates logic
  const filteredCandidates = allCandidates.filter((cand) => {
    if (threatStatusFilter === 'ALL') return true;
    if (threatStatusFilter === 'WATCHLIST') return cand.watchlisted || BrandStore.isInAppWatchlist(cand.package_id || cand.id);
    if (threatStatusFilter === 'NEW') return cand.lifecycle_status === 'DISCOVERED';
    if (threatStatusFilter === 'UNDER REVIEW') return cand.lifecycle_status === 'UNDER REVIEW';
    if (threatStatusFilter === 'CONFIRMED') return cand.lifecycle_status === 'CONFIRMED SUSPICIOUS';
    if (threatStatusFilter === 'RESOLVED') return cand.lifecycle_status === 'RESOLVED';
    return cand.risk_level === threatStatusFilter;
  });

  // Sort candidates logic
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (threatSort === 'severity') {
      if (a.is_verified_official && !b.is_verified_official) return 1;
      if (!a.is_verified_official && b.is_verified_official) return -1;
      return b.risk_score - a.risk_score;
    }
    if (threatSort === 'confidence') {
      return (b.confidence_score || 70) - (a.confidence_score || 70);
    }
    if (threatSort === 'signals') {
      const sigA = (a.evidence?.length || 0) + (a.impersonation_patterns_detected?.length || 0);
      const sigB = (b.evidence?.length || 0) + (b.impersonation_patterns_detected?.length || 0);
      return sigB - sigA;
    }
    if (threatSort === 'recency') {
      const timeA = new Date(a.last_seen_at || a.discovered_at || 0).getTime();
      const timeB = new Date(b.last_seen_at || b.discovered_at || 0).getTime();
      return timeB - timeA;
    }
    return 0;
  });

  // Protection Overview Metrics
  const totalMonitoredCount = allCandidates.length;
  const criticalThreatCount = allCandidates.filter((c) => c.risk_level === 'CRITICAL').length;
  const highThreatCount = allCandidates.filter((c) => c.risk_level === 'HIGH').length;
  const highCriticalTotal = criticalThreatCount + highThreatCount;
  const underReviewCount = allCandidates.filter((c) => c.lifecycle_status === 'UNDER REVIEW').length;
  const confirmedSuspiciousCount = allCandidates.filter((c) => c.lifecycle_status === 'CONFIRMED SUSPICIOUS').length;
  const newThreatsCount = allCandidates.filter((c) => c.lifecycle_status === 'DISCOVERED' && !c.is_verified_official).length;
  const resolvedCount = allCandidates.filter((c) => c.lifecycle_status === 'RESOLVED').length;

  return (
    <AppShell
      pageTitle="App Threat Intelligence"
      pageSubtitle="Continuous mobile perimeter surveillance, brand impersonation discovery, and static APK artifact correlation."
      pageEyebrow="Mobile Threat Intelligence"
    >
      <div className="space-y-6 pb-20">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111625] text-white px-4 py-2.5 rounded-xl font-sans text-xs font-medium flex items-center gap-2 shadow-2xl border border-[#1E2638]">
            <Check className="h-4 w-4 text-[#F6821F]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TOP: PROTECTION OVERVIEW METRICS DASHBOARD */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0E131F] border border-[#1E2638] p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#F6821F]" />
              <span className="eyebrow-text text-brand-orange font-semibold">
                PROTECTION OVERVIEW
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-sans">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Last Scan: <span className="data-text text-white font-medium">{monitoringConfig.last_scan ? new Date(monitoringConfig.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today, 14:42'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638]">
              <span className="stat-label text-slate-400 block whitespace-normal sm:whitespace-nowrap">Applications Monitored</span>
              <span className="stat-value text-2xl sm:text-3xl text-white mt-1 block">{totalMonitoredCount}</span>
            </div>
            <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638]">
              <span className="stat-label text-slate-300 block whitespace-normal sm:whitespace-nowrap">New Threats</span>
              <span className="stat-value text-2xl sm:text-3xl text-white mt-1 block">{newThreatsCount}</span>
            </div>
            <div className="bg-[#2D1216] p-3.5 rounded-xl border border-rose-500/30">
              <span className="stat-label text-rose-400 block whitespace-normal sm:whitespace-nowrap">High / Critical</span>
              <span className="stat-value text-2xl sm:text-3xl text-rose-400 mt-1 block">{highCriticalTotal}</span>
            </div>
            <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638]">
              <span className="stat-label text-amber-300 block whitespace-normal sm:whitespace-nowrap">Under Review</span>
              <span className="stat-value text-2xl sm:text-3xl text-amber-300 mt-1 block">{underReviewCount}</span>
            </div>
            <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638]">
              <span className="stat-label text-pink-300 block whitespace-normal sm:whitespace-nowrap">Confirmed Suspicious</span>
              <span className="stat-value text-2xl sm:text-3xl text-pink-300 mt-1 block">{confirmedSuspiciousCount}</span>
            </div>
            <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638]">
              <span className="stat-label text-emerald-400 block whitespace-normal sm:whitespace-nowrap">Resolved</span>
              <span className="stat-value text-2xl sm:text-3xl text-emerald-400 mt-1 block">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: PROTECTED BRAND & MONITORING STATUS & CONTROLS */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Protected Brand Baseline */}
          <div className="lg:col-span-2 bg-[#0E131F] border border-[#1E2638] p-5 sm:p-6 rounded-2xl shadow-xl relative flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Shield className="h-4 w-4 text-[#F6821F]" />
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    PROTECTED BRAND TARGET
                  </span>
                  <span className="font-mono text-xs bg-[#347653]/10 text-[#F6821F] px-2.5 py-0.5 rounded-full border border-[#F6821F]/40 font-semibold">
                    VERIFIED BASELINE
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBrandSelector(!showBrandSelector)}
                    className="button-text px-3 py-1.5 bg-[#111625] border border-[#1E2638] text-slate-200 text-xs rounded-xl hover:bg-[#161D2F] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Change ({currentBrand?.name})</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {showBrandSelector && (
                    <div className="absolute right-0 top-9 z-40 w-56 bg-[#0E131F] border border-[#1E2638] shadow-2xl rounded-2xl p-1.5 font-sans text-xs">
                      <div className="px-3 py-1.5 eyebrow-text text-slate-400 border-b border-[#1E2638]">
                        SELECT AUTHORITATIVE BRAND
                      </div>
                      {Object.keys(PRESET_BRANDS).map((bKey) => (
                        <button
                          key={bKey}
                          type="button"
                          onClick={() => handleSelectBrand(bKey)}
                          className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#111625] rounded-xl flex items-center justify-between cursor-pointer"
                        >
                          <span>{bKey}</span>
                          {currentBrand?.name === bKey && (
                            <Check className="h-3.5 w-3.5 text-[#F6821F]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <h2 className="section-title text-white">
                  {currentBrand?.name || 'PayPal'}
                </h2>
                <span className="small-text text-slate-400">
                  Official Domain: <span className="data-text text-[#F6821F] font-medium">{currentBrand?.domain || 'paypal.com'}</span>
                </span>
                {currentBrand?.officialDevelopers && currentBrand.officialDevelopers.length > 0 ? (
                  <span className="small-text text-slate-400">
                    · Publisher: <span className="text-white font-medium">{currentBrand.officialDevelopers[0]}</span>
                  </span>
                ) : (
                  <span className="small-text font-mono text-amber-400">
                    (Official identity partially verified)
                  </span>
                )}
                {currentBrand?.appPackageName && (
                  <span className="hidden sm:inline data-text text-xs text-slate-400">
                    · Pkg: {currentBrand.appPackageName}
                  </span>
                )}
              </div>

              <p className="body-text text-xs sm:text-sm text-slate-300 pt-1">
                SAFENET protects this organization from brand impersonation, deceptive app look-alikes, publisher spoofing, and malicious credential phishing across Android application perimeters.
              </p>
            </div>
          </div>

          {/* Monitoring Status & Controls Box */}
          <div className="bg-[#0E131F] border border-[#1E2638] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="eyebrow-text text-slate-400">
                  APP MONITORING
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#F6821F] bg-[#347653]/10 px-2.5 py-0.5 rounded-full border border-[#F6821F]/40 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F6821F] animate-pulse" />
                  ACTIVE
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div>Platform: <span className="font-sans text-white font-medium">Google Play Store</span></div>
                <div>Schedule: <span className="data-text text-white font-medium uppercase">{monitoringConfig.schedule.replace('_', ' ')}</span></div>
                <div>Last scan: <span className="data-text text-white">{monitoringConfig.last_scan ? new Date(monitoringConfig.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today, 14:42'}</span></div>
                <div>Discovered: <span className="data-text text-white">{totalMonitoredCount}</span> · High/Critical: <span className="data-text text-rose-400 font-semibold">{highCriticalTotal}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSearch(undefined, true)}
                disabled={isSearching}
                className="button-text flex-1 px-4 py-2.5 bg-[#F6821F] text-[#080B11] font-semibold hover:bg-[#2EB8A5] text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Run Scan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="button-text px-3.5 py-2.5 bg-[#111625] border border-[#1E2638] hover:bg-[#161D2F] text-slate-300 hover:text-white text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Configure monitoring frequency"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SCAN RESULTS SUMMARY BANNER */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {scanSummary && (
          <div className="bg-[#0F2620] border border-[#F6821F]/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 small-text text-slate-300 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#F6821F] shrink-0" />
              <div>
                <span className="eyebrow-text text-[#F6821F] block mb-0.5">
                  SCAN COMPLETE · PERIMETER DISCOVERY UPDATED
                </span>
                <span className="text-slate-300 text-xs">
                  Discovered {scanSummary.applications_discovered} listings ({scanSummary.new_candidates} new candidates, {scanSummary.existing_candidates} refreshed) · {scanSummary.high_critical_count} high-risk · {scanSummary.new_domains_count} external domains correlated.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('threat-inbox-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 bg-[#0E131F] text-[#F6821F] border border-[#F6821F]/40 rounded-lg hover:bg-[#111625] transition button-text flex items-center gap-1.5 shrink-0"
            >
              <span>VIEW THREAT INBOX</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (Search vs APK) */}
        <div className="flex items-center gap-6 border-b border-[#1E2638] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 pb-3 font-sans text-xs tracking-wider uppercase font-semibold transition relative ${
              activeTab === 'search' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>1. APP THREAT DISCOVERY & INBOX</span>
            {activeTab === 'search' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F6821F] rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-2 pb-3 font-sans text-xs tracking-wider uppercase font-semibold transition relative ${
              activeTab === 'apk' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>2. STATIC APK ARTIFACT INSPECTION</span>
            {activeTab === 'apk' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F6821F] rounded-t-sm" />
            )}
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* MODE 1: SEARCH & THREAT INBOX */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Input Bar */}
            <div className="bg-[#0E131F] border border-[#1E2638] p-5 rounded-xl space-y-4 shadow-xs">
              <div className="space-y-1">
                <span className="eyebrow-text text-[#F6821F] block">
                  PERIMETER DISCOVERY QUERY
                </span>
                <p className="small-text text-slate-400">
                  Query public Google Play store listings via SerpApi to discover potential brand impersonators, unauthorized publishers, and deceptive look-alikes.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-3 pt-1"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter brand name, company, or application keyword (e.g. PayPal, Microsoft, Paytm)..."
                    className="w-full bg-[#111625] border border-[#1E2638] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F6821F]/60 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="bg-[#0E131F] border border-[#1E2638] text-slate-300 small-text rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F6821F]/60"
                  >
                    <option value="in">Region: India (gl=in)</option>
                    <option value="us">Region: United States (gl=us)</option>
                    <option value="gb">Region: United Kingdom (gl=gb)</option>
                    <option value="global">Region: Global</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text font-semibold rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>SCANNING PERIMETER...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>DISCOVER THREATS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Fast Triage Quick-Picks */}
              <div className="flex flex-wrap items-center gap-2 pt-1 small-text text-slate-400">
                <span className="eyebrow-text text-slate-500">FAST TRIAGE EXAMPLES:</span>
                {['PayPal', 'Microsoft', 'WhatsApp', 'Paytm', 'Nike'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setSearchQuery(ex);
                      handleSearch(ex);
                    }}
                    className="text-xs text-slate-400 hover:text-[#F6821F] transition underline underline-offset-2"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="border border-[#FF5C6C]/40 bg-[#2D1216] p-4 rounded-xl flex items-start gap-3 small-text text-[#FF5C6C]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block uppercase">Search Request Error</span>
                  <span className="text-slate-300">{searchError}</span>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* THREAT INBOX */}
            {/* ═════════════════════════════════════════════════════════════ */}
            <div id="threat-inbox-section" className="bg-[#0E131F] border border-[#1E2638] p-5 rounded-xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-[#F6821F]" />
                    <h3 className="section-title text-white">
                      THREAT INBOX
                    </h3>
                  </div>
                  <p className="small-text text-slate-400">
                    Prioritized queue of discovered applications targeting the protected brand perimeter.
                  </p>
                </div>

                {/* Counter Breakdown */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 bg-[#2D1216] border border-[#FF5C6C]/40 text-[#FF5C6C] rounded-md font-semibold">
                    CRITICAL: <span className="tabular-nums font-bold">{criticalThreatCount}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] rounded-md font-semibold">
                    HIGH: <span className="tabular-nums font-bold">{highThreatCount}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] rounded-md font-semibold">
                    MEDIUM: <span className="tabular-nums font-bold">{allCandidates.filter((c) => c.risk_level === 'MEDIUM').length}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-[#161D2F] border border-[#1E2638] text-slate-400 rounded-md font-medium">
                    REVIEW: <span className="tabular-nums font-bold">{underReviewCount}</span>
                  </span>
                </div>
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="eyebrow-text text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> FILTER:
                  </span>
                  {(
                    [
                      { key: 'ALL', label: `ALL (${allCandidates.length})` },
                      { key: 'CRITICAL', label: `CRITICAL (${criticalThreatCount})` },
                      { key: 'HIGH', label: `HIGH (${highThreatCount})` },
                      { key: 'MEDIUM', label: `MEDIUM (${allCandidates.filter((c) => c.risk_level === 'MEDIUM').length})` },
                      { key: 'LOW', label: `LOW (${allCandidates.filter((c) => c.risk_level === 'LOW').length})` },
                      { key: 'NEW', label: `NEW (${newThreatsCount})` },
                      { key: 'UNDER REVIEW', label: `REVIEW (${underReviewCount})` },
                      { key: 'CONFIRMED', label: `CONFIRMED (${confirmedSuspiciousCount})` },
                      { key: 'RESOLVED', label: `RESOLVED (${resolvedCount})` },
                      { key: 'WATCHLIST', label: `WATCHLIST (${watchlist.length})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setThreatStatusFilter(f.key)}
                      className={`px-2.5 py-1 rounded-md transition font-sans text-xs uppercase font-medium ${
                        threatStatusFilter === f.key
                          ? 'bg-[#111625] text-white font-semibold border border-[#F6821F]/40'
                          : 'bg-[#0E131F] text-slate-400 hover:text-white border border-[#1E2638]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  <span className="eyebrow-text text-slate-400">SORT:</span>
                  <select
                    value={threatSort}
                    onChange={(e) => setThreatSort(e.target.value as ThreatSortOption)}
                    className="bg-[#0E131F] border border-[#1E2638] text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#F6821F]/60"
                  >
                    <option value="severity">Severity (Highest Risk First)</option>
                    <option value="confidence">Confidence (Highest First)</option>
                    <option value="signals">Supporting Signals (Most First)</option>
                    <option value="recency">Recency (Newest First)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* THREAT INBOX LISTINGS */}
            {/* ═════════════════════════════════════════════════════════════ */}
            {sortedCandidates.length > 0 ? (
              <div className="space-y-3">
                {sortedCandidates.map((cand) => {
                  const isWatchlisted = watchlist.some(
                    (w) => w.package_id === cand.package_id || w.id === cand.id
                  );

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className={`bg-[#0E131F] border transition-all p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative shadow-xs hover:shadow-sm ${
                        cand.is_verified_official
                          ? 'border-[#F6821F]/40 hover:border-[#F6821F]/60'
                          : cand.risk_level === 'CRITICAL'
                          ? 'border-[#FF5C6C]/40 hover:border-[#FF5C6C]/60 bg-[#C93643]/[0.02]'
                          : cand.risk_level === 'HIGH'
                          ? 'border-[#FFAB40]/40 hover:border-[#FFAB40]/60'
                          : cand.risk_level === 'MEDIUM'
                          ? 'border-[#FFAB40]/40 hover:border-[#FFAB40]/60'
                          : 'border-[#1E2638] hover:border-[#F6821F]/40'
                      }`}
                    >
                      {/* Left: App Identity */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {cand.icon ? (
                          <img
                            src={cand.icon}
                            alt={cand.app_name}
                            className="h-12 w-12 rounded-lg object-cover bg-[#111625] border border-[#1E2638] shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-[#111625] border border-[#1E2638] flex items-center justify-center shrink-0">
                            <Smartphone className="h-5 w-5 text-slate-400" />
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="card-title text-white truncate max-w-md">
                              {cand.app_name}
                            </h4>

                            {cand.is_verified_official ? (
                              <span className="eyebrow-text bg-[#347653]/10 text-[#F6821F] border border-[#F6821F]/40 px-2 py-0.5 rounded font-bold">
                                ✓ VERIFIED OFFICIAL APP
                              </span>
                            ) : cand.risk_level === 'CRITICAL' || cand.risk_level === 'HIGH' ? (
                              <span className="eyebrow-text bg-[#2D1216] text-[#FF5C6C] border border-[#FF5C6C]/40 px-2 py-0.5 rounded font-bold">
                                ⚠ POTENTIAL IMPERSONATION
                              </span>
                            ) : (
                              <span className="eyebrow-text bg-[#161D2F] text-slate-400 px-2 py-0.5 rounded font-medium">
                                THIRD-PARTY LISTING
                              </span>
                            )}

                            {/* Lifecycle Status Badge */}
                            <span
                              className={`eyebrow-text px-2 py-0.5 rounded font-bold border ${
                                cand.lifecycle_status === 'ESCALATED'
                                  ? 'bg-[#C93643]/15 text-[#FF5C6C] border-[#FF5C6C]/40'
                                  : cand.lifecycle_status === 'CONFIRMED SUSPICIOUS'
                                  ? 'bg-[#D95F36]/15 text-[#FFAB40] border-[#FFAB40]/40'
                                  : cand.lifecycle_status === 'UNDER REVIEW'
                                  ? 'bg-[#B7791F]/15 text-[#FFAB40] border-[#FFAB40]/40'
                                  : cand.lifecycle_status === 'RESOLVED'
                                  ? 'bg-[#347653]/10 text-[#F6821F] border-[#F6821F]/40'
                                  : 'bg-[#161D2F] text-slate-400 border-[#1E2638]'
                              }`}
                            >
                              {cand.lifecycle_status || 'DISCOVERED'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span>
                              Developer: <span className="text-slate-200 font-medium">{cand.developer || 'Unknown'}</span>
                            </span>
                            {cand.package_id && (
                              <span>
                                · Pkg: <span className="data-text text-slate-300">{cand.package_id}</span>
                              </span>
                            )}
                            {cand.installs && (
                              <span>
                                · Installs: <span className="text-slate-200 font-medium">{cand.installs}</span>
                              </span>
                            )}
                            {cand.rating !== undefined && (
                              <span>
                                · Rating: <span className="text-amber-400 font-semibold">{cand.rating}★</span>
                              </span>
                            )}
                            <span className="text-slate-400">
                              · First seen: <span className="font-mono text-slate-300">{cand.first_seen_at ? cand.first_seen_at.slice(0, 10) : 'Today'}</span>
                            </span>
                          </div>

                          {/* Primary Threat Detection Signal */}
                          <div className="text-xs text-slate-300 line-clamp-1 pt-0.5">
                            <span className="eyebrow-text text-slate-400">DETECTION: </span>
                            {cand.why_flagged && cand.why_flagged.length > 0 ? (
                              <span className="text-slate-200">{cand.why_flagged[0]}</span>
                            ) : cand.evidence && cand.evidence.length > 0 ? (
                              <span className="text-slate-200">{cand.evidence[0]}</span>
                            ) : (
                              <span className="text-slate-400">Evaluated against protected brand perimeter</span>
                            )}
                          </div>

                          {/* Signal Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {cand.risk_breakdown?.name_similarity > 0 && (
                              <span className="eyebrow-text bg-[#161D2F] text-slate-300 px-2 py-0.5 rounded border border-[#1E2638]">
                                Name Sim ({cand.risk_breakdown.name_similarity}/20)
                              </span>
                            )}
                            {cand.risk_breakdown?.developer_mismatch > 0 && (
                              <span className="eyebrow-text bg-[#2D1216] text-[#FF5C6C] px-2 py-0.5 rounded border border-[#FF5C6C]/40 font-semibold">
                                Developer Mismatch
                              </span>
                            )}
                            {cand.risk_breakdown?.logo_similarity > 0 && (
                              <span className="eyebrow-text bg-[#2C1C0D] text-[#FFAB40] px-2 py-0.5 rounded border border-[#FFAB40]/40 font-semibold">
                                Logo Resemblance
                              </span>
                            )}
                            {cand.extracted_domains && cand.extracted_domains.length > 0 && (
                              <span className="eyebrow-text bg-[#0F2620] text-[#F6821F] px-2 py-0.5 rounded border border-[#F6821F]/40 font-semibold">
                                Domain Correlated ({cand.extracted_domains[0]})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Risk Verdict & Action Buttons */}
                      <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1E2638]">
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="eyebrow-text text-slate-400">Risk</span>
                            <span
                              className={`data-text text-sm font-bold ${
                                cand.risk_level === 'CRITICAL'
                                  ? 'text-[#FF5C6C]'
                                  : cand.risk_level === 'HIGH'
                                  ? 'text-[#FFAB40]'
                                  : cand.risk_level === 'MEDIUM'
                                  ? 'text-[#FFAB40]'
                                  : 'text-[#F6821F]'
                              }`}
                            >
                              {cand.risk_score} / 100
                            </span>
                          </div>

                          <div className="text-xs text-slate-400">
                            Confidence: <span className="text-slate-200 font-semibold">{cand.confidence_score ? `${cand.confidence_score}%` : cand.confidence}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleWatchlist(cand, e)}
                            className={`p-2 rounded-lg border transition ${
                              isWatchlisted
                                ? 'bg-[#0F2620] border-[#F6821F]/40 text-[#F6821F]'
                                : 'bg-[#0E131F] border-[#1E2638] text-slate-400 hover:text-white'
                            }`}
                            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            {isWatchlisted ? (
                              <BookmarkCheck className="h-4 w-4" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEscalateCandidate(cand);
                              setShowEscalateModal(true);
                            }}
                            className="p-2 rounded-lg border border-[#1E2638] bg-[#0E131F] text-slate-400 hover:text-[#FF5C6C] hover:border-[#FF5C6C]/40 transition"
                            title="Escalate Threat"
                          >
                            <Send className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className="px-3 py-1.5 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] rounded-lg transition flex items-center gap-1 button-text font-semibold shadow-xs"
                          >
                            <span>INVESTIGATE</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Safe State / Empty State */
              <div className="bg-[#0E131F] border border-[#1E2638] p-12 text-center rounded-xl space-y-3 shadow-xs">
                <ShieldCheck className="h-10 w-10 text-[#F6821F] mx-auto opacity-80" />
                <div className="space-y-1">
                  <h4 className="card-title text-white">
                    NO SIGNIFICANT THREATS IDENTIFIED
                  </h4>
                  <p className="small-text text-slate-400 max-w-md mx-auto leading-relaxed">
                    SAFENET did not identify applications with sufficient impersonation signals for this brand in the current search.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* MODE 2: APK STATIC ANALYSIS */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'apk' && (
          <div className="space-y-6">
            <div className="bg-[#0E131F] border border-[#1E2638] p-5 rounded-xl space-y-4 shadow-xs">
              <div className="space-y-1">
                <span className="eyebrow-text text-[#F6821F] block">
                  ANDROID APK STATIC CORRELATION ENGINE
                </span>
                <p className="small-text text-slate-400">
                  Inspect untrusted Android application packages (.apk) to decompile manifests, detect sensitive capabilities, extract hardcoded URLs, and correlate with Google Play listings.
                </p>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-[#1E2638] hover:border-[#F6821F]/40 p-8 rounded-xl text-center space-y-3 bg-[#111625] transition">
                <Upload className="h-8 w-8 text-[#F6821F] mx-auto" />
                <div className="space-y-1">
                  <p className="card-title text-white">Drag & drop Android APK file here</p>
                  <p className="small-text text-slate-400">Static manifest inspection, signature check & DEX domain correlation</p>
                </div>

                <div>
                  <label className="inline-block px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-white button-text font-semibold rounded-lg hover:bg-[#161D2F] transition cursor-pointer shadow-xs">
                    <span>Browse APK File</span>
                    <input
                      type="file"
                      accept=".apk"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleApkUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1E2638] text-xs text-slate-400">
                <span className="eyebrow-text text-slate-400">NO APK ON HAND? TEST SAMPLE PAYLOADS:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleApk('trojan')}
                    className="px-3 py-1.5 rounded-lg bg-[#2D1216] border border-[#FF5C6C]/40 text-[#FF5C6C] hover:bg-[#C93643]/20 transition button-text font-semibold"
                  >
                    Simulate Rogue Trojan APK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleApk('clean')}
                    className="px-3 py-1.5 rounded-lg bg-[#347653]/10 border border-[#F6821F]/40 text-[#F6821F] hover:bg-[#347653]/20 transition button-text font-semibold"
                  >
                    Simulate Clean Release APK
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Loading Spinner */}
            {isAnalyzingApk && (
              <div className="bg-[#0E131F] border border-[#1E2638] p-8 rounded-xl text-center space-y-2 shadow-xs">
                <RefreshCw className="h-6 w-6 text-[#F6821F] animate-spin mx-auto" />
                <p className="card-title text-white">
                  Decompressing APK structure & parsing binary AndroidManifest...
                </p>
                <p className="small-text text-slate-400">
                  Extracting permissions, cryptographic hashes, and embedded C2 domains.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {apkError && (
              <div className="border border-[#FF5C6C]/40 bg-[#2D1216] p-4 rounded-xl flex items-start gap-3 small-text text-[#FF5C6C]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block uppercase">APK Analysis Error</span>
                  <span className="text-slate-300">{apkError}</span>
                </div>
              </div>
            )}

            {/* Full APK Correlation Report */}
            {apkReport && (
              <div className="bg-[#0E131F] border border-[#1E2638] p-6 rounded-xl space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2638] pb-4">
                  <div className="space-y-1">
                    <span className="eyebrow-text text-slate-400 block">
                      STATIC ARTIFACT REPORT
                    </span>
                    <h3 className="section-title text-white flex items-center gap-2">
                      <span>{apkReport.apk.application_label}</span>
                      <span className="data-text text-xs text-slate-400 font-normal">({apkReport.apk.file_name})</span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="eyebrow-text text-slate-400 block">COMBINED THREAT LEVEL</span>
                    <div className="flex items-center gap-2 justify-end">
                      <span
                        className={`stat-value text-2xl ${
                          apkReport.combined_risk_level === 'CRITICAL'
                            ? 'text-[#FF5C6C]'
                            : apkReport.combined_risk_level === 'HIGH'
                            ? 'text-[#FFAB40]'
                            : apkReport.combined_risk_level === 'MEDIUM'
                            ? 'text-[#FFAB40]'
                            : 'text-[#F6821F]'
                        }`}
                      >
                        {apkReport.combined_risk_level}
                      </span>
                      <span className="data-text text-sm text-slate-400">
                        ({apkReport.combined_risk_score} / 100)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div className="space-y-2">
                  <span className="eyebrow-text text-[#F6821F] block">
                    ANDROID PERMISSIONS & SENSITIVE CAPABILITIES
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {apkReport.apk.permissions.sensitive.map((perm, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111625] p-3 rounded-lg border border-[#FF5C6C]/40 flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-[#FF5C6C] shrink-0 mt-0.5" />
                        <div>
                          <span className="data-text text-xs text-white block">{perm.permission}</span>
                          <span className="small-text text-slate-400 text-xs">{perm.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Embedded Network Domains */}
                {apkReport.apk.extracted_domains.length > 0 && (
                  <div className="space-y-2">
                    <span className="eyebrow-text text-[#F6821F] block">
                      EXTRACTED EMBEDDED NETWORK ENDPOINTS
                    </span>
                    <div className="bg-[#111625] p-3.5 rounded-lg border border-[#1E2638] text-xs space-y-1">
                      {apkReport.apk.extracted_domains.map((dom, i) => (
                        <div key={i} className="flex items-center justify-between text-slate-400">
                          <span className="data-text text-slate-200">{dom}</span>
                          <span className="eyebrow-text text-slate-500">Correlated with URL Intelligence</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* INVESTIGATION VIEW MODAL */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 bg-[#080B11]/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-[#1E2638] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl space-y-6 text-white relative shadow-xl">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-[#111625] border border-[#1E2638] rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Investigation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1E2638] pb-4 pr-8">
                <div className="flex items-start gap-3.5">
                  {selectedCandidate.icon ? (
                    <img
                      src={selectedCandidate.icon}
                      alt={selectedCandidate.app_name}
                      className="h-14 w-14 rounded-xl object-cover bg-[#111625] border border-[#1E2638] shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center shrink-0">
                      <Smartphone className="h-6 w-6 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="eyebrow-text text-[#F6821F] block">
                      APPLICATION INVESTIGATION WORKSPACE
                    </span>
                    <h3 className="section-title text-white leading-tight">
                      {selectedCandidate.app_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                      <span>Publisher: <span className="text-slate-200 font-semibold">{selectedCandidate.developer}</span></span>
                      <span>Pkg: <span className="data-text text-slate-300">{selectedCandidate.package_id}</span></span>
                      <span>First Seen: <span className="data-text text-slate-300">{selectedCandidate.first_seen_at ? selectedCandidate.first_seen_at.slice(0, 10) : 'Today'}</span></span>
                      <span>Last Seen: <span className="data-text text-slate-300">{selectedCandidate.last_seen_at ? selectedCandidate.last_seen_at.slice(0, 10) : 'Today'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="eyebrow-text text-slate-400 block">THREAT VERDICT</span>
                  <div className="flex items-center gap-2 justify-end">
                    <span
                      className={`stat-value text-2xl ${
                        selectedCandidate.risk_level === 'CRITICAL'
                          ? 'text-[#FF5C6C]'
                          : selectedCandidate.risk_level === 'HIGH'
                          ? 'text-[#FFAB40]'
                          : selectedCandidate.risk_level === 'MEDIUM'
                          ? 'text-[#FFAB40]'
                          : 'text-[#F6821F]'
                      }`}
                    >
                      {selectedCandidate.risk_level}
                    </span>
                    <span className="data-text text-sm text-slate-400">
                      ({selectedCandidate.risk_score} / 100)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Confidence: <span className="text-slate-200 font-semibold">{selectedCandidate.confidence_score ? `${selectedCandidate.confidence_score}%` : selectedCandidate.confidence}</span>
                  </span>
                </div>
              </div>

              {/* Threat Lifecycle Selector & Quick Actions */}
              <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="eyebrow-text text-slate-400">LIFECYCLE STATUS:</span>
                  <select
                    value={selectedCandidate.lifecycle_status || 'DISCOVERED'}
                    onChange={(e) => handleUpdateStatus(selectedCandidate, e.target.value as ThreatLifecycleStatus)}
                    className="bg-[#0E131F] border border-[#1E2638] text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#F6821F]/60"
                  >
                    <option value="DISCOVERED">DISCOVERED</option>
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="CONFIRMED SUSPICIOUS">CONFIRMED SUSPICIOUS</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWatchlist(selectedCandidate)}
                    className="px-3 py-1.5 bg-[#0E131F] border border-[#1E2638] text-white hover:bg-[#161D2F] rounded-lg flex items-center gap-1.5 button-text transition"
                  >
                    {selectedCandidate.watchlisted || BrandStore.isInAppWatchlist(selectedCandidate.package_id || selectedCandidate.id) ? (
                      <>
                        <BookmarkCheck className="h-3.5 w-3.5 text-[#F6821F]" />
                        <span>WATCHLISTED</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                        <span>ADD TO WATCHLIST</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyEvidence(selectedCandidate)}
                    className="px-3 py-1.5 bg-[#0E131F] border border-[#1E2638] text-white hover:bg-[#161D2F] rounded-lg flex items-center gap-1.5 button-text transition"
                  >
                    <Copy className="h-3 w-3" />
                    <span>COPY EVIDENCE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportReport(selectedCandidate)}
                    className="px-3 py-1.5 bg-[#0F2620] border border-[#F6821F]/40 text-[#F6821F] hover:bg-[#F6821F] hover:text-[#080B11] rounded-lg flex items-center gap-1.5 button-text font-semibold transition"
                  >
                    <Download className="h-3 w-3" />
                    <span>EXPORT INVESTIGATION</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEscalateCandidate(selectedCandidate);
                      setShowEscalateModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#2D1216] border border-[#FF5C6C]/40 text-[#FF5C6C] hover:bg-[#C93643] hover:text-white rounded-lg flex items-center gap-1.5 button-text font-semibold transition"
                  >
                    <Send className="h-3 w-3" />
                    <span>ESCALATE THREAT</span>
                  </button>
                </div>
              </div>

              {/* Escalation Record */}
              {selectedCandidate.escalation_record && (
                <div className="bg-[#2D1216] border border-[#FF5C6C]/40 p-3.5 rounded-xl small-text space-y-1">
                  <div className="flex items-center gap-2 text-[#FF5C6C] font-semibold">
                    <AlertOctagon className="h-4 w-4" />
                    <span>INTERNAL SECURITY ESCALATION ACTIVE</span>
                  </div>
                  <div className="text-slate-300 text-xs">
                    Reason: <span className="text-white font-medium">{selectedCandidate.escalation_record.reason}</span> · Escalated at: <span className="data-text text-slate-300">{selectedCandidate.escalation_record.timestamp.slice(0, 16)}</span> · Evidence prepared for external reporting.
                  </div>
                </div>
              )}

              {/* 6-VECTOR IDENTITY COMPARISON TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="eyebrow-text text-[#F6821F] block">
                    IDENTITY COMPARISON MATRIX (OFFICIAL vs CANDIDATE)
                  </span>
                  <span className="eyebrow-text text-slate-400">
                    ✓ MATCH · ⚠ SIMILAR · 🚨 MISMATCH
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#1E2638] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#111625] text-slate-400 border-b border-[#1E2638]">
                        <th className="table-header-text p-3">EVALUATION VECTOR</th>
                        <th className="table-header-text p-3">OFFICIAL BASELINE</th>
                        <th className="table-header-text p-3">CANDIDATE LISTING</th>
                        <th className="table-header-text p-3 text-center">SIGNAL STATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2638]">
                      {/* 1. App Name */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">App Name</td>
                        <td className="p-3 text-white font-medium">
                          {selectedCandidate.identity_comparison?.app_name.official || currentBrand?.name || 'PayPal'}
                        </td>
                        <td className="p-3 text-white font-medium">{selectedCandidate.app_name}</td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.app_name.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.app_name.status === 'SIMILAR' ? (
                            <span className="eyebrow-text text-[#FFAB40]">⚠ SIMILAR</span>
                          ) : (
                            <span className="eyebrow-text text-[#FF5C6C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 2. Developer */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">Developer / Publisher</td>
                        <td className="p-3 text-white font-medium">
                          {selectedCandidate.identity_comparison?.developer.official || 'Verified Brand Entity'}
                        </td>
                        <td className="p-3 text-white font-medium">{selectedCandidate.developer}</td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.developer.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.developer.status === 'SIMILAR' ? (
                            <span className="eyebrow-text text-[#FFAB40]">⚠ SIMILAR</span>
                          ) : (
                            <span className="eyebrow-text text-[#FF5C6C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 3. Logo / Icon */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">Brand Logo / Artwork</td>
                        <td className="p-3 text-white font-medium">Verified Official Asset</td>
                        <td className="p-3 text-slate-400">
                          {selectedCandidate.logo_similarity_status || 'Perceptual inspection'}
                        </td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.logo.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.logo.status === 'SIMILAR' ? (
                            <span className="eyebrow-text text-[#FFAB40]">⚠ SIMILAR</span>
                          ) : (
                            <span className="eyebrow-text text-[#FF5C6C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 4. Package ID */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">Package Identifier</td>
                        <td className="p-3 data-text text-slate-300">
                          {selectedCandidate.identity_comparison?.package_id.official || 'Authorized Namespace'}
                        </td>
                        <td className="p-3 data-text text-slate-200">{selectedCandidate.package_id}</td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.package_id.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.package_id.status === 'SIMILAR' ? (
                            <span className="eyebrow-text text-[#FFAB40]">⚠ SIMILAR (Combosquat)</span>
                          ) : (
                            <span className="eyebrow-text text-[#FF5C6C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 5. Description */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">Description Branding</td>
                        <td className="p-3 text-white font-medium">Authorized Corporate Copy</td>
                        <td className="p-3 text-slate-400">
                          {selectedCandidate.description
                            ? selectedCandidate.description.slice(0, 70) + '...'
                            : 'No description'}
                        </td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.description.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.description.status === 'SIMILAR' ? (
                            <span className="eyebrow-text text-[#FFAB40]">⚠ SIMILAR</span>
                          ) : (
                            <span className="eyebrow-text text-slate-500">STANDARD</span>
                          )}
                        </td>
                      </tr>

                      {/* 6. External Domain */}
                      <tr className="hover:bg-[#111625]">
                        <td className="p-3 text-slate-400 font-medium font-sans">Associated Web Domain</td>
                        <td className="p-3 data-text text-slate-300">{currentBrand?.domain || 'paypal.com'}</td>
                        <td className="p-3 data-text text-slate-200">
                          {selectedCandidate.extracted_domains && selectedCandidate.extracted_domains.length > 0
                            ? selectedCandidate.extracted_domains.join(', ')
                            : 'None declared in listing'}
                        </td>
                        <td className="p-3 text-center">
                          {selectedCandidate.identity_comparison?.domain.status === 'MATCH' ? (
                            <span className="eyebrow-text text-[#F6821F]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.domain.status === 'MISMATCH' ? (
                            <span className="eyebrow-text text-[#FF5C6C]">🚨 MISMATCH</span>
                          ) : (
                            <span className="eyebrow-text text-slate-500">? NONE</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* "WHY DID SAFENET FLAG THIS APPLICATION" */}
              <div className="bg-[#111625] p-4 rounded-xl border border-[#1E2638] space-y-2">
                <span className="eyebrow-text text-[#F6821F] block">
                  WHY SAFENET FLAGGED THIS APPLICATION
                </span>
                <div className="space-y-1.5 text-xs text-slate-200">
                  {(selectedCandidate.why_flagged || selectedCandidate.evidence || []).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#F6821F] font-mono">{idx + 1}.</span>
                      <p className="leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETERMINISTIC RISK CALCULATION METHODOLOGY */}
              <div className="space-y-2">
                <span className="eyebrow-text text-slate-400 block">
                  DETERMINISTIC RISK CALCULATION METHODOLOGY (0 – 100)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">NAME SIMILARITY</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.name_similarity ?? 0} / 20
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">LOGO SIMILARITY</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.logo_similarity ?? 0} / 20
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">DEV MISMATCH</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.developer_mismatch ?? 0} / 15
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">DESCRIPTION LURES</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.description_similarity ?? 0} / 15
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">PKG COMBOSQUAT</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.package_similarity ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">IDENTITY MISMATCH</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.identity_mismatch ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#111625] p-2.5 rounded-lg border border-[#1E2638]">
                    <span className="eyebrow-text text-slate-400 block mb-1">SUSPICIOUS SIGNALS</span>
                    <span className="data-text text-sm font-semibold text-white">
                      {selectedCandidate.risk_breakdown?.suspicious_signals ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#0F2620] p-2.5 rounded-lg border border-[#F6821F]/40">
                    <span className="eyebrow-text text-[#F6821F] block mb-1">TOTAL SCORE</span>
                    <span className="data-text text-sm font-bold text-[#F6821F]">
                      {selectedCandidate.risk_score} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Threat History Audit Trail */}
              {selectedCandidate.threat_history && selectedCandidate.threat_history.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-[#F6821F]" />
                    <span className="eyebrow-text text-[#F6821F] block">
                      THREAT AUDIT TIMELINE
                    </span>
                  </div>
                  <div className="bg-[#111625] p-3 rounded-lg border border-[#1E2638] space-y-2 text-xs">
                    {selectedCandidate.threat_history.map((h, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-slate-400 border-b border-[#1E2638] pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <span className="text-white font-medium">{h.event}</span>
                          {h.details && <span className="block text-xs text-slate-400">{h.details}</span>}
                        </div>
                        <span className="data-text text-slate-400 shrink-0">
                          {h.timestamp.slice(0, 10)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Excerpt */}
              {selectedCandidate.description && (
                <div className="space-y-1">
                  <span className="eyebrow-text text-slate-400 block">
                    PUBLIC STORE LISTING DESCRIPTION
                  </span>
                  <div className="bg-[#111625] p-3 rounded-lg border border-[#1E2638] small-text text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed text-xs">
                    {selectedCandidate.description}
                  </div>
                </div>
              )}

              {/* Footer Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E2638]">
                <a
                  href={selectedCandidate.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 button-text text-[#F6821F] hover:text-[#ff9438]"
                >
                  <span>VIEW PUBLIC STORE LISTING</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="px-5 py-2 bg-[#0E131F] border border-[#1E2638] text-white button-text font-semibold rounded-lg hover:bg-[#161D2F] transition cursor-pointer w-full sm:w-auto shadow-xs"
                >
                  CLOSE INVESTIGATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SCHEDULE MONITORING MODAL */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-[#080B11]/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-[#1E2638] w-full max-w-md p-6 rounded-2xl space-y-4 text-white relative shadow-xl">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-[#111625] border border-[#1E2638] rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <span className="eyebrow-text text-[#F6821F] block">
                  SCHEDULED APP PERIMETER MONITORING
                </span>
                <h3 className="card-title text-white">Configure Scan Frequency</h3>
                <p className="small-text text-slate-400">
                  Configure automatic surveillance scans across Google Play for brand &quot;{currentBrand?.name}&quot;.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                {[
                  { key: 'daily', label: 'Daily (Every 24 hours)' },
                  { key: 'twelve_hours', label: 'High Frequency (Every 12 hours)' },
                  { key: 'weekly', label: 'Weekly Summary (Every 7 days)' },
                  { key: 'manual', label: 'Manual Execution Only' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                      scheduleOption === opt.key
                        ? 'bg-[#0F2620] border-[#F6821F]/40 text-white'
                        : 'bg-[#111625] border-[#1E2638] text-slate-300 hover:border-[#F6821F]/40'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <input
                      type="radio"
                      name="schedule"
                      value={opt.key}
                      checked={scheduleOption === opt.key}
                      onChange={() => setScheduleOption(opt.key as any)}
                      className="accent-[#F6821F]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-slate-400 hover:text-white button-text rounded-lg transition"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-[#F6821F] hover:bg-[#ff9438] text-[#080B11] button-text font-semibold rounded-lg transition shadow-xs"
                >
                  SAVE SCHEDULE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* ESCALATION DIALOG MODAL */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {showEscalateModal && escalateCandidate && (
          <div className="fixed inset-0 z-50 bg-[#080B11]/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-[#1E2638] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl space-y-4 text-white relative shadow-xl">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-[#111625] border border-[#1E2638] rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#FF5C6C]">
                  <AlertOctagon className="h-5 w-5" />
                  <h3 className="card-title text-[#FF5C6C] uppercase">
                    ESCALATE THREAT TO SECURITY QUEUE
                  </h3>
                </div>
                <p className="small-text text-slate-400">
                  Record an internal security action for &quot;{escalateCandidate.app_name}&quot; and prepare evidence for legal takedown.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="eyebrow-text text-slate-400 block mb-1">
                    PRIMARY ESCALATION REASON:
                  </label>
                  <select
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className="w-full bg-[#111625] border border-[#1E2638] text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#FF5C6C]/40 text-xs"
                  >
                    <option value="Potential brand impersonation">Potential brand impersonation</option>
                    <option value="Phishing domain detected">Phishing domain detected</option>
                    <option value="Deceptive credential harvesting">Deceptive credential harvesting</option>
                    <option value="Unauthorized copyright / logo infringement">Unauthorized copyright / logo infringement</option>
                    <option value="Financial fraud / fake customer care lure">Financial fraud / fake customer care lure</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow-text text-slate-400 block mb-1">
                    ANALYST NOTES / EVIDENCE CONTEXT:
                  </label>
                  <textarea
                    value={escalateNotes}
                    onChange={(e) => setEscalateNotes(e.target.value)}
                    placeholder="Enter security reasoning or referral instructions..."
                    rows={3}
                    className="w-full bg-[#111625] border border-[#1E2638] text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#FF5C6C]/40 small-text"
                  />
                </div>

                {/* Pre-formatted Notice */}
                <div className="bg-[#111625] p-3.5 rounded-xl border border-[#1E2638] space-y-1 text-xs text-slate-400">
                  <span className="eyebrow-text text-[#F6821F] block">EVIDENCE SUMMARY PREPARED:</span>
                  <div>• Target: <span className="text-slate-200">{escalateCandidate.app_name}</span> (<span className="data-text">{escalateCandidate.package_id}</span>)</div>
                  <div>• Risk Score: <span className="data-text">{escalateCandidate.risk_score}/100</span> ({escalateCandidate.risk_level})</div>
                  <div>• Signals: {escalateCandidate.evidence?.length || 0} indicators documented</div>
                  <div>• Status: Evidence prepared for external reporting.</div>
                </div>
              </div>

              {/* Escalation Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => {
                    const noticeText = `To: Google Play Legal & Trademark Enforcement Team\nSubject: Trademark Impersonation Takedown Request - ${escalateCandidate.app_name}\n\nApp: ${escalateCandidate.app_name}\nPublisher: ${escalateCandidate.developer}\nPackage: ${escalateCandidate.package_id}\nURL: ${escalateCandidate.app_url}\nReason: ${escalateReason}`;
                    navigator.clipboard.writeText(noticeText);
                    triggerToast('Takedown notice copied to clipboard.');
                  }}
                  className="px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-white button-text rounded-lg flex items-center gap-2 hover:bg-[#161D2F] transition cursor-pointer w-full sm:w-auto shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5 text-[#F6821F]" />
                  <span>COPY NOTICE</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <a
                    href="https://support.google.com/googleplay/android-developer/contact/takedown"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-slate-400 hover:text-white button-text rounded-lg flex items-center gap-1.5 transition"
                  >
                    <span>GOOGLE PLAY FORM</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleConfirmEscalation}
                    className="px-4 py-2 bg-[#C93643] hover:bg-[#A82834] text-white button-text font-semibold rounded-lg transition shadow-xs"
                  >
                    CONFIRM ESCALATION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/**
 * Generates an in-memory test APK buffer in base64 format containing AndroidManifest.xml and classes.dex
 */
function generateTestApkBase64(
  packageId: string,
  appLabel: string,
  permissions: string[],
  urls: string[]
): string {
  const manifestContent = `
    package="${packageId}"
    versionName="1.0.0"
    label="${appLabel}"
    ${permissions.map((p) => `<uses-permission name="${p}"/>`).join('\n')}
    <activity name="${packageId}.MainActivity"/>
    <service name="${packageId}.BackgroundService"/>
  `;

  const dexContent = `
    DEX_STRINGS:
    ${urls.join('\n')}
    com.android.internal
  `;

  const makeLocalHeader = (filename: string, content: Buffer) => {
    const fnBuf = Buffer.from(filename, 'utf-8');
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(0, 14);
    header.writeUInt32LE(content.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(fnBuf.length, 26);
    header.writeUInt16LE(0, 28);
    return Buffer.concat([header, fnBuf, content]);
  };

  const manifestBuf = Buffer.from(manifestContent, 'utf-8');
  const dexBuf = Buffer.from(dexContent, 'utf-8');

  const entry1 = makeLocalHeader('AndroidManifest.xml', manifestBuf);
  const entry2 = makeLocalHeader('classes.dex', dexBuf);

  const fullZip = Buffer.concat([entry1, entry2]);
  return fullZip.toString('base64');
}
