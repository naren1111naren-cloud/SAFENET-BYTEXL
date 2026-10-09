/**
 * SAFENET Real Data Provider - Registry & Coordinator
 * Coordinates real external discovery providers without inventing data.
 */

import { InvestigationProvider, ProviderHealth, DiscoveredCandidate, ProviderDiscoveryResult } from './types';
import { ItunesAppStoreProvider } from './apps/itunes-provider';
import { WebSearchProvider } from './search/search-provider';
import { SocialMediaProvider } from './social/social-provider';

export class ProviderRegistry {
  private providers: InvestigationProvider[] = [
    new ItunesAppStoreProvider(),
    new WebSearchProvider(),
    new SocialMediaProvider(),
  ];

  getProviders(): InvestigationProvider[] {
    return this.providers;
  }

  async checkAllHealth(): Promise<Record<string, ProviderHealth>> {
    const results: Record<string, ProviderHealth> = {};
    const checks = await Promise.allSettled(
      this.providers.map(async (p) => {
        const health = await p.checkHealth();
        return { id: p.id, health };
      })
    );

    for (const c of checks) {
      if (c.status === 'fulfilled') {
        results[c.value.id] = c.value.health;
      }
    }
    return results;
  }

  async runDiscovery(context: {
    brandName: string;
    domain: string;
    officialDomains?: string[];
    handles?: Record<string, string>;
    appPackageName?: string;
    officialDevelopers?: string[];
    brandKeywords?: string[];
  }): Promise<{
    candidates: DiscoveredCandidate[];
    providerRuns: Record<string, ProviderDiscoveryResult>;
  }> {
    const providerRuns: Record<string, ProviderDiscoveryResult> = {};
    const allCandidates: DiscoveredCandidate[] = [];

    const runs = await Promise.allSettled(
      this.providers.map(async (p) => {
        const res = await p.discover(context);
        return { id: p.id, res };
      })
    );

    for (const r of runs) {
      if (r.status === 'fulfilled') {
        providerRuns[r.value.id] = r.value.res;
        allCandidates.push(...r.value.res.candidates);
      }
    }

    // Deduplicate candidates by URL / bundleId
    const seenKeys = new Set<string>();
    const deduplicated: DiscoveredCandidate[] = [];

    for (const cand of allCandidates) {
      const key = (cand.appId || cand.url || cand.id).toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicated.push(cand);
      }
    }

    return {
      candidates: deduplicated,
      providerRuns,
    };
  }
}

export const globalProviderRegistry = new ProviderRegistry();
