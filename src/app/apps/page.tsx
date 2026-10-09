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
      triggerToast(`Internal security escalation recorded for "${escalateCandidate.app_name}".`);
      setShowEscalateModal(false);
      setEscalateNotes('');
    }
  };

  // Export Investigation Report (.md file download)
  const handleExportReport = (candidate: NormalizedAppCandidate) => {
    const brandName = currentBrand?.name || 'Protected Brand';
    const timestamp = new Date().toISOString();
    const pkg = candidate.package_id || 'unknown_pkg';

    const reportContent = `# SAFENET
DIGITAL RISK INVESTIGATION REPORT

Platform: Google Play Store Perimeter
Investigation Engine: SAFENET App Threat Intelligence (Deterministic Heuristics)
Generated: ${timestamp}

==============================================================================
1. PROTECTED BRAND BASELINE
==============================================================================
Protected Brand:        ${brandName}
Official Domain:        ${currentBrand?.domain || 'N/A'}
Authorized Publisher:   ${(currentBrand?.officialDevelopers || []).join(', ') || 'N/A'}
Authorized Package(s):  ${(currentBrand?.authorizedAppIds || []).join(', ') || 'N/A'}
Official Identity:      ${currentBrand?.officialDevelopers?.length ? 'Verified Corporate Identity' : 'Partially Verified'}

==============================================================================
2. CANDIDATE APPLICATION IDENTITY
==============================================================================
Application Name:       ${candidate.app_name}
Publisher / Developer:  ${candidate.developer}
Package Identifier:     ${candidate.package_id}
Store Listing URL:      ${candidate.app_url}
Rating & Reviews:       ${candidate.rating || 'N/A'} (${candidate.reviews || 'N/A'} reviews)
Downloads / Volume:     ${candidate.installs || 'N/A'}
Store Source:           ${candidate.source}

FIRST SEEN:             ${candidate.first_seen_at || candidate.discovered_at || 'Today'}
LAST SEEN:              ${candidate.last_seen_at || 'Today'}
LIFECYCLE STATUS:       ${candidate.lifecycle_status || 'DISCOVERED'}

==============================================================================
3. DETERMINISTIC THREAT VERDICT
==============================================================================
Threat Verdict:         ${candidate.verdict_summary}
Risk Level:             ${candidate.risk_level}
Risk Score:             ${candidate.risk_score} / 100
Confidence:             ${candidate.confidence_score ? `${candidate.confidence_score}%` : candidate.confidence}

7-Point Deterministic Risk Breakdown:
- Name Similarity:        ${candidate.risk_breakdown?.name_similarity ?? 0} / 20
- Logo Similarity:        ${candidate.risk_breakdown?.logo_similarity ?? 0} / 20
- Developer Mismatch:     ${candidate.risk_breakdown?.developer_mismatch ?? 0} / 15
- Description Lures:      ${candidate.risk_breakdown?.description_similarity ?? 0} / 15
- Package Combosquatting: ${candidate.risk_breakdown?.package_similarity ?? 0} / 10
- Identity Mismatch:      ${candidate.risk_breakdown?.identity_mismatch ?? 0} / 10
- Suspicious Signals:     ${candidate.risk_breakdown?.suspicious_signals ?? 0} / 10
- Total Risk Score:       ${candidate.risk_breakdown?.total ?? candidate.risk_score} / 100

==============================================================================
4. 6-VECTOR IDENTITY COMPARISON MATRIX
==============================================================================
Vector          | Status      | Official Baseline            | Candidate Listing
----------------|-------------|------------------------------|-----------------------------------
App Name        | ${candidate.identity_comparison?.app_name.status || 'N/A'}     | ${candidate.identity_comparison?.app_name.official || brandName} | ${candidate.app_name}
Developer       | ${candidate.identity_comparison?.developer.status || 'N/A'}    | ${candidate.identity_comparison?.developer.official || 'N/A'} | ${candidate.developer}
Logo/Icon       | ${candidate.identity_comparison?.logo.status || 'N/A'}         | ${currentBrand?.logoUrl ? 'Verified Asset' : 'Declared Brand'} | ${candidate.identity_comparison?.logo.details || 'N/A'}
Package ID      | ${candidate.identity_comparison?.package_id.status || 'N/A'}   | ${candidate.identity_comparison?.package_id.official || 'N/A'} | ${candidate.package_id}
Description     | ${candidate.identity_comparison?.description.status || 'N/A'}  | Authorized Brand Copy        | ${candidate.identity_comparison?.description.details || 'N/A'}
Domain/Endpoint | ${candidate.identity_comparison?.domain.status || 'N/A'}       | ${candidate.identity_comparison?.domain.official || 'N/A'} | ${candidate.identity_comparison?.domain.candidate || 'N/A'}

==============================================================================
5. WHY SAFENET FLAGGED THIS APPLICATION
==============================================================================
${(candidate.why_flagged || candidate.evidence || []).map((reason, i) => `${i + 1}. ${reason}`).join('\n')}

==============================================================================
6. EXTERNAL NETWORK & DOMAIN CORRELATION
==============================================================================
${
  candidate.domain_correlation && candidate.domain_correlation.length > 0
    ? candidate.domain_correlation
        .map(
          (d) =>
            `- Domain: ${d.domain} | Risk: ${d.risk_score}/100 (${d.risk_level})\n  Findings: ${d.findings.join('; ')}`
        )
        .join('\n')
    : 'No external domains extracted or correlated from listing metadata.'
}

==============================================================================
7. THREAT HISTORY AUDIT TRAIL
==============================================================================
${(candidate.threat_history || []).map((h) => `[${h.timestamp.slice(0, 10)}] ${h.event}: ${h.details || ''}`).join('\n')}

==============================================================================
8. RECOMMENDED SECURITY RESPONSE
==============================================================================
1. Review application and escalate through the appropriate platform/security process.
2. Escalate trademark takedown notice to Google Play Legal Enforcement if developer is unauthorized.
3. Monitor domain perimeter for related phishing / credential harvesting infrastructure.
4. Keep under active monitoring in SAFENET Digital Risk Protection Watchlist.

Evidence prepared for external reporting. Report generated by SAFENET.
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAFENET_DIGITAL_RISK_INVESTIGATION_${pkg}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Digital risk report for "${candidate.app_name}" downloaded.`);
  };

  // Copy Evidence Briefing to Clipboard
  const handleCopyEvidence = (candidate: NormalizedAppCandidate) => {
    const brief = `[SAFENET DIGITAL RISK INVESTIGATION BRIEF]
Timestamp: ${new Date().toISOString()}
Protected Brand: ${currentBrand?.name || 'Protected Brand'}
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

  // Execute App Scan (with multi-variant search & deduplication sync)
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

      // Deduplicate and sync into persistent threat candidates
      const { candidates: syncedList, summary } = BrandStore.syncAndDeduplicateCandidates(
        data.candidates,
        q
      );
      setStoredCandidates(syncedList);
      setScanSummary(summary);

      // Update monitoring status
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
      console.error('[App Intelligence] APK analysis error:', msg);
      setApkError(msg);
    } finally {
      setIsAnalyzingApk(false);
    }
  };

  // Load a synthetic test APK buffer for immediate live demonstration
  const handleLoadSampleApk = async (type: 'trojan' | 'clean') => {
    setIsAnalyzingApk(true);
    setApkError('');
    setApkReport(null);

    try {
      const testPayload =
        type === 'trojan'
          ? generateTestApkBase64(
              'com.support.paypalsecure.app',
              'PayPal Security Support',
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
      pageTitle="APP THREAT INTELLIGENCE"
      pageSubtitle="Digital Risk Protection · Continuous mobile perimeter surveillance, brand impersonation discovery, and static APK artifact correlation."
    >
      <div className="space-y-6 pb-20">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#080A0B] border border-[#18E6A3] text-[#18E6A3] px-4 py-2.5 rounded-[2px] font-mono text-[12px] flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-3">
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TOP: PROTECTION OVERVIEW METRICS DASHBOARD */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-4 rounded-[2px]">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#18E6A3]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#18E6A3] font-semibold">
                PROTECTION OVERVIEW
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#8A9390]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#59625F]" />
                Last Scan: <span className="text-[#F2F4F3]">{monitoringConfig.last_scan ? new Date(monitoringConfig.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today, 14:42'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 font-mono text-[11px]">
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
              <span className="text-[#8A9390] block text-[10px] uppercase">Applications Monitored</span>
              <span className="text-[#F2F4F3] font-bold text-[16px]">{totalMonitoredCount}</span>
            </div>
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
              <span className="text-[#8A9390] block text-[10px] uppercase">New Threats</span>
              <span className="text-[#FF8042] font-bold text-[16px]">{newThreatsCount}</span>
            </div>
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[#FF5C5C]/30 bg-[#FF5C5C]/5">
              <span className="text-[#FF5C5C] block text-[10px] uppercase font-semibold">High / Critical</span>
              <span className="text-[#FF5C5C] font-bold text-[16px]">{highCriticalTotal}</span>
            </div>
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
              <span className="text-[#8A9390] block text-[10px] uppercase">Under Review</span>
              <span className="text-[#F5B84B] font-bold text-[16px]">{underReviewCount}</span>
            </div>
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
              <span className="text-[#8A9390] block text-[10px] uppercase">Confirmed Suspicious</span>
              <span className="text-[#FF8042] font-bold text-[16px]">{confirmedSuspiciousCount}</span>
            </div>
            <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
              <span className="text-[#8A9390] block text-[10px] uppercase">Resolved</span>
              <span className="text-[#18E6A3] font-bold text-[16px]">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: PROTECTED BRAND & MONITORING STATUS & CONTROLS */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Protected Brand Baseline (2/3 width) */}
          <div className="lg:col-span-2 bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-5 rounded-[2px] relative flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#18E6A3]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#18E6A3] font-semibold">
                    PROTECTED BRAND TARGET
                  </span>
                  <span className="text-[10px] font-mono bg-[#18E6A3]/10 text-[#18E6A3] px-2 py-0.5 rounded-[2px] border border-[#18E6A3]/20">
                    VERIFIED BASELINE
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBrandSelector(!showBrandSelector)}
                    className="px-2.5 py-1 bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[#F2F4F3] text-[11px] font-mono rounded-[2px] hover:border-[rgba(255,255,255,0.25)] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Change ({currentBrand?.name})</span>
                    <ChevronDown className="h-3 w-3 text-[#8A9390]" />
                  </button>

                  {showBrandSelector && (
                    <div className="absolute right-0 top-8 z-40 w-56 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] shadow-2xl rounded-[2px] p-1 font-mono text-[12px]">
                      <div className="px-3 py-1.5 text-[10px] uppercase text-[#59625F] border-b border-[rgba(255,255,255,0.06)]">
                        SELECT AUTHORITATIVE BRAND
                      </div>
                      {Object.keys(PRESET_BRANDS).map((bKey) => (
                        <button
                          key={bKey}
                          type="button"
                          onClick={() => handleSelectBrand(bKey)}
                          className="w-full text-left px-3 py-2 text-[#F2F4F3] hover:bg-[rgba(255,255,255,0.04)] rounded-[2px] flex items-center justify-between cursor-pointer"
                        >
                          <span>{bKey}</span>
                          {currentBrand?.name === bKey && (
                            <Check className="h-3.5 w-3.5 text-[#18E6A3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <h2 className="text-[22px] font-semibold text-[#F2F4F3]">
                  {currentBrand?.name || 'PayPal'}
                </h2>
                <span className="text-[12px] font-mono text-[#8A9390]">
                  Official Domain: <span className="text-[#F2F4F3]">{currentBrand?.domain || 'paypal.com'}</span>
                </span>
                {currentBrand?.officialDevelopers && currentBrand.officialDevelopers.length > 0 ? (
                  <span className="text-[12px] font-mono text-[#8A9390]">
                    · Publisher: <span className="text-[#F2F4F3]">{currentBrand.officialDevelopers[0]}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#F5B84B]">
                    (Official identity partially verified)
                  </span>
                )}
                {currentBrand?.appPackageName && (
                  <span className="hidden sm:inline text-[12px] font-mono text-[#59625F]">
                    · Pkg: {currentBrand.appPackageName}
                  </span>
                )}
              </div>

              <p className="text-[12px] text-[#8A9390] pt-1 leading-relaxed">
                SAFENET protects this organization from brand impersonation, deceptive app look-alikes, publisher spoofing, and malicious credential phishing across Android application perimeters.
              </p>
            </div>
          </div>

          {/* Monitoring Status & Controls Box (1/3 width) */}
          <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-5 rounded-[2px] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#59625F] font-semibold">
                  APP MONITORING
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#18E6A3] bg-[#18E6A3]/10 px-2 py-0.5 rounded-[2px] border border-[#18E6A3]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#18E6A3] animate-pulse" />
                  ACTIVE
                </span>
              </div>

              <div className="font-mono text-[12px] space-y-1 text-[#8A9390]">
                <div>Platform: <span className="text-[#F2F4F3]">Google Play Store</span></div>
                <div>Schedule: <span className="text-[#F2F4F3] uppercase">{monitoringConfig.schedule.replace('_', ' ')}</span></div>
                <div>Last scan: <span className="text-[#F2F4F3]">{monitoringConfig.last_scan ? new Date(monitoringConfig.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today, 14:42'}</span></div>
                <div>Candidates discovered: <span className="text-[#F2F4F3]">{totalMonitoredCount}</span> · High/Critical: <span className="text-[#FF5C5C] font-bold">{highCriticalTotal}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSearch(undefined, true)}
                disabled={isSearching}
                className="flex-1 px-3 py-2 bg-[#18E6A3] text-[#080A0B] font-mono text-[12px] font-bold rounded-[2px] hover:bg-[#18E6A3]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>SCANNING...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>RUN SCAN</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-2 bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[#8A9390] hover:text-[#F2F4F3] font-mono text-[12px] rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Configure monitoring frequency"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>SCHEDULE</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SCAN RESULTS SUMMARY BANNER (Shown After Scans) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {scanSummary && (
          <div className="bg-[#080A0B] border border-[#18E6A3]/30 p-4 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[12px] animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#18E6A3] shrink-0" />
              <div>
                <span className="text-[11px] font-bold uppercase text-[#18E6A3] block tracking-wider">
                  SCAN COMPLETE · PERIMETER DISCOVERY UPDATED
                </span>
                <span className="text-[#8A9390]">
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
              className="px-3 py-1.5 bg-[#18E6A3]/10 text-[#18E6A3] border border-[#18E6A3]/30 rounded-[2px] hover:bg-[#18E6A3]/20 transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
            >
              <span>VIEW THREAT INBOX</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (Search vs APK) */}
        <div className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.08)] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 pb-3 text-[13px] font-mono font-medium transition-colors cursor-pointer relative ${
              activeTab === 'search' ? 'text-[#F2F4F3]' : 'text-[#59625F] hover:text-[#8A9390]'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>1. APP THREAT DISCOVERY & INBOX</span>
            {activeTab === 'search' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#18E6A3]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-2 pb-3 text-[13px] font-mono font-medium transition-colors cursor-pointer relative ${
              activeTab === 'apk' ? 'text-[#F2F4F3]' : 'text-[#59625F] hover:text-[#8A9390]'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>2. STATIC APK ARTIFACT INSPECTION</span>
            {activeTab === 'apk' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#18E6A3]" />
            )}
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* MODE 1: SEARCH & THREAT INBOX (MAIN WORKFLOW) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Input Bar */}
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-6 rounded-[2px] space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#18E6A3]">
                  PERIMETER DISCOVERY QUERY
                </span>
                <p className="text-[13px] text-[#8A9390]">
                  Query public Google Play store listings via SerpApi to discover potential brand impersonators, unauthorized publishers, and deceptive look-alikes.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-3 pt-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#59625F]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter brand name, company, or application keyword (e.g. PayPal, Microsoft, Paytm)..."
                    className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.12)] rounded-[2px] pl-10 pr-4 py-2.5 text-[13px] text-[#F2F4F3] font-mono placeholder:text-[#59625F] focus:outline-none focus:border-[#18E6A3] transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[#8A9390] text-[12px] font-mono rounded-[2px] px-3 py-2.5 focus:outline-none focus:border-[#18E6A3]"
                  >
                    <option value="in">Region: India (gl=in)</option>
                    <option value="us">Region: United States (gl=us)</option>
                    <option value="gb">Region: United Kingdom (gl=gb)</option>
                    <option value="global">Region: Global</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-[#18E6A3] text-[#080A0B] font-mono text-[13px] font-semibold rounded-[2px] hover:bg-[#18E6A3]/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
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
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#59625F]">
                <span>FAST TRIAGE EXAMPLES:</span>
                {['PayPal', 'Microsoft', 'WhatsApp', 'Paytm', 'Nike'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setSearchQuery(ex);
                      handleSearch(ex);
                    }}
                    className="hover:text-[#18E6A3] transition-colors cursor-pointer underline underline-offset-2"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="border border-[rgba(255,92,92,0.3)] bg-[rgba(255,92,92,0.05)] p-4 rounded-[2px] flex items-start gap-3 text-[12px] text-[#FF5C5C] font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block uppercase">Search Request Error</span>
                  <span>{searchError}</span>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* THREAT INBOX (MAJOR UI REQUIREMENT) */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div id="threat-inbox-section" className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-5 rounded-[2px] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-[#18E6A3]" />
                    <h3 className="text-[16px] font-bold text-[#F2F4F3] font-mono uppercase tracking-wider">
                      THREAT INBOX
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#8A9390] font-mono">
                    Prioritized queue of discovered applications targeting the protected brand perimeter.
                  </p>
                </div>

                {/* Counter Breakdown */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2.5 py-1 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 text-[#FF5C5C] rounded-[2px] font-bold">
                    CRITICAL: {criticalThreatCount}
                  </span>
                  <span className="px-2.5 py-1 bg-[#FF8042]/15 border border-[#FF8042]/30 text-[#FF8042] rounded-[2px] font-bold">
                    HIGH: {highThreatCount}
                  </span>
                  <span className="px-2.5 py-1 bg-[#F5B84B]/15 border border-[#F5B84B]/30 text-[#F5B84B] rounded-[2px] font-bold">
                    MEDIUM: {allCandidates.filter((c) => c.risk_level === 'MEDIUM').length}
                  </span>
                  <span className="px-2.5 py-1 bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[#8A9390] rounded-[2px]">
                    REVIEW: {underReviewCount}
                  </span>
                </div>
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-[#59625F] mr-1 flex items-center gap-1">
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
                      className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                        threatStatusFilter === f.key
                          ? 'bg-[#F2F4F3] text-[#080A0B] font-semibold'
                          : 'bg-[#080A0B] text-[#8A9390] hover:text-[#F2F4F3] border border-[rgba(255,255,255,0.06)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#59625F]" />
                  <span className="text-[#59625F]">SORT:</span>
                  <select
                    value={threatSort}
                    onChange={(e) => setThreatSort(e.target.value as ThreatSortOption)}
                    className="bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[#F2F4F3] rounded-[2px] px-2 py-1 text-[11px] focus:outline-none focus:border-[#18E6A3]"
                  >
                    <option value="severity">Severity (Highest Risk First)</option>
                    <option value="confidence">Confidence (Highest First)</option>
                    <option value="signals">Supporting Signals (Most First)</option>
                    <option value="recency">Recency (Newest First)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* THREAT INBOX LISTINGS */}
            {/* ═════════════════════════════════════════════════════════════════ */}
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
                      className={`bg-[#0D1011] border transition-all p-4 rounded-[2px] font-mono text-[12px] flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative group ${
                        cand.is_verified_official
                          ? 'border-[rgba(24,230,163,0.3)] hover:border-[#18E6A3]'
                          : cand.risk_level === 'CRITICAL'
                          ? 'border-[rgba(255,92,92,0.4)] hover:border-[#FF5C5C] bg-[rgba(255,92,92,0.02)]'
                          : cand.risk_level === 'HIGH'
                          ? 'border-[rgba(255,128,66,0.4)] hover:border-[#FF8042]'
                          : cand.risk_level === 'MEDIUM'
                          ? 'border-[rgba(245,184,75,0.3)] hover:border-[#F5B84B]'
                          : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {/* Left: App Identity */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {cand.icon ? (
                          <img
                            src={cand.icon}
                            alt={cand.app_name}
                            className="h-12 w-12 rounded-[6px] object-cover bg-[#080A0B] border border-[rgba(255,255,255,0.08)] shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-[6px] bg-[#080A0B] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                            <Smartphone className="h-5 w-5 text-[#59625F]" />
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-[14px] font-semibold text-[#F2F4F3] truncate max-w-md">
                              {cand.app_name}
                            </h4>

                            {cand.is_verified_official ? (
                              <span className="text-[10px] bg-[#18E6A3]/10 text-[#18E6A3] border border-[#18E6A3]/30 px-2 py-0.5 rounded-[2px] font-semibold">
                                ✓ VERIFIED OFFICIAL APP
                              </span>
                            ) : cand.risk_level === 'CRITICAL' || cand.risk_level === 'HIGH' ? (
                              <span className="text-[10px] bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/30 px-2 py-0.5 rounded-[2px] font-semibold">
                                ⚠ POTENTIAL IMPERSONATION
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[#8A9390] px-2 py-0.5 rounded-[2px]">
                                THIRD-PARTY LISTING
                              </span>
                            )}

                            {/* Lifecycle Status Badge */}
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.5 rounded-[2px] border ${
                                cand.lifecycle_status === 'ESCALATED'
                                  ? 'bg-[#FF5C5C]/20 text-[#FF5C5C] border-[#FF5C5C]/40 font-bold'
                                  : cand.lifecycle_status === 'CONFIRMED SUSPICIOUS'
                                  ? 'bg-[#FF8042]/20 text-[#FF8042] border-[#FF8042]/40 font-bold'
                                  : cand.lifecycle_status === 'UNDER REVIEW'
                                  ? 'bg-[#F5B84B]/20 text-[#F5B84B] border-[#F5B84B]/40'
                                  : cand.lifecycle_status === 'RESOLVED'
                                  ? 'bg-[#18E6A3]/10 text-[#18E6A3] border-[#18E6A3]/30'
                                  : 'bg-[rgba(255,255,255,0.05)] text-[#8A9390] border-[rgba(255,255,255,0.1)]'
                              }`}
                            >
                              {cand.lifecycle_status || 'DISCOVERED'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8A9390]">
                            <span>
                              Developer: <span className="text-[#F2F4F3]">{cand.developer || 'Unknown'}</span>
                            </span>
                            {cand.package_id && (
                              <span>
                                · Pkg: <span className="text-[#59625F]">{cand.package_id}</span>
                              </span>
                            )}
                            {cand.installs && (
                              <span>
                                · Installs: <span className="text-[#F2F4F3]">{cand.installs}</span>
                              </span>
                            )}
                            {cand.rating !== undefined && (
                              <span>
                                · Rating: <span className="text-[#F2F4F3]">{cand.rating}★</span>
                              </span>
                            )}
                            <span className="text-[#59625F]">
                              · First seen: {cand.first_seen_at ? cand.first_seen_at.slice(0, 10) : 'Today'}
                            </span>
                          </div>

                          {/* Primary Threat Detection Signal */}
                          <div className="text-[11px] text-[#8A9390] line-clamp-1 pt-0.5">
                            <span className="text-[#59625F] font-semibold">DETECTION: </span>
                            {cand.why_flagged && cand.why_flagged.length > 0 ? (
                              <span className="text-[#F2F4F3]">{cand.why_flagged[0]}</span>
                            ) : cand.evidence && cand.evidence.length > 0 ? (
                              <span className="text-[#F2F4F3]">{cand.evidence[0]}</span>
                            ) : (
                              <span className="text-[#59625F]">Evaluated against protected brand perimeter</span>
                            )}
                          </div>

                          {/* Signal Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {cand.risk_breakdown?.name_similarity > 0 && (
                              <span className="text-[10px] bg-[rgba(255,255,255,0.04)] text-[#8A9390] px-2 py-0.5 rounded-[2px] border border-[rgba(255,255,255,0.06)]">
                                Name Similarity ({cand.risk_breakdown.name_similarity}/20)
                              </span>
                            )}
                            {cand.risk_breakdown?.developer_mismatch > 0 && (
                              <span className="text-[10px] bg-[rgba(255,92,92,0.08)] text-[#FF5C5C] px-2 py-0.5 rounded-[2px] border border-[rgba(255,92,92,0.2)]">
                                Developer Mismatch
                              </span>
                            )}
                            {cand.risk_breakdown?.logo_similarity > 0 && (
                              <span className="text-[10px] bg-[rgba(255,128,66,0.08)] text-[#FF8042] px-2 py-0.5 rounded-[2px] border border-[rgba(255,128,66,0.2)]">
                                Logo Resemblance
                              </span>
                            )}
                            {cand.extracted_domains && cand.extracted_domains.length > 0 && (
                              <span className="text-[10px] bg-[rgba(24,230,163,0.08)] text-[#18E6A3] px-2 py-0.5 rounded-[2px] border border-[rgba(24,230,163,0.2)]">
                                Extracted Domain ({cand.extracted_domains[0]})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Risk Verdict & Action Buttons */}
                      <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[rgba(255,255,255,0.06)]">
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] text-[#59625F] uppercase">Risk</span>
                            <span
                              className={`text-[14px] font-bold ${
                                cand.risk_level === 'CRITICAL'
                                  ? 'text-[#FF5C5C]'
                                  : cand.risk_level === 'HIGH'
                                  ? 'text-[#FF8042]'
                                  : cand.risk_level === 'MEDIUM'
                                  ? 'text-[#F5B84B]'
                                  : 'text-[#18E6A3]'
                              }`}
                            >
                              {cand.risk_score} / 100
                            </span>
                          </div>

                          <div className="text-[10px] text-[#59625F]">
                            Confidence: <span className="text-[#F2F4F3] font-semibold">{cand.confidence_score ? `${cand.confidence_score}%` : cand.confidence}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleWatchlist(cand, e)}
                            className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
                              isWatchlisted
                                ? 'bg-[#18E6A3]/10 border-[#18E6A3]/40 text-[#18E6A3]'
                                : 'bg-[#080A0B] border-[rgba(255,255,255,0.12)] text-[#8A9390] hover:text-[#F2F4F3]'
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
                            className="p-1.5 rounded-[2px] border border-[rgba(255,255,255,0.12)] bg-[#080A0B] text-[#8A9390] hover:text-[#FF5C5C] hover:border-[#FF5C5C]/40 transition-colors cursor-pointer"
                            title="Escalate Threat"
                          >
                            <Send className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className="px-3 py-1.5 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] hover:border-[#18E6A3] hover:text-[#18E6A3] rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer font-semibold text-[11px]"
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
              <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.06)] p-12 text-center rounded-[2px] font-mono space-y-3">
                <ShieldCheck className="h-10 w-10 text-[#18E6A3] mx-auto opacity-70" />
                <div className="space-y-1">
                  <h4 className="text-[14px] font-semibold text-[#F2F4F3] uppercase tracking-wider">
                    NO SIGNIFICANT THREATS IDENTIFIED
                  </h4>
                  <p className="text-[12px] text-[#8A9390] max-w-md mx-auto leading-relaxed">
                    SAFENET did not identify applications with sufficient impersonation signals for this brand in the current search.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* MODE 2: APK STATIC ANALYSIS (UNCHANGED INTEGRATION) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'apk' && (
          <div className="space-y-6">
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-6 rounded-[2px] space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#18E6A3]">
                  ANDROID APK STATIC CORRELATION ENGINE
                </span>
                <p className="text-[13px] text-[#8A9390]">
                  Inspect untrusted Android application packages (.apk) to decompile manifests, detect sensitive capabilities, extract hardcoded URLs, and correlate with Google Play listings.
                </p>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#18E6A3] p-8 rounded-[2px] text-center space-y-3 bg-[#080A0B] transition-colors">
                <Upload className="h-8 w-8 text-[#18E6A3] mx-auto" />
                <div className="space-y-1">
                  <p className="text-[13px] text-[#F2F4F3]">Drag & drop Android APK file here</p>
                  <p className="text-[11px] text-[#59625F]">Static manifest inspection, signature check & DEX domain correlation</p>
                </div>

                <div>
                  <label className="inline-block px-4 py-2 bg-[#0D1011] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] text-[12px] rounded-[2px] hover:border-[#18E6A3] transition-colors cursor-pointer">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] text-[#59625F]">
                <span>NO APK ON HAND? TEST SAMPLE PAYLOADS:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleApk('trojan')}
                    className="px-3 py-1 rounded-[2px] bg-[#080A0B] border border-[rgba(255,92,92,0.3)] text-[#FF5C5C] hover:bg-[#FF5C5C]/10 transition-colors cursor-pointer"
                  >
                    Simulate Rogue Trojan APK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleApk('clean')}
                    className="px-3 py-1 rounded-[2px] bg-[#080A0B] border border-[rgba(24,230,163,0.3)] text-[#18E6A3] hover:bg-[#18E6A3]/10 transition-colors cursor-pointer"
                  >
                    Simulate Clean Release APK
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Loading Spinner */}
            {isAnalyzingApk && (
              <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] p-8 rounded-[2px] text-center font-mono space-y-2">
                <RefreshCw className="h-6 w-6 text-[#18E6A3] animate-spin mx-auto" />
                <p className="text-[13px] text-[#F2F4F3]">
                  Decompressing APK structure & parsing binary AndroidManifest...
                </p>
                <p className="text-[11px] text-[#59625F]">
                  Extracting permissions, cryptographic hashes, and embedded C2 domains.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {apkError && (
              <div className="border border-[rgba(255,92,92,0.3)] bg-[rgba(255,92,92,0.05)] p-4 rounded-[2px] flex items-start gap-3 text-[12px] text-[#FF5C5C] font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block uppercase">APK Analysis Error</span>
                  <span>{apkError}</span>
                </div>
              </div>
            )}

            {/* Full APK Correlation Report */}
            {apkReport && (
              <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.12)] p-6 rounded-[2px] space-y-6 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#59625F]">
                      STATIC ARTIFACT REPORT
                    </span>
                    <h3 className="text-[18px] text-[#F2F4F3] font-normal flex items-center gap-2">
                      <span>{apkReport.apk.application_label}</span>
                      <span className="text-[12px] text-[#8A9390]">({apkReport.apk.file_name})</span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#59625F] block uppercase">COMBINED THREAT LEVEL</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[20px] font-bold ${
                          apkReport.combined_risk_level === 'CRITICAL'
                            ? 'text-[#FF5C5C]'
                            : apkReport.combined_risk_level === 'HIGH'
                            ? 'text-[#FF8042]'
                            : apkReport.combined_risk_level === 'MEDIUM'
                            ? 'text-[#F5B84B]'
                            : 'text-[#18E6A3]'
                        }`}
                      >
                        {apkReport.combined_risk_level}
                      </span>
                      <span className="text-[14px] text-[#8A9390]">
                        ({apkReport.combined_risk_score} / 100)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase text-[#18E6A3] font-semibold">
                    ANDROID PERMISSIONS & SENSITIVE CAPABILITIES
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    {apkReport.apk.permissions.sensitive.map((perm, idx) => (
                      <div
                        key={idx}
                        className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,92,92,0.2)] flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-[#FF5C5C] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[#F2F4F3] font-semibold block">{perm.permission}</span>
                          <span className="text-[#8A9390] text-[10px]">{perm.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Embedded Network Domains */}
                {apkReport.apk.extracted_domains.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase text-[#18E6A3] font-semibold">
                      EXTRACTED EMBEDDED NETWORK ENDPOINTS
                    </span>
                    <div className="bg-[#080A0B] p-3 rounded-[2px] border border-[rgba(255,255,255,0.06)] text-[11px] space-y-1">
                      {apkReport.apk.extracted_domains.map((dom, i) => (
                        <div key={i} className="flex items-center justify-between text-[#8A9390]">
                          <span className="text-[#F2F4F3]">{dom}</span>
                          <span className="text-[#59625F] text-[10px]">Correlated with URL Intelligence</span>
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
        {/* INVESTIGATION VIEW 2.0 (CYBERSECURITY WORKSPACE MODAL) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.15)] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 rounded-[2px] space-y-6 font-mono text-[#F2F4F3] relative shadow-2xl">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 p-1.5 text-[#8A9390] hover:text-[#F2F4F3] cursor-pointer bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Investigation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4 pr-8">
                <div className="flex items-start gap-3.5">
                  {selectedCandidate.icon ? (
                    <img
                      src={selectedCandidate.icon}
                      alt={selectedCandidate.app_name}
                      className="h-14 w-14 rounded-[6px] object-cover bg-[#080A0B] border border-[rgba(255,255,255,0.12)] shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-[6px] bg-[#080A0B] border border-[rgba(255,255,255,0.12)] flex items-center justify-center shrink-0">
                      <Smartphone className="h-6 w-6 text-[#59625F]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#18E6A3] font-semibold">
                      APPLICATION INVESTIGATION WORKSPACE
                    </span>
                    <h3 className="text-[18px] font-bold text-[#F2F4F3] leading-tight">
                      {selectedCandidate.app_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#8A9390]">
                      <span>Publisher: <span className="text-[#F2F4F3]">{selectedCandidate.developer}</span></span>
                      <span>Pkg: <span className="text-[#59625F]">{selectedCandidate.package_id}</span></span>
                      <span>First Seen: <span className="text-[#F2F4F3]">{selectedCandidate.first_seen_at ? selectedCandidate.first_seen_at.slice(0, 10) : 'Today'}</span></span>
                      <span>Last Seen: <span className="text-[#F2F4F3]">{selectedCandidate.last_seen_at ? selectedCandidate.last_seen_at.slice(0, 10) : 'Today'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#59625F] uppercase block">THREAT VERDICT</span>
                  <div className="flex items-center gap-2 justify-end">
                    <span
                      className={`text-[20px] font-bold ${
                        selectedCandidate.risk_level === 'CRITICAL'
                          ? 'text-[#FF5C5C]'
                          : selectedCandidate.risk_level === 'HIGH'
                          ? 'text-[#FF8042]'
                          : selectedCandidate.risk_level === 'MEDIUM'
                          ? 'text-[#F5B84B]'
                          : 'text-[#18E6A3]'
                      }`}
                    >
                      {selectedCandidate.risk_level}
                    </span>
                    <span className="text-[14px] text-[#8A9390]">
                      ({selectedCandidate.risk_score} / 100)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8A9390]">
                    Confidence: <span className="text-[#F2F4F3] font-semibold">{selectedCandidate.confidence_score ? `${selectedCandidate.confidence_score}%` : selectedCandidate.confidence}</span>
                  </span>
                </div>
              </div>

              {/* Threat Lifecycle Selector & Quick Actions */}
              <div className="bg-[#080A0B] p-3.5 rounded-[2px] border border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#59625F] font-semibold uppercase">LIFECYCLE STATUS:</span>
                  <select
                    value={selectedCandidate.lifecycle_status || 'DISCOVERED'}
                    onChange={(e) => handleUpdateStatus(selectedCandidate, e.target.value as ThreatLifecycleStatus)}
                    className="bg-[#0D1011] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] rounded-[2px] px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#18E6A3]"
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
                    className="px-2.5 py-1.5 bg-[#0D1011] border border-[rgba(255,255,255,0.12)] text-[#F2F4F3] hover:border-[#18E6A3] rounded-[2px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedCandidate.watchlisted || BrandStore.isInAppWatchlist(selectedCandidate.package_id || selectedCandidate.id) ? (
                      <>
                        <BookmarkCheck className="h-3.5 w-3.5 text-[#18E6A3]" />
                        <span>WATCHLISTED</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>ADD TO WATCHLIST</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyEvidence(selectedCandidate)}
                    className="px-2.5 py-1.5 bg-[#0D1011] border border-[rgba(255,255,255,0.12)] text-[#F2F4F3] hover:border-[#18E6A3] rounded-[2px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>COPY EVIDENCE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportReport(selectedCandidate)}
                    className="px-2.5 py-1.5 bg-[#0D1011] border border-[rgba(255,255,255,0.12)] text-[#18E6A3] hover:bg-[#18E6A3]/10 rounded-[2px] flex items-center gap-1.5 cursor-pointer font-semibold"
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
                    className="px-2.5 py-1.5 bg-[#FF5C5C]/15 border border-[#FF5C5C]/40 text-[#FF5C5C] hover:bg-[#FF5C5C]/25 rounded-[2px] flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Send className="h-3 w-3" />
                    <span>ESCALATE THREAT</span>
                  </button>
                </div>
              </div>

              {/* Escalation Record (If Escalated) */}
              {selectedCandidate.escalation_record && (
                <div className="bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 p-3 rounded-[2px] text-[11px] space-y-1">
                  <div className="flex items-center gap-2 text-[#FF5C5C] font-bold">
                    <AlertOctagon className="h-4 w-4" />
                    <span>INTERNAL SECURITY ESCALATION ACTIVE</span>
                  </div>
                  <div className="text-[#8A9390]">
                    Reason: <span className="text-[#F2F4F3]">{selectedCandidate.escalation_record.reason}</span> · Escalated at: <span className="text-[#F2F4F3]">{selectedCandidate.escalation_record.timestamp.slice(0, 16)}</span> · Evidence prepared for external reporting.
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* 6-VECTOR IDENTITY COMPARISON TABLE */}
              {/* ═════════════════════════════════════════════════════════════ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase text-[#18E6A3] font-semibold tracking-wider">
                    IDENTITY COMPARISON MATRIX (OFFICIAL vs CANDIDATE)
                  </span>
                  <span className="text-[10px] text-[#59625F]">
                    ✓ MATCH · ⚠ SIMILAR · 🚨 MISMATCH · ? UNKNOWN
                  </span>
                </div>

                <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-[2px]">
                  <table className="w-full text-left text-[11px] border-collapse font-mono">
                    <thead>
                      <tr className="bg-[#080A0B] text-[#59625F] border-b border-[rgba(255,255,255,0.08)]">
                        <th className="p-2.5">EVALUATION VECTOR</th>
                        <th className="p-2.5">OFFICIAL BASELINE</th>
                        <th className="p-2.5">CANDIDATE LISTING</th>
                        <th className="p-2.5 text-center">SIGNAL STATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                      {/* 1. App Name */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">App Name</td>
                        <td className="p-2.5 text-[#F2F4F3]">
                          {selectedCandidate.identity_comparison?.app_name.official || currentBrand?.name || 'PayPal'}
                        </td>
                        <td className="p-2.5 text-[#F2F4F3] font-medium">{selectedCandidate.app_name}</td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.app_name.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.app_name.status === 'SIMILAR' ? (
                            <span className="text-[#F5B84B]">⚠ SIMILAR</span>
                          ) : (
                            <span className="text-[#FF5C5C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 2. Developer */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">Developer / Publisher</td>
                        <td className="p-2.5 text-[#F2F4F3]">
                          {selectedCandidate.identity_comparison?.developer.official || 'Verified Brand Entity'}
                        </td>
                        <td className="p-2.5 text-[#F2F4F3]">{selectedCandidate.developer}</td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.developer.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.developer.status === 'SIMILAR' ? (
                            <span className="text-[#F5B84B]">⚠ SIMILAR</span>
                          ) : (
                            <span className="text-[#FF5C5C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 3. Logo / Icon */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">Brand Logo / Artwork</td>
                        <td className="p-2.5 text-[#F2F4F3]">Verified Official Asset</td>
                        <td className="p-2.5 text-[#8A9390]">
                          {selectedCandidate.logo_similarity_status || 'Perceptual inspection'}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.logo.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.logo.status === 'SIMILAR' ? (
                            <span className="text-[#F5B84B]">⚠ SIMILAR</span>
                          ) : selectedCandidate.identity_comparison?.logo.status === 'UNKNOWN' ? (
                            <span className="text-[#59625F]">? UNKNOWN</span>
                          ) : (
                            <span className="text-[#FF5C5C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 4. Package ID */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">Package Identifier</td>
                        <td className="p-2.5 text-[#F2F4F3]">
                          {selectedCandidate.identity_comparison?.package_id.official || 'Authorized Namespace'}
                        </td>
                        <td className="p-2.5 text-[#F2F4F3]">{selectedCandidate.package_id}</td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.package_id.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.package_id.status === 'SIMILAR' ? (
                            <span className="text-[#FF5C5C]">⚠ SIMILAR (Combosquat)</span>
                          ) : (
                            <span className="text-[#FF5C5C]">🚨 MISMATCH</span>
                          )}
                        </td>
                      </tr>

                      {/* 5. Description */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">Description Branding</td>
                        <td className="p-2.5 text-[#F2F4F3]">Authorized Corporate Copy</td>
                        <td className="p-2.5 text-[#8A9390]">
                          {selectedCandidate.description
                            ? selectedCandidate.description.slice(0, 70) + '...'
                            : 'No description'}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.description.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.description.status === 'SIMILAR' ? (
                            <span className="text-[#F5B84B]">⚠ SIMILAR</span>
                          ) : (
                            <span className="text-[#8A9390]">STANDARD</span>
                          )}
                        </td>
                      </tr>

                      {/* 6. External Domain */}
                      <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-2.5 text-[#8A9390] font-semibold">Associated Web Domain</td>
                        <td className="p-2.5 text-[#F2F4F3]">{currentBrand?.domain || 'paypal.com'}</td>
                        <td className="p-2.5 text-[#F2F4F3]">
                          {selectedCandidate.extracted_domains && selectedCandidate.extracted_domains.length > 0
                            ? selectedCandidate.extracted_domains.join(', ')
                            : 'None declared in listing'}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {selectedCandidate.identity_comparison?.domain.status === 'MATCH' ? (
                            <span className="text-[#18E6A3]">✓ MATCH</span>
                          ) : selectedCandidate.identity_comparison?.domain.status === 'MISMATCH' ? (
                            <span className="text-[#FF5C5C]">🚨 MISMATCH</span>
                          ) : (
                            <span className="text-[#59625F]">? NONE</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* "WHY DID SAFENET FLAG THIS APPLICATION" */}
              {/* ═════════════════════════════════════════════════════════════ */}
              <div className="bg-[#080A0B] p-4 rounded-[2px] border border-[rgba(255,255,255,0.06)] space-y-2">
                <span className="text-[11px] uppercase text-[#18E6A3] font-semibold block tracking-wider">
                  WHY SAFENET FLAGGED THIS APPLICATION
                </span>
                <div className="space-y-1.5 text-[12px] text-[#F2F4F3]">
                  {(selectedCandidate.why_flagged || selectedCandidate.evidence || []).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#18E6A3] font-bold">{idx + 1}.</span>
                      <p className="leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* DETERMINISTIC 7-POINT RISK BREAKDOWN MATRIX */}
              {/* ═════════════════════════════════════════════════════════════ */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase text-[#59625F] font-semibold block tracking-wider">
                  DETERMINISTIC RISK CALCULATION METHODOLOGY (0 – 100)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">NAME SIMILARITY</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.name_similarity ?? 0} / 20
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">LOGO SIMILARITY</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.logo_similarity ?? 0} / 20
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">DEV MISMATCH</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.developer_mismatch ?? 0} / 15
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">DESCRIPTION LURES</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.description_similarity ?? 0} / 15
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">PKG COMBOSQUAT</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.package_similarity ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">IDENTITY MISMATCH</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.identity_mismatch ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#59625F] block">SUSPICIOUS SIGNALS</span>
                    <span className="text-[#F2F4F3] font-bold text-[13px]">
                      {selectedCandidate.risk_breakdown?.suspicious_signals ?? 0} / 10
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-2.5 rounded-[2px] border border-[#18E6A3]/30">
                    <span className="text-[#18E6A3] block font-semibold">TOTAL SCORE</span>
                    <span className="text-[#18E6A3] font-bold text-[13px]">
                      {selectedCandidate.risk_score} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Threat History Audit Trail */}
              {selectedCandidate.threat_history && selectedCandidate.threat_history.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-[#18E6A3]" />
                    <span className="text-[11px] uppercase text-[#18E6A3] font-semibold block tracking-wider">
                      THREAT AUDIT TIMELINE
                    </span>
                  </div>
                  <div className="bg-[#080A0B] p-3 rounded-[2px] border border-[rgba(255,255,255,0.06)] space-y-2 text-[11px]">
                    {selectedCandidate.threat_history.map((h, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-[#8A9390] border-b border-[rgba(255,255,255,0.03)] pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <span className="text-[#F2F4F3] font-semibold">{h.event}</span>
                          {h.details && <span className="block text-[10px] text-[#59625F]">{h.details}</span>}
                        </div>
                        <span className="text-[10px] text-[#59625F] shrink-0 font-mono">
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
                  <span className="text-[11px] uppercase text-[#59625F] font-semibold block">
                    PUBLIC STORE LISTING DESCRIPTION
                  </span>
                  <div className="bg-[#080A0B] p-3 rounded-[2px] border border-[rgba(255,255,255,0.05)] text-[11px] text-[#8A9390] max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedCandidate.description}
                  </div>
                </div>
              )}

              {/* Footer Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <a
                  href={selectedCandidate.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[#18E6A3] hover:underline"
                >
                  <span>VIEW PUBLIC STORE LISTING</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="px-5 py-2 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] text-[12px] rounded-[2px] hover:border-[rgba(255,255,255,0.3)] transition-colors cursor-pointer w-full sm:w-auto"
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.18)] w-full max-w-md p-6 rounded-[2px] space-y-4 font-mono text-[#F2F4F3] relative shadow-2xl">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 p-1.5 text-[#8A9390] hover:text-[#F2F4F3] cursor-pointer bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#18E6A3] font-semibold tracking-wider">
                  SCHEDULED APP PERIMETER MONITORING
                </span>
                <h3 className="text-[16px] font-bold">Configure Scan Frequency</h3>
                <p className="text-[12px] text-[#8A9390]">
                  Configure automatic surveillance scans across Google Play for brand &quot;{currentBrand?.name}&quot;.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-[12px]">
                {[
                  { key: 'daily', label: 'Daily (Every 24 hours)' },
                  { key: 'twelve_hours', label: 'High Frequency (Every 12 hours)' },
                  { key: 'weekly', label: 'Weekly Summary (Every 7 days)' },
                  { key: 'manual', label: 'Manual Execution Only' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center justify-between p-3 rounded-[2px] border cursor-pointer transition-colors ${
                      scheduleOption === opt.key
                        ? 'bg-[#18E6A3]/10 border-[#18E6A3] text-[#F2F4F3]'
                        : 'bg-[#080A0B] border-[rgba(255,255,255,0.08)] text-[#8A9390] hover:border-[rgba(255,255,255,0.2)]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <input
                      type="radio"
                      name="schedule"
                      value={opt.key}
                      checked={scheduleOption === opt.key}
                      onChange={() => setScheduleOption(opt.key as any)}
                      className="accent-[#18E6A3]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#8A9390] hover:text-[#F2F4F3] text-[12px] rounded-[2px] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-[#18E6A3] text-[#080A0B] font-bold text-[12px] rounded-[2px] hover:bg-[#18E6A3]/90 cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.18)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-[2px] space-y-4 font-mono text-[#F2F4F3] relative shadow-2xl">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="absolute top-4 right-4 p-1.5 text-[#8A9390] hover:text-[#F2F4F3] cursor-pointer bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#FF5C5C]">
                  <AlertOctagon className="h-5 w-5" />
                  <h3 className="text-[16px] font-bold uppercase">
                    ESCALATE THREAT TO SECURITY QUEUE
                  </h3>
                </div>
                <p className="text-[12px] text-[#8A9390]">
                  Record an internal security action for &quot;{escalateCandidate.app_name}&quot; and prepare evidence for legal takedown.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-[12px]">
                <div>
                  <label className="text-[11px] uppercase text-[#8A9390] block mb-1">
                    PRIMARY ESCALATION REASON:
                  </label>
                  <select
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] p-2.5 rounded-[2px] focus:outline-none focus:border-[#FF5C5C]"
                  >
                    <option value="Potential brand impersonation">Potential brand impersonation</option>
                    <option value="Phishing domain detected">Phishing domain detected</option>
                    <option value="Deceptive credential harvesting">Deceptive credential harvesting</option>
                    <option value="Unauthorized copyright / logo infringement">Unauthorized copyright / logo infringement</option>
                    <option value="Financial fraud / fake customer care lure">Financial fraud / fake customer care lure</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase text-[#8A9390] block mb-1">
                    ANALYST NOTES / EVIDENCE CONTEXT:
                  </label>
                  <textarea
                    value={escalateNotes}
                    onChange={(e) => setEscalateNotes(e.target.value)}
                    placeholder="Enter security reasoning or referral instructions..."
                    rows={3}
                    className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] p-2.5 rounded-[2px] focus:outline-none focus:border-[#FF5C5C] text-[12px]"
                  />
                </div>

                {/* Pre-formatted Notice */}
                <div className="bg-[#080A0B] p-3 rounded-[2px] border border-[rgba(255,255,255,0.06)] text-[11px] space-y-1 text-[#8A9390]">
                  <span className="text-[#18E6A3] font-semibold block">EVIDENCE SUMMARY PREPARED:</span>
                  <div>• Target: {escalateCandidate.app_name} ({escalateCandidate.package_id})</div>
                  <div>• Risk Score: {escalateCandidate.risk_score}/100 ({escalateCandidate.risk_level})</div>
                  <div>• Signals: {escalateCandidate.evidence?.length || 0} indicators documented</div>
                  <div>• Status: Evidence prepared for external reporting.</div>
                </div>
              </div>

              {/* Escalation Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    const noticeText = `To: Google Play Legal & Trademark Enforcement Team\nSubject: Trademark Impersonation Takedown Request - ${escalateCandidate.app_name}\n\nApp: ${escalateCandidate.app_name}\nPublisher: ${escalateCandidate.developer}\nPackage: ${escalateCandidate.package_id}\nURL: ${escalateCandidate.app_url}\nReason: ${escalateReason}`;
                    navigator.clipboard.writeText(noticeText);
                    triggerToast('Takedown notice copied to clipboard.');
                  }}
                  className="px-3 py-2 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#F2F4F3] text-[12px] rounded-[2px] flex items-center gap-2 hover:border-[#18E6A3] transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5 text-[#18E6A3]" />
                  <span>COPY NOTICE</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <a
                    href="https://support.google.com/googleplay/android-developer/contact/takedown"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-[#080A0B] border border-[rgba(255,255,255,0.15)] text-[#8A9390] hover:text-[#F2F4F3] text-[12px] rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>GOOGLE PLAY FORM</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleConfirmEscalation}
                    className="px-4 py-2 bg-[#FF5C5C] text-[#080A0B] text-[12px] font-bold rounded-[2px] hover:bg-[#FF5C5C]/90 transition-colors cursor-pointer"
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
