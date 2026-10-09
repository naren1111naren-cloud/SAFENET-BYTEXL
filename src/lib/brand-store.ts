import {
  BrandProfile,
  ThreatItem,
  ThreatStatus,
  IncidentReport,
  AlertItem,
  MonitoringStats,
  ThreatTimelineEvent,
} from '@/types/brand';
import {
  NormalizedAppCandidate,
  ThreatLifecycleStatus,
  AppMonitoringConfig,
  ScanResultSummary,
} from '@/lib/apps/types';

const BRAND_STORAGE_KEY = 'safenet_brand_profile';
const THREATS_STORAGE_KEY = 'safenet_threats';
const ALERTS_STORAGE_KEY = 'safenet_alerts';
const INCIDENTS_STORAGE_KEY = 'safenet_incidents';
const MONITORING_STORAGE_KEY = 'safenet_monitoring_stats';
const APP_WATCHLIST_STORAGE_KEY = 'safenet_app_watchlist';
const APP_CANDIDATES_STORAGE_KEY = 'safenet_app_candidates';
const APP_MONITORING_CONFIG_KEY = 'safenet_app_monitoring_config';

let _memoryAppWatchlist: any[] = [];
let _memoryAppCandidates: NormalizedAppCandidate[] = [];
const _memoryAppMonitoringConfig: Record<string, AppMonitoringConfig> = {};

