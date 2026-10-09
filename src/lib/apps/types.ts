/**
 * SAFENET App Threat Intelligence - Data Types
 * Models for Google Play monitoring, APK static analysis, and threat correlation.
 */

export interface NormalizedAppCandidate {
  id: string;
  app_name: string;
  developer: string;
  package_id: string;
  description: string;
  icon: string;
  rating?: number;
  reviews?: number;
  installs?: string;
  app_url: string;
  source: string;
  source_id?: string;

  // Official Identification
  official_candidate: boolean | 'unknown';
  is_verified_official: boolean;

  // Deterministic Risk Engine
  risk_score: number; // 0 - 100
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  risk_breakdown: {
    name_similarity: number;        // 0 - 20
    logo_similarity: number;        // 0 - 20
    developer_mismatch: number;     // 0 - 15
    description_similarity: number; // 0 - 15
    package_similarity: number;     // 0 - 10
    identity_mismatch: number;      // 0 - 10
    suspicious_signals: number;     // 0 - 10
    total: number;                  // 0 - 100
  };

  evidence: string[];
  impersonation_patterns_detected: string[];
  logo_similarity_status: string;
  logo_similarity_score?: number;
  verdict_summary: string;

  // Actionable Security Workflow Additions
  identity_comparison?: AppIdentityComparison;
  why_flagged?: string[];
  extracted_domains?: string[];
  domain_correlation?: Array<{ domain: string; risk_score: number; risk_level: string; findings: string[] }>;
  status?: 'active' | 'under_review' | 'watchlist' | 'resolved';
  watchlisted?: boolean;
  watchlisted_at?: string;

  // Digital Risk Protection 2.0 - Lifecycle, History & Metrics
  first_seen_at?: string;
  discovered_at?: string;
  last_seen_at?: string;
  lifecycle_status?: ThreatLifecycleStatus;
  threat_history?: ThreatHistoryItem[];
  escalation_record?: EscalationRecord;
  confidence_score?: number; // 0 - 100%
}

export type ThreatLifecycleStatus =
  | 'DISCOVERED'
  | 'UNDER REVIEW'
  | 'CONFIRMED SUSPICIOUS'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'DISMISSED';

export interface ThreatHistoryItem {
  timestamp: string;
  event: string;
  details?: string;
}

export interface EscalationRecord {
  timestamp: string;
  reason: string;
  risk_score: number;
  signals_count: number;
  status: 'ESCALATED' | 'INTERNAL_QUEUE';
  notes?: string;
}

export interface AppMonitoringConfig {
  enabled: boolean;
  schedule: 'daily' | 'twelve_hours' | 'weekly' | 'manual';
  last_scan: string | null;
  next_scan: string | null;
  scan_status: 'idle' | 'scanning' | 'completed' | 'error';
  total_monitored: number;
  high_critical_count: number;
}

export interface ScanResultSummary {
  applications_discovered: number;
  new_candidates: number;
  existing_candidates: number;
  high_critical_count: number;
  potential_impersonation_count: number;
  new_domains_count: number;
  scan_timestamp: string;
}

export type IdentitySignalState = 'MATCH' | 'SIMILAR' | 'MISMATCH' | 'UNKNOWN';

export interface AppIdentityComparison {
  app_name: { official: string; candidate: string; status: IdentitySignalState; details: string };
  developer: { official: string; candidate: string; status: IdentitySignalState; details: string };
  logo: { official?: string; candidate?: string; status: IdentitySignalState; details: string };
  package_id: { official: string; candidate: string; status: IdentitySignalState; details: string };
  description: { official?: string; candidate: string; status: IdentitySignalState; details: string };
  domain: { official?: string; candidate?: string; status: IdentitySignalState; details: string };
}

export interface AppSearchResponse {
  query: string;
  country: string;
  results_count: number;
  official_candidate_found: boolean;
  official_candidate_name?: string;
  official_developer?: string;
  candidates: NormalizedAppCandidate[];
  provider: {
    name: 'SerpApi Google Play';
    status: 'connected' | 'error' | 'not_configured';
    cached?: boolean;
    latency_ms: number;
  };
}

export interface ApkStaticAnalysisResult {
  file_name: string;
  file_size_bytes: number;
  sha256_hash: string;
  package_id: string;
  application_label: string;
  version_name: string;
  version_code: number;
  min_sdk_version?: number;
  target_sdk_version?: number;
  permissions: {
    total_count: number;
    sensitive_count: number;
    all: string[];
    sensitive: {
      permission: string;
      risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      description: string;
    }[];
  };
  components: {
    activities_count: number;
    services_count: number;
    receivers_count: number;
    activities: string[];
    services: string[];
    receivers: string[];
  };
  extracted_urls: string[];
  extracted_domains: string[];
  has_v1_signature: boolean;
  raw_strings_sample: string[];
}

export interface ApkCorrelationReport {
  apk: ApkStaticAnalysisResult;
  store_match: {
    verdict: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'UNKNOWN';
    matched_app?: NormalizedAppCandidate;
    details: string;
  };
  domain_intelligence: {
    total_domains_scanned: number;
    high_risk_domains: {
      domain: string;
      risk_score: number;
      risk_level: string;
      reasons: string[];
    }[];
    max_domain_risk: number;
  };
  apk_risk_score: number;
  combined_risk_score: number;
  combined_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessment_verdict: string;
  evidence: string[];
}
