/**
 * SAFENET YouTube Impersonation Discovery Provider
 * Uses YouTube Data API v3 to identify suspicious channels, clone handles, and scam profiles.
 * Never invents candidate accounts if API key is unconfigured.
 */

import { BrandIdentityProfile, SocialCandidate, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';

export class YouTubeProvider implements SocialCandidateProvider {
  platform = 'youtube' as const;
  name = 'YouTube Data API v3';

  private getApiKey(): string | null {
    return process.env.YOUTUBE_API_KEY?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  async searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult> {
    const start = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        platform: this.platform,
        provider: this.name,
        status: 'not_configured',
        candidates: [],
        message: 'YouTube API key is not configured. Set YOUTUBE_API_KEY in .env.local to enable live YouTube channel discovery.',
        queryCount: 0,
        executionMs: 0,
      };
    }

    const candidates: SocialCandidate[] = [];
    const seenIds = new Set<string>();
    let executedQueries = 0;

    for (const query of searchQueries.slice(0, 3)) {
      try {
        executedQueries++;
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('type', 'channel');
        url.searchParams.set('q', query);
        url.searchParams.set('maxResults', '8');
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          if (res.status === 403) {
            return {
              platform: this.platform,
              provider: this.name,
              status: 'rate_limited',
              candidates,
              message: 'YouTube Data API quota exceeded or access forbidden.',
              queryCount: executedQueries,
              executionMs: Date.now() - start,
            };
          }
          continue;
        }

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        for (const item of items) {
          const channelId = item.id?.channelId || item.snippet?.channelId;
          if (!channelId || seenIds.has(channelId)) continue;
          seenIds.add(channelId);

          const snippet = item.snippet || {};
          const title = snippet.title || 'Unknown Channel';
          const description = snippet.description || '';
          const customUrl = snippet.customUrl || '';
          const username = customUrl.replace(/^@/, '') || title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const channelUrl = customUrl ? `https://www.youtube.com/${customUrl}` : `https://www.youtube.com/channel/${channelId}`;

          // Extract any external URLs from channel description
          const extractedUrls: string[] = [];
          const urlRegex = /(https?:\/\/[^\s]+)/gi;
          const urlMatches = description.match(urlRegex) || [];
          for (const u of urlMatches) {
            try {
              extractedUrls.push(new URL(u).toString());
            } catch {
              // Ignore invalid
            }
          }

          candidates.push({
            id: `yt-${channelId}`,
            platform: 'youtube',
            candidateId: channelId,
            username: `@${username}`,
            displayName: title,
            profileUrl: channelUrl,
            profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            description,
            externalUrls: extractedUrls,
            verificationStatus: 'unknown',
            discoveredAt: new Date().toISOString(),
            source: 'YouTube Data API v3',
            isDemoData: false,
            rawMetadata: {
              channelId,
              publishedAt: snippet.publishedAt,
              searchQuery: query,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[SAFENET YouTube Provider] Query "${query}" failed:`, err?.message || err);
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