export const PRESET_BRANDS: Record<string, BrandProfile> = {
  PayPal: {
    id: 'brand-paypal',
    name: 'PayPal',
    domain: 'paypal.com',
    officialDomains: ['paypal.com', 'paypal.me'],
    officialDevelopers: ['PayPal Mobile', 'PayPal, Inc.', 'PayPal'],
    handles: {
      twitter: '@PayPal',
      instagram: '@paypal',
    },
    appPackageName: 'com.paypal.android.p2pmobile',
    authorizedAppIds: ['com.paypal.android.p2pmobile', 'com.paypal.merchant.client'],
    brandKeywords: ['PayPal', 'PayPal Mobile', 'PayPal Send Money', 'PayPal Business'],
    officialSupportChannels: ['https://www.paypal.com/help', 'support@paypal.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  Microsoft: {
    id: 'brand-microsoft',
    name: 'Microsoft',
    domain: 'microsoft.com',
    officialDomains: ['microsoft.com', 'live.com', 'office.com'],
    officialDevelopers: ['Microsoft Corporation'],
    handles: {
      twitter: '@Microsoft',
      linkedin: 'company/microsoft',
    },
    appPackageName: 'com.microsoft.office.officehubrow',
    authorizedAppIds: ['com.microsoft.office.officehubrow', 'com.microsoft.teams', 'com.microsoft.emmx'],
    brandKeywords: ['Microsoft', 'Office', 'Windows', 'Teams', 'Azure'],
    officialSupportChannels: ['https://support.microsoft.com', 'mshelps@microsoft.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  Nike: {
    id: 'brand-nike',
    name: 'Nike',
    domain: 'nike.com',
    officialDomains: ['nike.com', 'snkrs.com', 'nike.co.in'],
    officialDevelopers: ['Nike, Inc.', 'Nike Inc.', 'Nike'],
    handles: {
      twitter: '@Nike',
      instagram: '@nike',
      telegram: '@nikesupport',
      linkedin: 'company/nike',
      youtube: 'user/nike',
    },
    appPackageName: 'com.nike.omega',
    authorizedAppIds: ['com.nike.omega', 'com.nike.snkrs', 'com.nike.plus'],
    brandKeywords: ['Nike', 'Just Do It', 'Air Max', 'Air Jordan', 'SNKRS', 'Nike Support'],
    officialSupportChannels: ['https://www.nike.com/help', 'support@nike.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  Paytm: {
    id: 'brand-paytm',
    name: 'Paytm',
    domain: 'paytm.com',
    officialDomains: ['paytm.com', 'paytmbank.com', 'paytmmoney.com'],
    officialDevelopers: ['One97 Communications Limited', 'Paytm', 'Paytm Payments Bank Limited'],
    handles: {
      twitter: '@Paytm',
      instagram: '@paytm',
      telegram: '@paytmofficial',
      linkedin: 'company/paytm',
    },
    appPackageName: 'net.one97.paytm',
    authorizedAppIds: ['net.one97.paytm', 'com.paytmmoney'],
    brandKeywords: ['Paytm', 'Paytm Karo', 'One97', 'Paytm Wallet', 'Paytm Payments Bank'],
    officialSupportChannels: ['https://paytm.com/care', 'care@paytm.com', '1800-120-130'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ApexPay: {
    id: 'brand-apexpay',
    name: 'ApexPay',
    domain: 'apexpay.io',
    officialDomains: ['apexpay.io', 'apexpay.net'],
    officialDevelopers: ['ApexPay Financial Technologies', 'Apex Technologies Inc'],
    handles: {
      twitter: '@ApexPay',
      instagram: '@apexpay',
      telegram: '@apexpay_official',
      linkedin: 'company/apexpay',
    },
    appPackageName: 'io.apexpay.wallet',
    authorizedAppIds: ['io.apexpay.wallet', 'io.apexpay.merchant'],
    brandKeywords: ['ApexPay', 'Apex Wallet', 'Apex Payments', 'ApexPay Help'],
    officialSupportChannels: ['https://apexpay.io/support', 'support@apexpay.io'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const BrandStore = {
  // Brand Management
  getBrand(): BrandProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(BRAND_STORAGE_KEY);
      if (data) return JSON.parse(data);
      // Default to Nike
      const defaultBrand = PRESET_BRANDS['Nike'];
      this.saveBrand(defaultBrand);
      return defaultBrand;
    } catch (e) {
      console.error('Failed to read brand from localStorage', e);
      return PRESET_BRANDS['Nike'];
    }
  },

  saveBrand(profile: BrandProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save brand to localStorage', e);
    }
  },

  loadPreset(name: 'Nike' | 'Paytm'): BrandProfile {
    const preset = PRESET_BRANDS[name] || PRESET_BRANDS['Nike'];
    this.saveBrand(preset);
    return preset;
  },

  // Threats Management
  getThreats(): ThreatItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(THREATS_STORAGE_KEY);
      if (data) return JSON.parse(data);
      return [];
    } catch (e) {
      console.error('Failed to read threats from localStorage', e);
      return [];
    }
  },

  getThreatById(id: string): ThreatItem | null {
    const threats = this.getThreats();
    return threats.find((t) => t.id === id) || null;
  },

  saveThreats(threats: ThreatItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THREATS_STORAGE_KEY, JSON.stringify(threats));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save threats to localStorage', e);
    }
  },

  addThreat(threat: ThreatItem): void {
    const threats = this.getThreats();
    const existingIdx = threats.findIndex((t) => t.id === threat.id);
    if (existingIdx >= 0) {
      threats[existingIdx] = threat;
    } else {
      threats.unshift(threat);
    }
    this.saveThreats(threats);

    // Also trigger an alert if high risk
    if (threat.riskScore >= 60) {
      const calculatedRisk = threat.riskLevel || (threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 60 ? 'HIGH' : threat.riskScore >= 30 ? 'MEDIUM' : 'LOW');
      this.addAlert({
        id: `alert-${Date.now()}`,
        title: `${calculatedRisk} THREAT DETECTED: ${threat.targetAsset}`,
        message: `${threat.type.replace('_', ' ').toUpperCase()} targeting ${threat.brandId} identified with Risk Score: ${threat.riskScore}/100.`,
        riskScore: threat.riskScore,
        riskLevel: calculatedRisk,
        threatId: threat.id,
        threatType: threat.type,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  },

  updateThreatStatus(id: string, status: ThreatStatus, reviewerNotes?: string, analystName: string = 'SOC Analyst (L2)'): ThreatItem | null {
    const threats = this.getThreats();
    const target = threats.find((t) => t.id === id);
    if (!target) return null;

    target.status = status;
    if (reviewerNotes) target.reviewerNotes = reviewerNotes;
    target.assignedAnalyst = analystName;

    // Add timeline event
    const newEvent: ThreatTimelineEvent = {
      id: `evt-review-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      title: `Threat Status Changed to ${status.toUpperCase().replace('_', ' ')}`,
      description: reviewerNotes || `Analyst ${analystName} updated incident status to ${status}.`,
      actor: 'ANALYST',
      type: status === 'resolved' ? 'resolution' : 'review',
    };

    if (!target.timeline) target.timeline = [];
    target.timeline.push(newEvent);

    this.saveThreats(threats);
    return target;
  },

  // Incident Reports
  getIncidents(): IncidentReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read incidents', e);
      return [];
    }
  },

  saveIncident(report: IncidentReport): void {
    if (typeof window === 'undefined') return;
    try {
      const incidents = this.getIncidents();
      const idx = incidents.findIndex((i) => i.id === report.id);
      if (idx >= 0) {
        incidents[idx] = report;
      } else {
        incidents.unshift(report);
      }
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.error('Failed to save incident', e);
    }
  },

  // Alerts
  getAlerts(): AlertItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(ALERTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addAlert(alert: AlertItem): void {
    const alerts = this.getAlerts();
    alerts.unshift(alert);
    if (alerts.length > 20) alerts.pop();
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  },

  markAlertRead(id: string): void {
    const alerts = this.getAlerts();
    const target = alerts.find((a) => a.id === id);
    if (target) {
      target.read = true;
      try {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
    }
  },

  // Monitoring Stats computed dynamically from real profile assets and discovered threats
  getMonitoringStats(): MonitoringStats {
    const brand = this.getBrand();
    const threats = this.getThreats();

    const socialCount = Object.keys(brand?.handles || {}).length + threats.filter((t) => t.type === 'social_profile').length;
    const appCount = (brand?.authorizedAppIds?.length || (brand?.appPackageName ? 1 : 0)) + threats.filter((t) => t.type === 'mobile_app').length;
    const domainCount = (brand?.officialDomains?.length || 1) + threats.filter((t) => t.type === 'domain').length;
    const keywordCount = brand?.brandKeywords?.length || 0;

    const mostRecentThreat = threats.length > 0 ? threats[0].discoveredAt : new Date().toISOString();

    return {
      socialProfilesMonitored: socialCount,
      mobileAppsMonitored: appCount,
      domainsMonitored: domainCount,
      keywordsMonitored: keywordCount,
      lastScanAt: mostRecentThreat,
    };
  },

  clearThreats(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(THREATS_STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
  },

  // Investigations Persistence
  getInvestigations(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('safenet_investigations');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveInvestigation(inv: any): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getInvestigations();
      list.unshift(inv);
      if (list.length > 20) list.pop();
      localStorage.setItem('safenet_investigations', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save investigation', e);
    }
  },

  // App Threat Intelligence Watchlist
  getAppWatchlist(): any[] {
    if (typeof window === 'undefined') return _memoryAppWatchlist;
    try {
      const data = localStorage.getItem(APP_WATCHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAppWatchlist(watchlist: any[]): void {
    if (typeof window === 'undefined') {
      _memoryAppWatchlist = watchlist;
      return;
    }
    try {
      localStorage.setItem(APP_WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save app watchlist', e);
    }
  },

  addToAppWatchlist(app: any): void {
    const list = this.getAppWatchlist();
    const existingIdx = list.findIndex((a) => a.package_id === app.package_id || a.id === app.id);
    const enriched = {
      ...app,
      watchlisted: true,
      watchlisted_at: new Date().toISOString(),
      status: 'watchlist',
    };
    if (existingIdx >= 0) {
      list[existingIdx] = enriched;
    } else {
      list.unshift(enriched);
    }
    this.saveAppWatchlist(list);

    // Also register in central threat store
    this.addThreat({
      id: `threat-app-${app.package_id || app.id}`,
      brandId: `brand-${(app.app_name || 'app').toLowerCase().replace(/\s+/g, '-')}`,
      targetAsset: app.app_name,
      type: 'mobile_app',
      source: 'app_store_monitor',
      riskScore: app.risk_score || 70,
      riskLevel: app.risk_level || 'HIGH',
      status: 'watchlist',
      discoveredAt: new Date().toISOString(),
      reasons: app.why_flagged || app.evidence || ['Added to watchlist from app threat intelligence'],
      iocs: app.package_id ? [{ type: 'domain', value: app.package_id }] : [],
      mobileApp: {
        appName: app.app_name,
        developerName: app.developer,
        packageName: app.package_id,
        appStoreUrl: app.app_url,
        iconUrl: app.icon,
        permissions: [],
        rating: app.rating,
        downloadCount: app.installs,
      },
    });
  },

  removeFromAppWatchlist(identifier: string): void {
    const list = this.getAppWatchlist();
    const filtered = list.filter((a) => a.package_id !== identifier && a.id !== identifier);
    this.saveAppWatchlist(filtered);
  },

  isInAppWatchlist(identifier: string): boolean {
    const list = this.getAppWatchlist();
    return list.some((a) => a.package_id === identifier || a.id === identifier);
  },

  // App Threat Candidates Persistence & Lifecycle
  getStoredAppCandidates(): NormalizedAppCandidate[] {
    if (typeof window === 'undefined') return _memoryAppCandidates;
    try {
      const data = localStorage.getItem(APP_CANDIDATES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStoredAppCandidates(candidates: NormalizedAppCandidate[]): void {
    if (typeof window === 'undefined') {
      _memoryAppCandidates = candidates;
      return;
    }
    try {
      localStorage.setItem(APP_CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save app candidates', e);
    }
  },

  syncAndDeduplicateCandidates(
    incoming: NormalizedAppCandidate[],
    brandKey: string
  ): { candidates: NormalizedAppCandidate[]; summary: ScanResultSummary } {
    const existing = this.getStoredAppCandidates();
    const now = new Date().toISOString();
    let newCount = 0;
    let existingCount = 0;

    const findMatch = (c: NormalizedAppCandidate, list: NormalizedAppCandidate[]): number => {
      return list.findIndex((ex) => {
        if (c.package_id && ex.package_id && c.package_id === ex.package_id) return true;
        if (c.source_id && ex.source_id && c.source_id === ex.source_id) return true;
        if (c.app_url && ex.app_url && c.app_url === ex.app_url) return true;
        const normC = `${(c.app_name || '').toLowerCase().trim()}|${(c.developer || '').toLowerCase().trim()}`;
        const normEx = `${(ex.app_name || '').toLowerCase().trim()}|${(ex.developer || '').toLowerCase().trim()}`;
        return normC === normEx;
      });
    };

    const updatedList = [...existing];

    for (const inc of incoming) {
      const idx = findMatch(inc, updatedList);
      if (idx >= 0) {
        existingCount++;
        const prev = updatedList[idx];
        const prevHistory = prev.threat_history || [];
        const hasHistoryToday = prevHistory.some(
          (h) => new Date(h.timestamp).toDateString() === new Date().toDateString()
        );

        const newHistory = [...prevHistory];
        if (!hasHistoryToday || prev.risk_score !== inc.risk_score) {
          newHistory.unshift({
            timestamp: now,
            event: prev.risk_score !== inc.risk_score
              ? `Risk score updated: ${prev.risk_score} → ${inc.risk_score}/100`
              : 'Scan refreshed - threat identity confirmed',
            details: `Monitored under ${brandKey}. Last verified on Google Play.`,
          });
        }

        updatedList[idx] = {
          ...inc,
          id: prev.id,
          first_seen_at: prev.first_seen_at || prev.last_seen_at || now,
          last_seen_at: now,
          lifecycle_status: prev.lifecycle_status || (inc.risk_score >= 60 ? 'UNDER REVIEW' : 'DISCOVERED'),
          threat_history: newHistory,
          escalation_record: prev.escalation_record,
          watchlisted: prev.watchlisted ?? this.isInAppWatchlist(inc.package_id || inc.id),
        };
      } else {
        newCount++;
        const initialHistory = [
          {
            timestamp: now,
            event: 'Application discovered on Google Play',
            details: `Identified by SAFENET App Threat Intelligence for brand "${brandKey}".`,
          },
          {
            timestamp: now,
            event: `Risk calculated: ${inc.risk_score}/100 (${inc.risk_level})`,
            details: `Confidence: ${inc.confidence_score || 85}%. Signals: ${inc.evidence?.length || 0} indicators detected.`,
          },
        ];

        const newCand: NormalizedAppCandidate = {
          ...inc,
          first_seen_at: now,
          last_seen_at: now,
          lifecycle_status: inc.risk_score >= 80 ? 'CONFIRMED SUSPICIOUS' : inc.risk_score >= 60 ? 'UNDER REVIEW' : 'DISCOVERED',
          threat_history: initialHistory,
          watchlisted: this.isInAppWatchlist(inc.package_id || inc.id),
        };
        updatedList.unshift(newCand);
      }
    }

    this.saveStoredAppCandidates(updatedList);

    // Calculate scan summary metrics
    const highCritical = incoming.filter((c) => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length;
    const potentialImpersonation = incoming.filter((c) => (c.risk_score || 0) >= 60 && !c.is_verified_official).length;
    const newDomains = incoming.filter((c) => (c.extracted_domains?.length || 0) > 0).length;

    const summary: ScanResultSummary = {
      applications_discovered: incoming.length,
      new_candidates: newCount,
      existing_candidates: existingCount,
      high_critical_count: highCritical,
      potential_impersonation_count: potentialImpersonation,
      new_domains_count: newDomains,
      scan_timestamp: now,
    };

    return { candidates: updatedList, summary };
  },

  updateAppThreatStatus(
    identifier: string,
    status: ThreatLifecycleStatus,
    notes?: string
  ): NormalizedAppCandidate | null {
    const list = this.getStoredAppCandidates();
    const idx = list.findIndex((a) => a.package_id === identifier || a.id === identifier);
    if (idx === -1) return null;

    const target = list[idx];
    const now = new Date().toISOString();
    const history = target.threat_history || [];

    history.unshift({
      timestamp: now,
      event: `Status changed to ${status}`,
      details: notes || `Threat lifecycle status updated by security analyst.`,
    });

    target.lifecycle_status = status;
    target.threat_history = history;
    list[idx] = target;
    this.saveStoredAppCandidates(list);

    // Sync to threat store if in threat database
    const threatStatusMap: Record<ThreatLifecycleStatus, ThreatStatus> = {
      'DISCOVERED': 'active',
      'UNDER REVIEW': 'under_review',
      'CONFIRMED SUSPICIOUS': 'confirmed',
      'ESCALATED': 'takedown_requested',
      'RESOLVED': 'resolved',
      'DISMISSED': 'false_positive',
    };
    this.updateThreatStatus(`threat-app-${target.package_id || target.id}`, threatStatusMap[status], notes);

    return target;
  },

  escalateAppThreat(
    identifier: string,
    reason: string,
    notes?: string
  ): NormalizedAppCandidate | null {
    const list = this.getStoredAppCandidates();
    const idx = list.findIndex((a) => a.package_id === identifier || a.id === identifier);
    if (idx === -1) return null;

    const target = list[idx];
    const now = new Date().toISOString();
    const history = target.threat_history || [];

    history.unshift({
      timestamp: now,
      event: 'Internal security escalation initiated',
      details: `Reason: ${reason}. ${notes ? `Notes: ${notes}` : ''}`,
    });

    target.lifecycle_status = 'ESCALATED';
    target.escalation_record = {
      timestamp: now,
      reason,
      risk_score: target.risk_score,
      signals_count: (target.evidence?.length || 0) + (target.impersonation_patterns_detected?.length || 0),
      status: 'ESCALATED',
      notes,
    };
    target.threat_history = history;
    list[idx] = target;
    this.saveStoredAppCandidates(list);

    // Sync to central threats
    this.updateThreatStatus(`threat-app-${target.package_id || target.id}`, 'takedown_requested', `Escalated: ${reason}`);

    return target;
  },

  // App Monitoring Configuration
  getAppMonitoringConfig(brandName: string = 'default'): AppMonitoringConfig {
    const cleanKey = brandName.toLowerCase();
    if (typeof window === 'undefined') {
      return _memoryAppMonitoringConfig[cleanKey] || {
        enabled: true,
        schedule: 'daily',
        last_scan: new Date().toISOString(),
        next_scan: new Date(Date.now() + 86400000).toISOString(),
        scan_status: 'completed',
        total_monitored: 0,
        high_critical_count: 0,
      };
    }

    try {
      const raw = localStorage.getItem(`${APP_MONITORING_CONFIG_KEY}_${cleanKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}

    const defaultCfg: AppMonitoringConfig = {
      enabled: true,
      schedule: 'daily',
      last_scan: new Date().toISOString(),
      next_scan: new Date(Date.now() + 86400000).toISOString(),
      scan_status: 'completed',
      total_monitored: 0,
      high_critical_count: 0,
    };
    return defaultCfg;
  },

  saveAppMonitoringConfig(
    brandName: string,
    config: Partial<AppMonitoringConfig>
  ): AppMonitoringConfig {
    const cleanKey = brandName.toLowerCase();
    const current = this.getAppMonitoringConfig(cleanKey);
    const updated: AppMonitoringConfig = { ...current, ...config };

    if (typeof window === 'undefined') {
      _memoryAppMonitoringConfig[cleanKey] = updated;
      return updated;
    }

    try {
      localStorage.setItem(`${APP_MONITORING_CONFIG_KEY}_${cleanKey}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save monitoring config', e);
    }
    return updated;
  },

  // [DEMO MODE ONLY] Explicit Demo Dataset - Never mixed into live investigation
  generateDemoDataset(brandName: string = 'Nike', domain: string = 'nike.com'): ThreatItem[] {
    const cleanBrand = brandName.toLowerCase();
    const dateStr = new Date().toISOString();

    return [
      // 1. Critical Fake Social Profile (Key Hackathon Demo entity!)
      {
        id: `threat-social-${cleanBrand}-support247`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `@${cleanBrand}_support247`,
        type: 'social_profile',
        source: 'social_crawler',
        riskScore: 94,
        riskLevel: 'CRITICAL',
        status: 'under_review',
        platform: 'twitter',
        campaignId: 'campaign-shadow-refund-ring',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        reasons: [
          `High username similarity with official "${brandName}" identity.`,
          'Bio solicits upfront payment and redirects to unverified Telegram support bot.',
          'Contains unauthorized external link to typosquatted domain.',
          'Newly created unverified account mimicking official logo.',
        ],
        socialProfile: {
          username: `${cleanBrand}_support247`,
          displayName: `${brandName} Customer Support & Refunds 24/7`,
          platform: 'twitter',
          bio: `Official ${brandName} 24x7 Customer Resolution Desk. For instant refund status & promo claims, DM us on WhatsApp: +91 98765 43210 or Telegram @${cleanBrand}_refund_bot. Pay ₹499 verification fee.`,
          profileUrl: `https://${cleanBrand}-reward-support.com/claim`,
          accountAgeDays: 8,
          isVerified: false,
          followersCount: 142,
        },
        iocs: [
          { type: 'upi', value: `${cleanBrand}support@okhdfcbank` },
          { type: 'phone', value: '+919876543210' },
          { type: 'telegram', value: `@${cleanBrand}_refund_bot` },
          { type: 'domain', value: `${cleanBrand}-reward-support.com` },
        ],
        riskBreakdown: {
          usernameSimilarity: 20,
          logoSimilarity: 20,
          bioContentSimilarity: 15,
          suspiciousUrl: 20,
          paymentScamIndicators: 15,
          accountAppBehavior: 4,
          totalScore: 94,
        },
        explainableIndicators: [
          {
            category: 'identity',
            label: 'Identity Resemblance',
            severity: 'CRITICAL',
            status: 'flagged',
            description: `Username "@${cleanBrand}_support247" strongly resembles official brand "${brandName}".`,
          },
          {
            category: 'branding',
            label: 'Brand Asset Impersonation',
            severity: 'CRITICAL',
            status: 'flagged',
            description: `Profile image closely matches registered official ${brandName} logo.`,
          },
          {
            category: 'content',
            label: 'Scam & Financial Lures',
            severity: 'CRITICAL',
            status: 'flagged',
            description: 'Contains payment request (₹499 verification fee) and reverse refund solicitation.',
          },
          {
            category: 'link',
            label: 'Unauthorized External Link',
            severity: 'CRITICAL',
            status: 'flagged',
            description: `External domain "${cleanBrand}-reward-support.com" is an unauthorized lookalike.`,
          },
          {
            category: 'account',
            label: 'Entity Verification & Age',
            severity: 'HIGH',
            status: 'suspicious',
            description: 'Newly registered account (8 days old) without official verification badge.',
          },
          {
            category: 'authorization',
            label: 'Brand Authorization',
            severity: 'CRITICAL',
            status: 'unauthorized',
            description: `Account is not registered in official ${brandName} digital asset baseline.`,
          },
        ],
        evidenceList: [
          {
            id: 'ev-1',
            category: 'Identity',
            title: 'Username Impersonation',
            description: `Handle "@${cleanBrand}_support247" stacks brand trademark with fake support suffix.`,
            severity: 'critical',
            value: `@${cleanBrand}_support247`,
          },
          {
            id: 'ev-2',
            category: 'Financial Risk',
            title: 'UPI Extortion & Advance Fee',
            description: 'Demands advance processing fee to release fake customer compensation.',
            severity: 'critical',
            value: `${cleanBrand}support@okhdfcbank`,
          },
          {
            id: 'ev-3',
            category: 'Infrastructure',
            title: 'Off-Brand Redirection URL',
            description: `Directs users to unverified portal: https://${cleanBrand}-reward-support.com/claim`,
            severity: 'high',
            value: `${cleanBrand}-reward-support.com`,
          },
        ],
        timeline: [
          {
            id: 'evt-1',
            timestamp: '10:21 AM',
            title: 'Threat Discovered',
            description: `Crawler detected fake handle @${cleanBrand}_support247 on Twitter/X.`,
            actor: 'SYSTEM',
            type: 'discovery',
          },
          {
            id: 'evt-2',
            timestamp: '10:22 AM',
            title: 'AI Analysis Started',
            description: 'Deep neural and pattern extraction pipeline initiated.',
            actor: 'AI_ENGINE',
            type: 'analysis',
          },
          {
            id: 'evt-3',
            timestamp: '10:22 AM',
            title: 'Logo & Similarity Detected',
            description: 'Brand emblem matched official trademark with 98% visual confidence.',
            actor: 'AI_ENGINE',
            type: 'analysis',
          },
          {
            id: 'evt-4',
            timestamp: '10:23 AM',
            title: 'Suspicious URL & Payment IOC Identified',
            description: `Extracted lookalike domain and VPA ${cleanBrand}support@okhdfcbank.`,
            actor: 'AI_ENGINE',
            type: 'analysis',
          },
          {
            id: 'evt-5',
            timestamp: '10:23 AM',
            title: 'Risk Score Calculated',
            description: 'Risk Score established at 94/100 (CRITICAL RISK).',
            actor: 'AI_ENGINE',
            type: 'scoring',
          },
          {
            id: 'evt-6',
            timestamp: '10:24 AM',
            title: 'Security Alert Generated',
            description: 'Dispatched incident alert to SOC Analyst queue.',
            actor: 'SYSTEM',
            type: 'alert',
          },
        ],
      },

      // 2. Critical Rogue Mobile App
      {
        id: `threat-app-${cleanBrand}-rewards`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `${brandName} Customer Rewards & Instant Cashback`,
        type: 'mobile_app',
        source: 'app_store_monitor',
        riskScore: 88,
        riskLevel: 'CRITICAL',
        status: 'active',
        campaignId: 'campaign-shadow-refund-ring',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        reasons: [
          `App title mimics official brand "${brandName}".`,
          'Requests dangerous SMS interception and accessibility permissions.',
          'Mismatched unverified developer identity ("Apex Mobile Studio Ltd").',
          'Contains predatory loan and fake cashback payout mechanism.',
        ],
        mobileApp: {
          appName: `${brandName} Customer Rewards & Instant Cashback`,
          developerName: 'Apex Mobile Studio Ltd',
          packageName: `com.${cleanBrand}.rewards.instantcash`,
          appStoreUrl: `https://apkpure-mirror.com/download/com.${cleanBrand}.rewards.instantcash`,
          permissions: [
            'android.permission.RECEIVE_SMS',
            'android.permission.READ_SMS',
            'android.permission.BIND_ACCESSIBILITY_SERVICE',
            'android.permission.SYSTEM_ALERT_WINDOW',
            'android.permission.ACCESS_FINE_LOCATION',
          ],
          description: `Download official ${brandName} Rewards to claim ₹10,000 shopping credits. Instant approval. Requires SMS access for OTP verification.`,
          rating: 2.1,
          downloadCount: '5,000+',
        },
        iocs: [
          { type: 'upi', value: `${cleanBrand}support@okhdfcbank` }, // Shared IOC connecting to fake Twitter profile!
          { type: 'domain', value: `${cleanBrand}-reward-support.com` },
          { type: 'ip', value: '185.220.101.5' },
        ],
        riskBreakdown: {
          usernameSimilarity: 18,
          logoSimilarity: 18,
          bioContentSimilarity: 12,
          suspiciousUrl: 18,
          paymentScamIndicators: 12,
          accountAppBehavior: 10,
          totalScore: 88,
        },
      },

      // 3. High Risk Typosquatting Domain
      {
        id: `threat-domain-${cleanBrand}-reward-support`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `${cleanBrand}-reward-support.com`,
        type: 'domain',
        source: 'urlhaus',
        riskScore: 92,
        riskLevel: 'CRITICAL',
        status: 'active',
        campaignId: 'campaign-shadow-refund-ring',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        reasons: [
          'Combosquatting: Appended deceptive keywords ("reward-support") to legitimate trademark.',
          'Phishing landing page clones official login portal.',
          'Hosted on bulletproof offshore hosting infrastructure.',
        ],
        iocs: [
          { type: 'domain', value: `${cleanBrand}-reward-support.com` },
          { type: 'ip', value: '185.220.101.5' },
          { type: 'asn', value: 'AS44050' },
          { type: 'telegram', value: `@${cleanBrand}_refund_bot` },
        ],
        riskBreakdown: {
          usernameSimilarity: 20,
          logoSimilarity: 20,
          bioContentSimilarity: 15,
          suspiciousUrl: 20,
          paymentScamIndicators: 12,
          accountAppBehavior: 5,
          totalScore: 92,
        },
      },

      // 4. High Risk Scam Content / Post
      {
        id: `threat-content-${cleanBrand}-prize-claim`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `Facebook Sponsored Post: "Claim ₹50,000 ${brandName} Anniversary Grant"`,
        type: 'scam_content',
        source: 'social_crawler',
        riskScore: 78,
        riskLevel: 'HIGH',
        status: 'confirmed',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        reasons: [
          `Promotes unauthorized ${brandName} 2026 Anniversary Grant scheme.`,
          'Requires ₹499 upfront registration fee via UPI.',
          'Employs artificial urgency timer ("Valid for first 500 applicants only").',
        ],
        rawContent: `🎉 Congratulations! You have been selected for the ${brandName} 2026 Anniversary Customer Benefit Grant of ₹50,000. Transfer ₹499 processing fee via UPI to claim immediately. Link: https://${cleanBrand}-grant2026.net`,
        iocs: [
          { type: 'upi', value: 'grantclaim@paytm' },
          { type: 'domain', value: `${cleanBrand}-grant2026.net` },
        ],
        riskBreakdown: {
          usernameSimilarity: 15,
          logoSimilarity: 15,
          bioContentSimilarity: 12,
          suspiciousUrl: 16,
          paymentScamIndicators: 15,
          accountAppBehavior: 5,
          totalScore: 78,
        },
      },

      // 5. Medium Risk Lookalike Telegram Channel
      {
        id: `threat-tg-${cleanBrand}-deals`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `@${cleanBrand}_vip_discounts_bot`,
        type: 'social_profile',
        source: 'simulator',
        riskScore: 54,
        riskLevel: 'MEDIUM',
        status: 'watchlist',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        reasons: [
          'Unofficial Telegram bot offering 90% discounted gift cards.',
          'No official trademark authorization from brand legal team.',
        ],
        iocs: [{ type: 'telegram', value: `@${cleanBrand}_vip_discounts_bot` }],
        riskBreakdown: {
          usernameSimilarity: 14,
          logoSimilarity: 10,
          bioContentSimilarity: 10,
          suspiciousUrl: 10,
          paymentScamIndicators: 10,
          accountAppBehavior: 0,
          totalScore: 54,
        },
      },

      // 6. Low Risk / False Positive Example
      {
        id: `threat-review-${cleanBrand}-fanclub`,
        brandId: `brand-${cleanBrand}`,
        targetAsset: `@${cleanBrand}_sneaker_enthusiasts_india`,
        type: 'social_profile',
        source: 'social_crawler',
        riskScore: 22,
        riskLevel: 'LOW',
        status: 'false_positive',
        discoveredAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
        reasons: [
          'Unofficial fan discussion community.',
          'Clear disclaimer stated in bio: "Fan account, not affiliated with brand".',
          'No payment solicitations or malicious redirects.',
        ],
        iocs: [],
        riskBreakdown: {
          usernameSimilarity: 12,
          logoSimilarity: 0,
          bioContentSimilarity: 5,
          suspiciousUrl: 0,
          paymentScamIndicators: 0,
          accountAppBehavior: 5,
          totalScore: 22,
        },
      },
    ];
  },

  seedDemoDataset(brandName: string, domain: string): void {
    const dataset = this.generateDemoDataset(brandName, domain);
    this.saveThreats(dataset);
  },
};
