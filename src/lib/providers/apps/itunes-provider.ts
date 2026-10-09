/**
 * SAFENET App Store Monitoring - Apple iTunes Search API Provider
 * Queries official Apple iTunes software catalog for mobile applications.
 * Legitimate, public, keyless API returning authentic iOS application intelligence.
 */

import { DiscoveredCandidate, InvestigationProvider, ProviderHealth, ProviderDiscoveryResult } from '../types';

export class ItunesAppStoreProvider implements InvestigationProvider {
  id = 'itunes_search_api';
  name = 'Apple App Store (iTunes API)';
  type = 'apps' as const;

  isConfigured(): boolean {
    return true; // Public keyless API
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://itunes.apple.com/search?term=apple&entity=software&limit=1', {
        signal: controller.signal,
        headers: { 'User-Agent': 'SAFENET-Risk-Intel/1.0' },
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          id: this.id,
          name: this.name,
          type: this.type,
          status: 'connected',
          latencyMs,
          testedAt: new Date().toISOString(),
        };
      }
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        status: 'error',
        message: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs,
        testedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
        testedAt: new Date().toISOString(),
      };
    }
  }

  async discover(context: {
    brandName: string;
    domain: string;
    officialDomains?: string[];
    handles?: Record<string, string>;
    appPackageName?: string;
    officialDevelopers?: string[];
    brandKeywords?: string[];
  }): Promise<ProviderDiscoveryResult> {
    const start = Date.now();
    const brand = context.brandName.trim();
    if (!brand) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: 'error',
        message: 'Brand name is required for App Store discovery.',
        candidates: [],
        queryCount: 0,
        executionMs: 0,
      };
    }

    // Generate comprehensive query variants based on ByteXL / SAFENET requirements
    const queries = [
      brand,
      `${brand} official`,
      `${brand} support`,
      `${brand} security`,
      `${brand} rewards`,
      `${brand} customer care`,
    ];

    const seenAppIds = new Set<string>();
    const candidates: DiscoveredCandidate[] = [];
    let executedQueries = 0;

    for (const q of queries) {
      try {
        executedQueries++;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=15&country=us`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'SAFENET-Risk-Intel/1.0' },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];

        for (const item of results) {
          const bundleId = item.bundleId || `track-${item.trackId}`;
          if (seenAppIds.has(bundleId)) continue;
          seenAppIds.add(bundleId);

          const appTitle = item.trackName || item.trackCensoredName || 'Untitled App';
          const developerName = item.sellerName || item.artistName || 'Unknown Developer';
          const storeUrl = item.trackViewUrl || '';
          const iconUrl = item.artworkUrl512 || item.artworkUrl100 || item.artworkUrl60 || '';
          const description = item.description || '';
          const sellerUrl = item.sellerUrl || '';
          const rating = item.averageUserRating;
          const reviewCount = item.userRatingCount;

          candidates.push({
            id: `app-itunes-${item.trackId || bundleId}`,
            source: 'apple_app_store',
            sourceType: 'app',
            title: appTitle,
            url: storeUrl,
            description,
            imageUrl: iconUrl,
            developer: developerName,
            website: sellerUrl,
            discoveredAt: new Date().toISOString(),
            provider: this.id,
            rating,
            reviewCount,
            appId: bundleId,
            rawData: {
              trackId: item.trackId,
              bundleId,
              genres: item.genres,
              primaryGenreName: item.primaryGenreName,
              contentAdvisoryRating: item.contentAdvisoryRating,
              minimumOsVersion: item.minimumOsVersion,
              currentVersionReleaseDate: item.currentVersionReleaseDate,
              price: item.price,
            },
            evidence: [
              {
                id: `ev-itunes-app-${item.trackId}`,
                title: 'Apple App Store Record Discovered',
                description: `Discovered live application "${appTitle}" by developer "${developerName}" on Apple App Store.`,
                severity: 'low',
                category: 'App Store Discovery',
                value: `Bundle ID: ${bundleId} | Seller: ${developerName}`,
                source: 'Apple iTunes Software Catalog API',
                status: 'available',
              },
            ],
          });
        }
      } catch (err) {
        console.warn(`[SAFENET] iTunes search query "${q}" failed:`, err);
      }
    }

    return {
      providerId: this.id,
      providerName: this.name,
      status: 'connected',
      candidates,
      queryCount: executedQueries,
      executionMs: Date.now() - start,
    };
  }
}
