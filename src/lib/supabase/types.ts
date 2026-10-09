/**
 * SAFENET - Supabase Database Types
 * Definitions matching the 20261008000000_safenet_brand_schema.sql migration.
 */

export interface DbBrand {
  id?: string;
  name: string;
  domain: string;
  logo_url?: string | null;
  description?: string | null;
  status: 'active' | 'archived' | 'monitoring';
  created_at?: string;
  updated_at?: string;
}

export interface DbBrandDomain {
  id?: string;
  brand_id: string;
  domain: string;
  is_primary: boolean;
  status: 'official' | 'discovered' | 'unverified' | 'suspicious';
  source: string;
  confidence: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
}

export interface DbBrandSocialProfile {
  id?: string;
  brand_id: string;
  platform: string;
  url: string;
  username: string;
  status: 'official' | 'discovered' | 'unverified' | 'suspicious';
  source: string;
  confidence: 'high' | 'medium' | 'low';
  evidence_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbBrandApplication {
  id?: string;
  brand_id: string;
  name: string;
  store: string;
  store_url: string;
  package_id?: string | null;
  developer?: string | null;
  status: 'official' | 'discovered' | 'unverified' | 'suspicious';
  source: string;
  confidence: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
}

export interface DbBrandAlias {
  id?: string;
  brand_id: string;
  alias: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  created_at?: string;
}

export interface DbBrandAnalysisRun {
  id?: string;
  brand_id?: string | null;
  target_website: string;
  brand_name_query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  signals: any[];
  provider_status: Record<string, any>;
  raw_metadata: Record<string, any>;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface DbBrandEvidence {
  id?: string;
  brand_id: string;
  analysis_run_id?: string | null;
  type: string;
  title: string;
  description?: string | null;
  value?: string | null;
  source_url?: string | null;
  source_type: string;
  confidence: 'high' | 'medium' | 'low';
  severity: 'critical' | 'high' | 'medium' | 'low';
  retrieved_at?: string;
}

export interface FullBrandBaseline {
  brand: DbBrand;
  domains: DbBrandDomain[];
  socialProfiles: DbBrandSocialProfile[];
  applications: DbBrandApplication[];
  aliases: DbBrandAlias[];
  evidence: DbBrandEvidence[];
}
