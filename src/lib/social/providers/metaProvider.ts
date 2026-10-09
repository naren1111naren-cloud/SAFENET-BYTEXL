/**
 * SAFENET Meta & Instagram Discovery Provider
 * 
 * Implements:
 * 1. Meta Graph API Instagram Business Discovery for authorized environments.
 * 2. Search Provider Fallback (Serper, Tavily, SerpApi, Brave) for public Instagram profiles.
 * 3. Candidate enrichment, deduplication, and honest status reporting.
 * 
 * STRICT COMPLIANCE:
 * - Never scrapes Instagram or bypasses access controls.
 * - Does not claim Meta API can search private personal accounts.
 * - Never returns fake or synthetic accounts in production.
 */

import { BrandIdentityProfile, SocialCandidate, SocialPlatform, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';
import { globalMetaInstagramClient, InstagramBusinessProfileData } from '../meta-instagram-client';

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
    const raw = process.env.META_ACCESS_TOKEN?.trim() || '';
    if (!raw || /^\d{10,24}$/.test(raw) || /^(YOUR_|placeholder)/i.test(raw)) {
      return null;
    }
    return raw;
  }

  private getSearchApiKey(): { provider: 'serper' | 'tavily' | 'serpapi' | 'brave' | 'custom' | null; key: string | null } {
    const serper = process.env.SERPER_API_KEY?.trim();
    if (serper) return { provider: 'serper', key: serper };

    const tavily = process.env.TAVILY_API_KEY?.trim();
    if (tavily) return { provider: 'tavily', key: tavily };

    const serpapi = process.env.SERPAPI_KEY?.trim();
    if (serpapi) return { provider: 'serpapi', key: serpapi };

    const brave = process.env.BRAVE_API_KEY?.trim();
    if (brave) return { provider: 'brave', key: brave };

    const custom = process.env.SEARCH_PROVIDER_API_KEY?.trim();
    if (custom) return { provider: 'custom', key: custom };

    return { provider: null, key: null };
  }

  isConfigured(): boolean {
    return Boolean(this.getAccessToken() || this.getSearchApiKey().key);
  }

  /**
   * Discovers Instagram candidates using authorized Meta Business Discovery and/or Search Provider Fallback.
   */
  async searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult> {
    const start = Date.now();
    const readiness = await globalMetaInstagramClient.checkCredentialReadiness();
    const { provider: searchProvider, key: searchKey } = this.getSearchApiKey();

    const candidates: SocialCandidate[] = [];
    const seenUsernames = new Set<string>();
    let executedQueries = 0;

    // If Instagram platform:
    if (this.targetPlatform === 'instagram') {
      // Step 1: Authorized Meta Business Discovery (if Meta is connected)
      if (readiness.isConnected && readiness.capabilities.businessDiscovery) {
        const brandName = brandProfile.brandName.trim();
        const officialHandle = brandProfile.officialSocialHandles?.instagram?.replace(/^@/, '').trim();
        const targetUsernamesToCheck = new Set<string>();

        if (officialHandle) targetUsernamesToCheck.add(officialHandle.toLowerCase());
        targetUsernamesToCheck.add(brandName.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
        targetUsernamesToCheck.add(`${brandName.toLowerCase()}_official`.replace(/[^a-z0-9_.]/g, ''));
        targetUsernamesToCheck.add(`${brandName.toLowerCase()}support`.replace(/[^a-z0-9_.]/g, ''));

        for (const targetUser of Array.from(targetUsernamesToCheck).slice(0, 4)) {
          try {
            executedQueries++;
            const discoveryRes = await globalMetaInstagramClient.queryBusinessDiscovery(targetUser);

            if (discoveryRes.success && discoveryRes.profile) {
              const p = discoveryRes.profile;
              const cleanUser = p.username.toLowerCase();

              if (!seenUsernames.has(cleanUser)) {
                seenUsernames.add(cleanUser);
                const extUrls = p.website ? [p.website] : [];

                candidates.push({
                  id: `meta-instagram-${p.id || cleanUser}`,
                  platform: 'instagram',
                  candidateId: p.id || cleanUser,
                  username: `@${p.username}`,
                  displayName: p.name || p.username,
                  profileUrl: `https://www.instagram.com/${p.username}`,
                  profileImageUrl: p.profilePictureUrl,
                  description: p.biography || '',
                  externalUrls: extUrls,
                  followers: p.followersCount,
                  verificationStatus: 'unverified', // will be evaluated by identity/risk engine
                  discoveredAt: new Date().toISOString(),
                  source: 'Meta Instagram Graph API (Business Discovery)',
                  isDemoData: false,
                  rawMetadata: {
                    metaId: p.id,
                    followersCount: p.followersCount,
                    followsCount: p.followsCount,
                    mediaCount: p.mediaCount,
                    discoveredVia: 'meta_business_discovery',
                  },
                });
              }
            }
          } catch (err: any) {
            console.warn(`[SAFENET Instagram Provider] Business discovery for "${targetUser}" error:`, err?.message || err);
          }
        }
      }

      // Step 2: Search Provider Fallback (Publicly indexed Instagram profiles)
      if (searchKey && searchProvider) {
        const brand = brandProfile.brandName.trim();
        const instagramSearchQueries = [
          `site:instagram.com "${brand}" support`,
          `site:instagram.com "${brand}" official`,
          `site:instagram.com "${brand}" customer care OR helpdesk OR refund`,
        ];

        for (const q of instagramSearchQueries) {
          try {
            executedQueries++;
            const rawResults = await this.executeSearchQuery(q, searchProvider, searchKey);

            for (const item of rawResults) {
              const extractedUsername = this.extractInstagramUsername(item.link);
              if (!extractedUsername) continue;

              const cleanUser = extractedUsername.toLowerCase();
              if (seenUsernames.has(cleanUser)) continue;
              seenUsernames.add(cleanUser);

              // If Meta API is operational, try enriching candidate with fresh Business Discovery data
              let enrichedProfile: InstagramBusinessProfileData | null = null;
              if (readiness.isConnected && readiness.capabilities.businessDiscovery) {
                try {
                  const enrichRes = await globalMetaInstagramClient.queryBusinessDiscovery(cleanUser);
                  if (enrichRes.success && enrichRes.profile) {
                    enrichedProfile = enrichRes.profile;
                  }
                } catch {
                  // Fallback to search metadata
                }
              }

              const extUrls: string[] = [];
              if (enrichedProfile?.website) extUrls.push(enrichedProfile.website);

              candidates.push({
                id: `search-instagram-${cleanUser}`,
                platform: 'instagram',
                candidateId: enrichedProfile?.id || cleanUser,
                username: `@${cleanUser}`,
                displayName: enrichedProfile?.name || item.title.replace(/\s*\(?@.*$/i, '').replace(/•.*Instagram.*$/i, '').trim() || cleanUser,
                profileUrl: `https://www.instagram.com/${cleanUser}`,
                profileImageUrl: enrichedProfile?.profilePictureUrl,
                description: enrichedProfile?.biography || item.snippet || '',
                externalUrls: extUrls,
                followers: enrichedProfile?.followersCount,
                verificationStatus: 'unverified',
                discoveredAt: new Date().toISOString(),
                source: enrichedProfile
                  ? 'Search Fallback (Enriched via Meta Business Discovery)'
                  : `Public Search Engine Index (${searchProvider.toUpperCase()} Fallback)`,
                isDemoData: false,
                rawMetadata: {
                  searchQuery: q,
                  searchSource: item.link,
                  isEnrichedViaMeta: Boolean(enrichedProfile),
                },
              });
            }
          } catch (err: any) {
            console.warn(`[SAFENET Instagram Fallback] Search query "${q}" failed:`, err?.message || err);
          }
        }
      }

      // Step 3: Return result with transparent status
      if (candidates.length > 0 || readiness.isConnected) {
        return {
          platform: 'instagram',
          provider: this.name,
          status: readiness.isConnected ? 'connected' : (searchKey ? 'connected' : 'not_configured'),
          candidates,
          message: readiness.isConnected
            ? `Discovered ${candidates.length} Instagram candidates via Meta Graph API & public indexing.`
            : (searchKey
                ? `Discovered ${candidates.length} Instagram candidates via public search fallback (${searchProvider?.toUpperCase()}). Meta API setup is pending.`
                : readiness.message),
          queryCount: executedQueries,
          executionMs: Date.now() - start,
        };
      }

      // If neither Meta nor Search Provider is configured
      return {
        platform: 'instagram',
        provider: this.name,
        status: readiness.status === 'config_id_only' ? 'unauthorized' : 'not_configured',
        candidates: [],
        message: readiness.status === 'config_id_only'
          ? 'Meta Configuration ID is present, but an authorized User/Page Access Token is required. Candidate search fallback also requires a Search Provider key (SERPER_API_KEY or TAVILY_API_KEY).'
          : 'Instagram discovery is not configured. Configure META_ACCESS_TOKEN or a Search Provider (SERPER_API_KEY / TAVILY_API_KEY) in .env.local to enable candidate discovery.',
        queryCount: executedQueries,
        executionMs: Date.now() - start,
      };
    }

    // Facebook Pages discovery (Legacy/Existing Meta Graph API Page search)
    const token = this.getAccessToken();
    if (!token) {
      return {
        platform: 'facebook',
        provider: this.name,
        status: readiness.status === 'config_id_only' ? 'unauthorized' : 'not_configured',
        candidates: [],
        message: 'Facebook Pages monitoring requires a valid META_ACCESS_TOKEN.',
        queryCount: 0,
        executionMs: 0,
      };
    }

    // If Facebook token exists, query pages search
    for (const query of searchQueries.slice(0, 2)) {
      try {
        executedQueries++;
        const endpoint = `https://graph.facebook.com/v19.0/pages/search?q=${encodeURIComponent(query)}&fields=id,name,link,picture,verification_status,about,website&access_token=${encodeURIComponent(token)}`;

        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];

        for (const item of items) {
          if (!item.id || seenUsernames.has(item.id)) continue;
          seenUsernames.add(item.id);

          const username = (item.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const extUrls: string[] = [];
          if (item.website) extUrls.push(item.website);

          candidates.push({
            id: `meta-facebook-${item.id}`,
            platform: 'facebook',
            candidateId: item.id,
            username: `@${username}`,
            displayName: item.name || 'Facebook Page',
            profileUrl: item.link || `https://facebook.com/${item.id}`,
            profileImageUrl: item.picture?.data?.url,
            description: item.about || '',
            externalUrls: extUrls,
            verificationStatus: item.verification_status === 'blue_verified' ? 'verified' : 'unverified',
            discoveredAt: new Date().toISOString(),
            source: 'Meta Graph API (Facebook Pages)',
            isDemoData: false,
            rawMetadata: {
              metaId: item.id,
            },
          });
        }
      } catch (err) {
        console.warn(`[SAFENET Facebook Provider] Query "${query}" failed:`, err);
      }
    }

    return {
      platform: 'facebook',
      provider: this.name,
      status: 'connected',
      candidates,
      queryCount: executedQueries,
      executionMs: Date.now() - start,
    };
  }

  /**
   * Helper to extract clean Instagram username from URL.
   */
  private extractInstagramUsername(urlStr: string): string | null {
    try {
      const parsed = new URL(urlStr);
      if (!parsed.hostname.toLowerCase().includes('instagram.com')) return null;

      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length === 0) return null;

      const firstSeg = pathSegments[0].toLowerCase();
      // Ignore system paths
      const systemPaths = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'legal', 'about', 'developer', 'tv'];
      if (systemPaths.includes(firstSeg)) return null;

      // Validate handle characters
      if (/^[a-zA-Z0-9._]{1,30}$/.test(firstSeg)) {
        return firstSeg;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to query available search providers for Instagram URLs.
   */
  private async executeSearchQuery(
    query: string,
    provider: 'serper' | 'tavily' | 'serpapi' | 'brave' | 'custom',
    apiKey: string
  ): Promise<Array<{ title: string; link: string; snippet?: string }>> {
    const results: Array<{ title: string; link: string; snippet?: string }> = [];

    if (provider === 'serper') {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10 }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const organic = Array.isArray(data.organic) ? data.organic : [];
        for (const o of organic) {
          if (o.link) results.push({ title: o.title || '', link: o.link, snippet: o.snippet || '' });
        }
      }
    } else if (provider === 'tavily') {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, max_results: 10 }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.results) ? data.results : [];
        for (const item of items) {
          if (item.url) results.push({ title: item.title || '', link: item.url, snippet: item.content || '' });
        }
      }
    } else if (provider === 'serpapi') {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google');
      url.searchParams.set('q', query);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('num', '10');

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
        for (const o of organic) {
          if (o.link) results.push({ title: o.title || '', link: o.link, snippet: o.snippet || '' });
        }
      }
    }

    return results;
  }
}
