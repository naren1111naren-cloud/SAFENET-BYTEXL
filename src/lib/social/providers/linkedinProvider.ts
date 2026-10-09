/**
 * SAFENET LinkedIn Impersonation Discovery Provider
 * Uses LinkedIn Community API / Organization Search to identify fake company pages.
 * Returns honest not_configured status if LINKEDIN_ACCESS_TOKEN is missing.
 */

import { BrandIdentityProfile, SocialCandidate, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';

export class LinkedInProvider implements SocialCandidateProvider {
  platform = 'linkedin' as const;
  name = 'LinkedIn Community API';

  private getAccessToken(): string | null {
    return process.env.LINKEDIN_ACCESS_TOKEN?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.getAccessToken());
  }

  async searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult> {
    const start = Date.now();
    const token = this.getAccessToken();

    if (!token) {
      return {
        platform: this.platform,
        provider: this.name,
        status: 'not_configured',
        candidates: [],
        message: 'LinkedIn access token is not configured. Set LINKEDIN_ACCESS_TOKEN in .env.local to enable live LinkedIn page discovery.',
        queryCount: 0,
        executionMs: 0,
      };
    }

    const candidates: SocialCandidate[] = [];
    let executedQueries = 0;

    for (const query of searchQueries.slice(0, 2)) {
      try {
        executedQueries++;
        const endpoint = `https://api.linkedin.com/v2/search?q=companies&keywords=${encodeURIComponent(query)}`;

        const res = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          continue;
        }

        const data = await res.json();
        const elements = Array.isArray(data.elements) ? data.elements : [];

        for (const el of elements) {
          const companyId = el.id || String(Date.now());
          const name = el.name || query;
          const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

          candidates.push({
            id: `li-${companyId}`,
            platform: 'linkedin',
            candidateId: companyId,
            username: slug,
            displayName: name,
            profileUrl: `https://www.linkedin.com/company/${slug}`,
            description: el.description || '',
            externalUrls: el.websiteUrl ? [el.websiteUrl] : [],
            verificationStatus: 'unknown',
            discoveredAt: new Date().toISOString(),
            source: 'LinkedIn Community API',
            isDemoData: false,
            rawMetadata: {
              companyId,
              searchQuery: query,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[SAFENET LinkedIn Provider] Query "${query}" failed:`, err?.message || err);
      }
    }

    return {
      platform: this.platform,
      provider: this.name,
      status: 'connected',
      candidates,
      queryCount: executedQueries,
      executionMs: Date.now() - start,
    };
  }
}
