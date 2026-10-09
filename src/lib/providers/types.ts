/**
 * SAFENET Real Data Provider Architecture - Core Types
 * All external data sources must normalize discovered entities into this schema.
 */

import { ThreatEvidence } from '@/types/brand';

export type ProviderType = 'search' | 'apps' | 'social' | 'web' | 'dns';

export type ProviderStatus = 'connected' | 'not_configured' | 'error' | 'rate_limited';

export interface ProviderHealth {
  id: string;
  name: string;
  type: ProviderType;
  status: ProviderStatus;
  message?: string;
  latencyMs?: number;
  testedAt: string;
}

export interface DiscoveredCandidate {
  id: string;
  source: string;              // e.g. "apple_app_store", "google_play", "twitter", "telegram", "web_search"
  sourceType: 'social' | 'app' | 'domain' | 'web';
  title: string;
  username?: string;
  url: string;
  description?: string;
  imageUrl?: string;
  developer?: string;
  website?: string;
  discoveredAt: string;
  rawData?: Record<string, any>;
  evidence: ThreatEvidence[];
  provider: string;            // e.g. "itunes_search_api", "serper", "tavily", "brave"
  rating?: number;
  reviewCount?: number;
  appId?: string;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessment?: string;
  reasons?: string[];
}

export interface ProviderDiscoveryResult {
  providerId: string;
  providerName: string;
  status: ProviderStatus;
  candidates: DiscoveredCandidate[];
  message?: string;
  queryCount: number;
  executionMs: number;
}

export interface InvestigationProvider {
  id: string;
  name: string;
  type: ProviderType;
  isConfigured(): boolean;
  checkHealth(): Promise<ProviderHealth>;
  discover(context: {
    brandName: string;
    domain: string;
    officialDomains?: string[];
    handles?: Record<string, string>;
    appPackageName?: string;
    officialDevelopers?: string[];
    brandKeywords?: string[];
  }): Promise<ProviderDiscoveryResult>;
}
