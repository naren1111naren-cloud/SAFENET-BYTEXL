export interface SocialHandles {
  twitter?: string;
  instagram?: string;
  telegram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  domain: string;
  officialDomains?: string[];
  handles: SocialHandles;
  appPackageName?: string;
  authorizedAppIds?: string[];
  officialDevelopers?: string[];
  brandKeywords?: string[];
  officialSupportChannels?: string[];
  logoDataUrl?: string;
  logoFileName?: string;
  logoUrl?: string;
  aliases?: string[];
  brandDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredSocialProfile {
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'telegram' | 'tiktok' | 'github' | 'other';
  url: string;
  username: string;
  source: 'official_website' | 'organization_schema' | 'search_provider' | 'user_input';
  confidence: 'high' | 'medium' | 'low';
  evidenceUrl: string;
  confirmed?: boolean;
}

export interface DiscoveredApplication {
  name: string;
  store: 'Google Play' | 'Apple App Store';
  storeUrl: string;
  packageId?: string;
  developer?: string;
  source: 'official_website' | 'search_provider' | 'app_store_monitor';
  confidence: 'high' | 'medium' | 'low';
  confirmed?: boolean;
}

export interface IdentitySignal {
  name: string;
  status: 'verified' | 'detected' | 'not_found';
  description: string;
}

export interface DiscoveredBrandIdentity {
  brandName: string;
  legalName?: string;
  officialWebsite: string;
  canonicalDomain: string;
  logoUrl?: string;
  logoSource?: 'organization_schema' | 'og_image' | 'apple_touch_icon' | 'favicon' | 'user_input';
  logoConfidence?: 'high' | 'medium' | 'low';
  description?: string;
  aliases: string[];
  domains: Array<{ domain: string; source: string; confidence: 'high' | 'medium' | 'low' }>;
  socialProfiles: DiscoveredSocialProfile[];
  applications: DiscoveredApplication[];
  signals: IdentitySignal[];
  evidence: ThreatEvidence[];
  providerStatus: Record<string, any>;
  discoveredAt: string;
}

export type ThreatSource = 'simulator' | 'openphish' | 'urlhaus' | 'phishunt' | 'live_check' | 'social_crawler' | 'app_store_monitor';
export type ThreatType = 'social_profile' | 'mobile_app' | 'scam_content' | 'domain' | 'phishing_feed';
export type ThreatStatus = 'active' | 'under_review' | 'investigating' | 'takedown_requested' | 'confirmed' | 'false_positive' | 'resolved' | 'watchlist';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ThreatIOC {
  type: 'upi' | 'phone' | 'telegram' | 'domain' | 'ip' | 'asn';
  value: string;
}

export interface RiskScoreBreakdown {
  usernameSimilarity: number;      // 0 - 20
  logoSimilarity: number;          // 0 - 20
  bioContentSimilarity: number;    // 0 - 15
  suspiciousUrl: number;           // 0 - 20
  paymentScamIndicators: number;   // 0 - 15
  accountAppBehavior: number;      // 0 - 10
  totalScore: number;              // 0 - 100
}

export interface ExplainableIndicator {
  category: 'identity' | 'branding' | 'content' | 'link' | 'account' | 'authorization';
  label: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'flagged' | 'suspicious' | 'clean' | 'unauthorized';
  description: string;
}

export interface ThreatEvidence {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  value?: string;
  status?: 'available' | 'unavailable' | 'not_applicable';
  source?: string;
}

export interface ThreatTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: 'SYSTEM' | 'AI_ENGINE' | 'ANALYST';
  type: 'discovery' | 'analysis' | 'scoring' | 'alert' | 'review' | 'resolution' | 'takedown';
}

export interface SocialProfileEntity {
  username: string;
  displayName: string;
  platform: 'twitter' | 'instagram' | 'telegram' | 'facebook' | 'linkedin' | 'youtube' | 'other';
  bio?: string;
  profileUrl?: string;
  avatarUrl?: string;
  accountAgeDays?: number;
  isVerified?: boolean;
  followersCount?: number;
}

export interface MobileAppEntity {
  appName: string;
  developerName: string;
  packageName: string;
  appStoreUrl?: string;
  iconUrl?: string;
  permissions: string[];
  description?: string;
  rating?: number;
  downloadCount?: string;
}

export interface ThreatItem {
  id: string;
  brandId: string;
  targetAsset: string;
  type: ThreatType;
  source: ThreatSource;
  riskScore: number;
  riskLevel?: RiskLevel;
  reasons: string[];
  iocs: ThreatIOC[];
  discoveredAt: string;
  status: ThreatStatus;
  campaignId?: string;
  rawContent?: string;
  platform?: string;
  assignedAnalyst?: string;
  reviewerNotes?: string;
  
  // Enriched entity metadata
  socialProfile?: SocialProfileEntity;
  mobileApp?: MobileAppEntity;
  
  // Explainability & Scoring
  aiAnalysis?: string;
  riskBreakdown?: RiskScoreBreakdown;
  explainableIndicators?: ExplainableIndicator[];
  evidenceList?: ThreatEvidence[];
  timeline?: ThreatTimelineEvent[];
}

export interface CampaignCluster {
  id: string;
  name: string;
  primaryIoc: ThreatIOC;
  threatCount: number;
  totalRiskScore: number;
  threatItemIds: string[];
  firstSeen: string;
}

export interface IncidentReport {
  id: string;
  threatId: string;
  brandName: string;
  targetAsset: string;
  threatType: ThreatType;
  riskScore: number;
  riskLevel: RiskLevel;
  generatedAt: string;
  analystName: string;
  decision: 'CONFIRMED_THREAT' | 'FALSE_POSITIVE' | 'ESCALATE_TAKEDOWN' | 'WATCHLIST' | 'RESOLVED';
  reviewerNotes: string;
  executiveSummary: string;
  evidence: ThreatEvidence[];
  timeline: ThreatTimelineEvent[];
  recommendedActions: string[];
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  riskScore: number;
  riskLevel: RiskLevel;
  threatId: string;
  threatType: ThreatType;
  createdAt: string;
  read: boolean;
}

export interface MonitoringStats {
  socialProfilesMonitored: number;
  mobileAppsMonitored: number;
  domainsMonitored: number;
  keywordsMonitored: number;
  lastScanAt: string;
}
