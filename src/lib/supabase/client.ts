/**
 * SAFENET - Supabase Data Access Client
 * Native, resilient PostgREST client for interacting with Supabase PostgreSQL backend.
 * Zero external package dependency (bypasses enterprise npm proxy restrictions).
 */

import {
  DbBrand,
  DbBrandDomain,
  DbBrandSocialProfile,
  DbBrandApplication,
  DbBrandAlias,
  DbBrandAnalysisRun,
  DbBrandEvidence,
  FullBrandBaseline,
} from './types';

export class SupabaseClient {
  private baseUrl: string;
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    this.apiKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
    this.isConfigured = Boolean(
      this.baseUrl &&
      this.apiKey &&
      !this.baseUrl.includes('...') &&
      this.baseUrl.startsWith('http')
    );
  }

  getIsConfigured(): boolean {
    const url = this.getBaseUrl();
    const key = this.getApiKey();
    return Boolean(url && key && !url.includes('...') && url.startsWith('http'));
  }

  getBaseUrl(): string {
    return (process.env.SUPABASE_URL || this.baseUrl || '').replace(/\/+$/, '');
  }

  getApiKey(): string {
    return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY || this.apiKey || '';
  }

  private getHeaders(prefer: string = 'return=representation'): HeadersInit {
    const key = this.getApiKey();
    return {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': prefer,
    };
  }

  /**
   * Performs health check against Supabase instance.
   */
  async checkHealth(): Promise<{
    connected: boolean;
    authStatus: string;
    schemaStatus: string;
    message: string;
    tablesFound: string[];
  }> {
    if (!this.isConfigured) {
      return {
        connected: false,
        authStatus: 'not_configured',
        schemaStatus: 'not_configured',
        message: 'SUPABASE_URL or API keys are not configured in environment variables.',
        tablesFound: [],
      };
    }

    try {
      // 1. Check Auth Endpoint
      const authRes = await fetch(`${this.baseUrl}/auth/v1/health`, {
        headers: { apikey: this.apiKey },
      });

      const authConnected = authRes.ok;

      // 2. Check if SAFENET tables exist in PostgREST schema cache
      const tablesToCheck = ['brands', 'brand_domains', 'brand_social_profiles', 'brand_applications', 'brand_analysis_runs'];
      const tablesFound: string[] = [];

      for (const t of tablesToCheck) {
        try {
          const res = await fetch(`${this.baseUrl}/rest/v1/${t}?select=count&limit=1`, {
            headers: this.getHeaders('count=exact'),
          });
          if (res.ok) {
            tablesFound.push(t);
          }
        } catch {
          // Table check failed
        }
      }

      const schemaReady = tablesFound.includes('brands');

      return {
        connected: authConnected,
        authStatus: authConnected ? 'operational' : `auth_error_${authRes.status}`,
        schemaStatus: schemaReady ? 'migrated' : 'pending_migration',
        message: schemaReady
          ? `Connected to Supabase. All core SAFENET tables available (${tablesFound.join(', ')}).`
          : `Connected to Supabase endpoint (${this.baseUrl}), but database tables are pending migration. Run supabase/migrations/20261008000000_safenet_brand_schema.sql.`,
        tablesFound,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        authStatus: 'unreachable',
        schemaStatus: 'unknown',
        message: `Failed to connect to Supabase: ${msg}`,
        tablesFound: [],
      };
    }
  }

  /**
   * Inserts a record into any table via PostgREST.
   */
  async insertRecord<T = any>(table: string, record: any): Promise<T | null> {
    if (!this.getIsConfigured()) return null;
    try {
      const res = await fetch(`${this.getBaseUrl()}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.getHeaders('return=representation'),
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data[0] : data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Upsert a Brand into the brands table.
   */
  async upsertBrand(brand: DbBrand): Promise<DbBrand | null> {
    if (!this.isConfigured) return null;

    try {
      // Check existing by domain
      const cleanDomain = brand.domain.toLowerCase().trim();
      const existingRes = await fetch(
        `${this.baseUrl}/rest/v1/brands?domain=eq.${encodeURIComponent(cleanDomain)}&select=*`,
        { headers: this.getHeaders() }
      );

      if (existingRes.ok) {
        const existingData: DbBrand[] = await existingRes.json();
        if (existingData.length > 0) {
          const existing = existingData[0];
          // Update
          const updateRes = await fetch(
            `${this.baseUrl}/rest/v1/brands?id=eq.${existing.id}`,
            {
              method: 'PATCH',
              headers: this.getHeaders('return=representation'),
              body: JSON.stringify({
                name: brand.name,
                logo_url: brand.logo_url,
                description: brand.description,
                status: brand.status,
                updated_at: new Date().toISOString(),
              }),
            }
          );
          if (updateRes.ok) {
            const updated: DbBrand[] = await updateRes.json();
            return updated[0] || existing;
          }
        }
      }

      // Insert new
      const insertRes = await fetch(`${this.baseUrl}/rest/v1/brands`, {
        method: 'POST',
        headers: this.getHeaders('return=representation'),
        body: JSON.stringify({
          name: brand.name,
          domain: cleanDomain,
          logo_url: brand.logo_url,
          description: brand.description,
          status: brand.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      if (insertRes.ok) {
        const created: DbBrand[] = await insertRes.json();
        return created[0] || null;
      }
      return null;
    } catch (err) {
      console.warn('[SupabaseClient] upsertBrand error:', err);
      return null;
    }
  }

  /**
   * Retrieves a Brand by domain.
   */
  async getBrandByDomain(domain: string): Promise<DbBrand | null> {
    if (!this.isConfigured) return null;
    try {
      const cleanDomain = domain.toLowerCase().trim();
      const res = await fetch(
        `${this.baseUrl}/rest/v1/brands?domain=eq.${encodeURIComponent(cleanDomain)}&select=*`,
        { headers: this.getHeaders() }
      );
      if (!res.ok) return null;
      const data: DbBrand[] = await res.json();
      return data[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Syncs discovered or official domains for a brand.
   */
  async syncBrandDomains(brandId: string, domains: DbBrandDomain[]): Promise<DbBrandDomain[]> {
    if (!this.isConfigured || domains.length === 0) return [];
    try {
      const payload = domains.map((d) => ({
        brand_id: brandId,
        domain: d.domain.toLowerCase().trim(),
        is_primary: Boolean(d.is_primary),
        status: d.status,
        source: d.source,
        confidence: d.confidence,
        updated_at: new Date().toISOString(),
      }));

      const res = await fetch(`${this.baseUrl}/rest/v1/brand_domains`, {
        method: 'POST',
        headers: {
          ...this.getHeaders('resolution=merge-duplicates,return=representation'),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Syncs social profiles for a brand.
   */
  async syncBrandSocialProfiles(brandId: string, profiles: DbBrandSocialProfile[]): Promise<DbBrandSocialProfile[]> {
    if (!this.isConfigured || profiles.length === 0) return [];
    try {
      const payload = profiles.map((p) => ({
        brand_id: brandId,
        platform: p.platform.toLowerCase().trim(),
        url: p.url,
        username: p.username.trim(),
        status: p.status,
        source: p.source,
        confidence: p.confidence,
        evidence_url: p.evidence_url,
        updated_at: new Date().toISOString(),
      }));

      const res = await fetch(`${this.baseUrl}/rest/v1/brand_social_profiles`, {
        method: 'POST',
        headers: {
          ...this.getHeaders('resolution=merge-duplicates,return=representation'),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Syncs mobile applications for a brand.
   */
  async syncBrandApplications(brandId: string, apps: DbBrandApplication[]): Promise<DbBrandApplication[]> {
    if (!this.isConfigured || apps.length === 0) return [];
    try {
      const payload = apps.map((a) => ({
        brand_id: brandId,
        name: a.name,
        store: a.store,
        store_url: a.store_url,
        package_id: a.package_id,
        developer: a.developer,
        status: a.status,
        source: a.source,
        confidence: a.confidence,
        updated_at: new Date().toISOString(),
      }));

      const res = await fetch(`${this.baseUrl}/rest/v1/brand_applications`, {
        method: 'POST',
        headers: this.getHeaders('return=representation'),
        body: JSON.stringify(payload),
      });

      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Syncs brand aliases.
   */
  async syncBrandAliases(brandId: string, aliases: DbBrandAlias[]): Promise<DbBrandAlias[]> {
    if (!this.isConfigured || aliases.length === 0) return [];
    try {
      const payload = aliases.map((a) => ({
        brand_id: brandId,
        alias: a.alias.trim(),
        source: a.source,
        confidence: a.confidence,
      }));

      const res = await fetch(`${this.baseUrl}/rest/v1/brand_aliases`, {
        method: 'POST',
        headers: {
          ...this.getHeaders('resolution=merge-duplicates,return=representation'),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Inserts structured evidence logs.
   */
  async insertEvidence(evidenceList: DbBrandEvidence[]): Promise<DbBrandEvidence[]> {
    if (!this.isConfigured || evidenceList.length === 0) return [];
    try {
      const payload = evidenceList.map((e) => ({
        brand_id: e.brand_id,
        analysis_run_id: e.analysis_run_id,
        type: e.type,
        title: e.title,
        description: e.description,
        value: e.value,
        source_url: e.source_url,
        source_type: e.source_type,
        confidence: e.confidence,
        severity: e.severity,
        retrieved_at: e.retrieved_at || new Date().toISOString(),
      }));

      const res = await fetch(`${this.baseUrl}/rest/v1/brand_evidence`, {
        method: 'POST',
        headers: this.getHeaders('return=representation'),
        body: JSON.stringify(payload),
      });

      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Records an official website analysis execution run.
   */
  async recordAnalysisRun(run: DbBrandAnalysisRun): Promise<DbBrandAnalysisRun | null> {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/brand_analysis_runs`, {
        method: 'POST',
        headers: this.getHeaders('return=representation'),
        body: JSON.stringify({
          brand_id: run.brand_id,
          target_website: run.target_website,
          brand_name_query: run.brand_name_query,
          status: run.status,
          signals: run.signals || [],
          provider_status: run.provider_status || {},
          raw_metadata: run.raw_metadata || {},
          error_message: run.error_message,
          started_at: run.started_at,
          completed_at: run.completed_at || new Date().toISOString(),
        }),
      });

      if (!res.ok) return null;
      const created: DbBrandAnalysisRun[] = await res.json();
      return created[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the full authoritative baseline for a brand including domains, social profiles, apps, and evidence.
   */
  async getFullBrandBaseline(domainOrName: string): Promise<FullBrandBaseline | null> {
    if (!this.isConfigured) return null;

    try {
      const brand = await this.getBrandByDomain(domainOrName);
      if (!brand || !brand.id) return null;

      const [domainsRes, socialsRes, appsRes, aliasesRes, evidenceRes] = await Promise.all([
        fetch(`${this.baseUrl}/rest/v1/brand_domains?brand_id=eq.${brand.id}&select=*`, { headers: this.getHeaders() }),
        fetch(`${this.baseUrl}/rest/v1/brand_social_profiles?brand_id=eq.${brand.id}&select=*`, { headers: this.getHeaders() }),
        fetch(`${this.baseUrl}/rest/v1/brand_applications?brand_id=eq.${brand.id}&select=*`, { headers: this.getHeaders() }),
        fetch(`${this.baseUrl}/rest/v1/brand_aliases?brand_id=eq.${brand.id}&select=*`, { headers: this.getHeaders() }),
        fetch(`${this.baseUrl}/rest/v1/brand_evidence?brand_id=eq.${brand.id}&select=*&order=retrieved_at.desc&limit=20`, { headers: this.getHeaders() }),
      ]);

      const domains: DbBrandDomain[] = domainsRes.ok ? await domainsRes.json() : [];
      const socialProfiles: DbBrandSocialProfile[] = socialsRes.ok ? await socialsRes.json() : [];
      const applications: DbBrandApplication[] = appsRes.ok ? await appsRes.json() : [];
      const aliases: DbBrandAlias[] = aliasesRes.ok ? await aliasesRes.json() : [];
      const evidence: DbBrandEvidence[] = evidenceRes.ok ? await evidenceRes.json() : [];

      return {
        brand,
        domains,
        socialProfiles,
        applications,
        aliases,
        evidence,
      };
    } catch {
      return null;
    }
  }
}

export const supabaseClient = new SupabaseClient();
