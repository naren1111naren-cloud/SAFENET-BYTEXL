/**
 * SAFENET X (Twitter) Impersonation Discovery Provider
 * Uses X API v2 to identify suspicious profiles, username squatting, and scam bots.
 * Returns honest not_configured status if X_BEARER_TOKEN is not configured.
 */

import { BrandIdentityProfile, SocialCandidate, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';

export class XProvider implements SocialCandidateProvider {
  platform = 'twitter' as const;
  name = 'X (Twitter) API v2';

  private getBearerToken(): string | null {
    return process.env.X_BEARER_TOKEN?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.getBearerToken());
  }

  async searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult> {
    const start = Date.now();
    const bearer = this.getBearerToken();

    if (!bearer) {
      return {
        platform: this.platform,
        provider: this.name,
        status: 'not_configured',
        candidates: [],
        message: 'X Bearer Token is not configured. Set X_BEARER_TOKEN in .env.local to enable live X account discovery.',
        queryCount: 0,
        executionMs: 0,
      };
    }

    const candidates: SocialCandidate[] = [];
    const seenUsernames = new Set<string>();
    let executedQueries = 0;

    for (const query of searchQueries.slice(0, 3)) {
      try {
        executedQueries++;
        // Use X API v2 user search / lookup
        const endpoint = `https://api.twitter.com/2/users/by?usernames=${encodeURIComponent(query.replace(/\s+/g, ''))}&user.fields=description,entities,profile_image_url,public_metrics,verified`;
        
        const res = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${bearer}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          if (res.status === 429) {
            return {
              platform: this.platform,
              provider: this.name,
              status: 'rate_limited',
              candidates,
              message: 'X API v2 rate limit exceeded.',
              queryCount: executedQueries,
              executionMs: Date.now() - start,
            };
          }
          continue;
        }

        const data = await res.json();
        const users = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);

        for (const user of users) {
          const username = (user.username || '').toLowerCase();
          if (!username || seenUsernames.has(username)) continue;
          seenUsernames.add(username);

          const externalUrls: string[] = [];
          if (user.entities?.url?.urls) {
            for (const u of user.entities.url.urls) {
              if (u.expanded_url) externalUrls.push(u.expanded_url);
            }
          }
          if (user.entities?.description?.urls) {
            for (const u of user.entities.description.urls) {
              if (u.expanded_url) externalUrls.push(u.expanded_url);
            }
          }

          candidates.push({
            id: `x-${user.id || username}`,
            platform: 'twitter',
            candidateId: user.id || username,
            username: `@${user.username}`,
            displayName: user.name || user.username,
            profileUrl: `https://x.com/${user.username}`,
            profileImageUrl: user.profile_image_url,
            description: user.description || '',
            externalUrls,
            followers: user.public_metrics?.followers_count,
            verificationStatus: user.verified ? 'verified' : 'unverified',
            discoveredAt: new Date().toISOString(),
            source: 'X API v2',
            isDemoData: false,
            rawMetadata: {
              id: user.id,
              metrics: user.public_metrics,
              searchQuery: query,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[SAFENET X Provider] Query "${query}" failed:`, err?.message || err);
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
