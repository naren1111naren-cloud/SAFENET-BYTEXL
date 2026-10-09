/**
 * SAFENET Meta Discovery Provider (Instagram & Facebook Pages)
 * Connects to Meta Graph API for public brand pages and business accounts.
 * Returns honest not_configured status if META_ACCESS_TOKEN is missing.
 */

import { BrandIdentityProfile, SocialCandidate, SocialPlatform, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';

export class MetaProvider implements SocialCandidateProvider {
  platform: SocialPlatform;
  name: string;
  private targetPlatform: 'instagram' | 'facebook';

  constructor(targetPlatform: 'instagram' | 'facebook' = 'instagram') {
    this.targetPlatform = targetPlatform;
    this.platform = targetPlatform;
    this.name = targetPlatform === 'instagram' ? 'Instagram (Meta Graph API)' : 'Facebook Pages (Meta Graph API)';
  }

  private getAccessToken(): string | null {
    return process.env.META_ACCESS_TOKEN?.trim() || null;
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
        message: `${this.name} access token is not configured. Set META_ACCESS_TOKEN in .env.local to enable live discovery.`,
        queryCount: 0,
        executionMs: 0,
      };
    }

    const candidates: SocialCandidate[] = [];
    const seenIds = new Set<string>();
    let executedQueries = 0;

    for (const query of searchQueries.slice(0, 2)) {
      try {
        executedQueries++;
        // Use Meta Graph API endpoint for page / ig search
        const endpoint = `https://graph.facebook.com/v19.0/pages/search?q=${encodeURIComponent(query)}&fields=id,name,link,picture,verification_status,about,website&access_token=${encodeURIComponent(token)}`;

        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          if (res.status === 400 || res.status === 403) {
            return {
              platform: this.platform,
              provider: this.name,
              status: 'error',
              candidates,
              message: 'Meta Graph API returned authentication error or permissions required.',
              queryCount: executedQueries,
              executionMs: Date.now() - start,
            };
          }
          continue;
        }

        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];

        for (const item of items) {
          if (!item.id || seenIds.has(item.id)) continue;
          seenIds.add(item.id);

          const username = (item.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const extUrls: string[] = [];
          if (item.website) extUrls.push(item.website);

          candidates.push({
            id: `meta-${this.targetPlatform}-${item.id}`,
            platform: this.platform,
            candidateId: item.id,
            username: `@${username}`,
            displayName: item.name || 'Meta Candidate',
            profileUrl: item.link || (this.targetPlatform === 'instagram' ? `https://instagram.com/${username}` : `https://facebook.com/${item.id}`),
            profileImageUrl: item.picture?.data?.url,
            description: item.about || '',
            externalUrls: extUrls,
            verificationStatus: item.verification_status === 'blue_verified' ? 'verified' : 'unverified',
            discoveredAt: new Date().toISOString(),
            source: 'Meta Graph API',
            isDemoData: false,
            rawMetadata: {
              metaId: item.id,
              searchQuery: query,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[SAFENET Meta Provider] Query "${query}" failed:`, err?.message || err);
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

  extractInstagramUsername(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('instagram.com')) return null;
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length === 0) return null;
      const first = pathParts[0].toLowerCase();
      const systemPaths = new Set(['explore', 'p', 'reel', 'reels', 'stories', 'accounts', 'direct', 'tv']);
      if (systemPaths.has(first)) return null;
      return pathParts[0];
    } catch {
      return null;
    }
  }
}
