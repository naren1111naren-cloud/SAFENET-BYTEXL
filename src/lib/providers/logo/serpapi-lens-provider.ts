/**
 * SAFENET - SerpAPI Google Lens / Reverse Image Provider
 * 
 * Flow:
 * 1. Validates API key presence (returns NOT_CONFIGURED when missing).
 * 2. Uploads temporary image to Supabase Storage with short-lived signed URL.
 * 3. Calls SerpAPI with engine: 'google_lens'.
 * 4. Cleans up / deletes the temporary upload object immediately.
 * 5. Normalizes visual_matches into NormalizedLogoCandidate format.
 */

import crypto from 'node:crypto';
import { LogoSearchProvider, LogoSearchResult, NormalizedLogoCandidate } from './types';
import { supabaseClient } from '@/lib/supabase/client';

export class SerpApiGoogleLensProvider implements LogoSearchProvider {
  id = 'serpapi_google_lens';
  name = 'SerpAPI Google Lens Reverse Image Engine';

  isConfigured(): boolean {
    const key = process.env.SERPAPI_API_KEY;
    return Boolean(key && key.trim().length > 5 && !key.includes('...'));
  }

  private extractDomain(urlStr: string): string {
    try {
      if (!urlStr) return '';
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /**
   * Uploads the temporary image to Supabase Storage, obtains a signed URL, runs the search, and deletes the temporary file.
   */
  async searchByImage(
    imageBuffer: Buffer,
    mimeType: string,
    options?: { brandName?: string }
  ): Promise<LogoSearchResult> {
    if (!this.isConfigured()) {
      return {
        status: 'NOT_CONFIGURED',
        provider: this.id,
        candidates: [],
        message: 'SERPAPI_API_KEY is not configured in environment variables. Reverse image search was omitted honestly.',
      };
    }

    const apiKey = process.env.SERPAPI_API_KEY!.trim();
    const tempFileId = `temp_lens_${crypto.randomUUID()}.${mimeType.split('/')[1] || 'png'}`;
    const bucket = 'safenet-temp-uploads';
    let signedPublicUrl: string | null = null;
    let uploadedToStorage = false;

    try {
      // 1. Attempt temporary upload to Supabase Storage if configured
      if (supabaseClient.getIsConfigured()) {
        const baseUrl = supabaseClient.getBaseUrl();
        const authKey = supabaseClient.getApiKey();

        // Ensure bucket or upload directly
        const uploadRes = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${tempFileId}`, {
          method: 'POST',
          headers: {
            apikey: authKey,
            Authorization: `Bearer ${authKey}`,
            'Content-Type': mimeType,
          },
          body: new Uint8Array(imageBuffer),
        });

        if (uploadRes.ok) {
          uploadedToStorage = true;
          // Create signed URL (valid for 300 seconds)
          const signRes = await fetch(`${baseUrl}/storage/v1/object/sign/${bucket}/${tempFileId}`, {
            method: 'POST',
            headers: {
              apikey: authKey,
              Authorization: `Bearer ${authKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiresIn: 300 }),
          });

          if (signRes.ok) {
            const signData = await signRes.json();
            if (signData.signedURL) {
              signedPublicUrl = `${baseUrl}/storage/v1${signData.signedURL}`;
            }
          }
        }
      }

      if (!signedPublicUrl) {
        // If Supabase Storage is not active, return clean notice
        return {
          status: 'NOT_CONFIGURED',
          provider: this.id,
          candidates: [],
          message: 'Supabase Storage is required to host temporary reverse-image payloads for Google Lens. Storage is currently unavailable.',
        };
      }

      // 2. Query SerpAPI Google Lens
      const searchParams = new URLSearchParams({
        engine: 'google_lens',
        url: signedPublicUrl,
        api_key: apiKey,
        hl: 'en',
      });

      const serpRes = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!serpRes.ok) {
        if (serpRes.status === 429) {
          return {
            status: 'RATE_LIMITED',
            provider: this.id,
            candidates: [],
            error: 'SerpAPI rate limit reached.',
          };
        }
        return {
          status: 'ERROR',
          provider: this.id,
          candidates: [],
          error: `SerpAPI returned HTTP ${serpRes.status}`,
        };
      }

      const serpData = await serpRes.json();
      const rawMatches = Array.isArray(serpData.visual_matches) ? serpData.visual_matches : [];

      // 3. Normalize candidates
      const candidates: NormalizedLogoCandidate[] = [];
      for (const item of rawMatches) {
        const sourceUrl = item.link || '';
        const domain = this.extractDomain(sourceUrl);
        if (!domain) continue;

        candidates.push({
          name: item.source || item.title || domain,
          domain,
          sourceUrl,
          thumbnailUrl: item.thumbnail || '',
          title: item.title || item.source || domain,
          snippet: item.snippet || '',
          sourceType: 'reverse_image_lens',
        });
      }

      return {
        status: 'SUCCESS',
        provider: this.id,
        candidates,
        rawMatchesCount: rawMatches.length,
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        provider: this.id,
        candidates: [],
        error: `SerpAPI Google Lens lookup failed: ${err?.message || err}`,
      };
    } finally {
      // 4. Clean up temporary uploaded file from storage
      if (uploadedToStorage && supabaseClient.getIsConfigured()) {
        try {
          const baseUrl = supabaseClient.getBaseUrl();
          const authKey = supabaseClient.getApiKey();
          await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
            method: 'DELETE',
            headers: {
              apikey: authKey,
              Authorization: `Bearer ${authKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefixes: [tempFileId] }),
          });
        } catch {
          // Non-blocking cleanup
        }
      }
    }
  }

  /**
   * Fallback text search provider when vision search yields extracted text.
   */
  async searchByTextQuery(query: string): Promise<LogoSearchResult> {
    if (!this.isConfigured() || !query.trim()) {
      return {
        status: 'NOT_CONFIGURED',
        provider: this.id,
        candidates: [],
        message: 'SerpAPI key not configured for query fallback.',
      };
    }

    try {
      const apiKey = process.env.SERPAPI_API_KEY!.trim();
      const searchParams = new URLSearchParams({
        engine: 'google',
        q: `${query} logo site:*.com OR site:*.org OR site:*.net`,
        api_key: apiKey,
        num: '10',
      });

      const res = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);
      if (!res.ok) {
        return { status: 'ERROR', provider: this.id, candidates: [], error: `SerpAPI text query failed: ${res.status}` };
      }

      const data = await res.json();
      const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
      const candidates: NormalizedLogoCandidate[] = [];

      for (const item of organic) {
        const sourceUrl = item.link || '';
        const domain = this.extractDomain(sourceUrl);
        if (!domain) continue;

        candidates.push({
          name: item.title || domain,
          domain,
          sourceUrl,
          thumbnailUrl: item.thumbnail || item.favicon || '',
          title: item.title || domain,
          snippet: item.snippet || '',
          sourceType: 'text_search_fallback',
        });
      }

      return {
        status: 'SUCCESS',
        provider: this.id,
        candidates,
        rawMatchesCount: organic.length,
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        provider: this.id,
        candidates: [],
        error: `Text query failed: ${err?.message || err}`,
      };
    }
  }
}
