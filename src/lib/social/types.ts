/**
 * SAFENET Social Media & Brand Impersonation Monitoring - Type Definitions
 * Normalized schemas for brand identity profiles, official identity fingerprints,
 * social candidates, threat classification, and explainable evidence.
 */

export type SocialPlatform = 'youtube' | 'twitter' | 'instagram' | 'facebook' | 'linkedin';

export type ProviderStatusType =
  | 'connected'
  | 'not_configured'
  | 'unauthorized'
  | 'rate_limited'
  | 'error'
  | 'restricted'
  | 'future_source';

export interface SocialHandlesConfig {
  youtube?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  telegram?: string;
}

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'WEAK_MATCH'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'VERIFIED'
  | 'REJECTED'
  | 'UNAVAILABLE';

export interface OfficialProfileCandidate {
  platform: SocialPlatform | 'website';
  name: string;
  username: string;
  url: string;
  confidence: number; // 0 to 100%
  verificationScore: number; // 0 to 100
  verificationStatus: VerificationStatus;
  verificationReason: string;
  signals: {
    nameSimilarity: number;
    usernameSimilarity: number;
    websiteRelationship: boolean;
    crossPlatformConsistency: boolean;
    brandingConsistency: boolean;
    isVerifiedBadge?: boolean;
    reverseLinkToWebsite?: boolean;
    businessContactMatch?: boolean;
  };
  isPrimaryOfficial: boolean;
  avatarUrl?: string;
  trustEvidence?: string[]; // "Why SAFENET trusts this"
  evidence?: EvidenceItem[];
}

export interface EvidenceItem {
  signal: string;
  value: string | number;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  explanation: string;
}

export interface BrandIdentityFingerprint {
  brandName: string;
  aliases: string[];
  officialDomains: string[];
  officialUsernames: string[];
  officialSocialAccounts: Partial<Record<SocialPlatform, string>>;
  knownKeywords: string[];
  knownExternalLinks: string[];
  visualIdentity?: string | null;
  officialProfiles: OfficialProfileCandidate[];
  verifiedProfiles?: OfficialProfileCandidate[];
  confidence: number; // overall identity confidence (0 to 100%)
  verificationStatus: 'UNVERIFIED' | 'WEAK_MATCH' | 'POSSIBLE' | 'LIKELY' | 'STRONGLY_VERIFIED';
  evidence: EvidenceItem[];
  generatedAt: string;
}

export interface BrandIdentityProfile {
  id: string;
  brandName: string;
  officialDomain: string;
  officialUrls: string[];
  officialSocialHandles: SocialHandlesConfig;
  aliases: string[];
  logo?: string | null;
  brandKeywords: string[];
  knownDomains: string[];
  officialDescription?: string;
  fingerprint?: BrandIdentityFingerprint;
  createdAt: string;
  updatedAt: string;
}

export interface SocialCandidate {
  id: string;
  platform: SocialPlatform;
  candidateId: string;
  username: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl?: string;
  description: string;
  externalUrls: string[];
  followers?: number;
  verificationStatus: 'verified' | 'unverified' | 'unknown';
  discoveredAt: string;
  source: string;              // e.g. "YouTube Data API v3", "X API v2", "SAFENET DEMO DATA"
  isDemoData: boolean;
  rawMetadata?: Record<string, any>;
}

export interface ProviderConfigStatus {
  platform: SocialPlatform;
  name: string;
  status: ProviderStatusType;
  enabled: boolean;
  message: string;
  requiresKeys: string[];
}

export interface SocialScanProgress {
  stage:
    | 'idle'
    | 'discovering_identity'
    | 'verifying_official_profiles'
    | 'building_fingerprint'
    | 'generating_variants'
    | 'searching_sources'
    | 'normalizing_candidates'
    | 'comparing_identities'
    | 'analyzing_urls'
    | 'calculating_risk'
    | 'completed'
    | 'error';
  currentStep: string;
  completedSteps: string[];
  totalCandidates: number;
  providerResults: Record<string, { status: string; count: number; message?: string }>;
}

export interface LogoAnalysisSignal {
  status: 'not_available' | 'evaluated' | 'error';
  score?: number; // 0 - 100
  method?: string;
  notes?: string;
}

export interface DomainAnalysisSignal {
  url: string;
  hostname: string;
  isOfficialDomain: boolean;
  isLookalike: boolean;
  similarityScore: number;
  hasSuspiciousKeywords: boolean;
  isHighRiskTld: boolean;
  riskContribution: number;
  details: string[];
}

export type ThreatClassification =
  | 'LIKELY_OFFICIAL'
  | 'LOW_CONCERN'
  | 'SUSPICIOUS'
  | 'HIGH_RISK'
  | 'CRITICAL_THREAT';

export interface SocialRiskResult {
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatClassification: ThreatClassification;
  confidence: number; // 0 - 100
  identityScore: number; // 0 - 100
  domainRiskScore: number; // 0 - 100
  nameSimilarity: number; // 0 - 100
  usernameSimilarity: number; // 0 - 100
  brandingSimilarity: number; // 0 - 100
  logoSimilarity: LogoAnalysisSignal;
  domainAnalysis: DomainAnalysisSignal[];
  officialAccountMatch: boolean;
  isCombosquatting: boolean;
  reasons: string[];
  evidenceList: Array<{
    id: string;
    category: string;
    label: string;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    value?: string;
    details: string;
  }>;
  structuredEvidence: EvidenceItem[];
}

export interface SocialCandidateAnalysis {
  candidate: SocialCandidate;
  matchedBrand: BrandIdentityProfile;
  risk: SocialRiskResult;
  status: 'new' | 'reviewed' | 'watchlist' | 'confirmed_threat';
  updatedAt?: string;
}

export interface SocialProviderResult {
  platform: SocialPlatform;
  provider: string;
  status: 'connected' | 'not_configured' | 'error' | 'rate_limited';
  candidates: SocialCandidate[];
  message?: string;
  queryCount: number;
  executionMs: number;
}
