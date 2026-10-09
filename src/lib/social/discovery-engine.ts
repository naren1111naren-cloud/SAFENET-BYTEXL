/**
 * SAFENET Social Discovery Engine
 * Generates controlled brand query variants, dispatches to active providers,
 * normalizes candidate records, and deduplicates discoveries.
 */

import {
  BrandIdentityProfile,
  SocialCandidate,
  SocialPlatform,
  SocialProviderResult,
} from './types';
import { getSocialMonitoringConfig } from './config';
import { YouTubeProvider } from './providers/youtubeProvider';
import { XProvider } from './providers/xProvider';
import { MetaProvider } from './providers/metaProvider';
import { LinkedInProvider } from './providers/linkedinProvider';
import { DemoSocialProvider } from './providers/demoProvider';
import { SocialCandidateProvider } from './providers/baseProvider';

export interface DiscoveryEngineRunResult {
  brandProfile: BrandIdentityProfile;
  generatedVariants: string[];
  candidates: SocialCandidate[];
  providerResults: Record<string, SocialProviderResult>;
  totalCandidates: number;
  realCount: number;
  demoCount: number;
  executionMs: number;
}

/**
 * Generates a controlled set of brand search variants without combinatorial explosion.
 */
export function generateBrandSearchVariants(brandProfile: BrandIdentityProfile): string[] {
  const brandName = (brandProfile.brandName || '').trim();
  if (!brandName) return [];

  const variants = new Set<string>();

  // 1. Primary brand name
  variants.add(brandName);

  // 2. High-priority brand aliases (max 3)
  if (Array.isArray(brandProfile.aliases)) {
    for (const alias of brandProfile.aliases) {
      const cleanAlias = alias.trim();
      if (cleanAlias && cleanAlias.toLowerCase() !== brandName.toLowerCase()) {
        variants.add(cleanAlias);
      }
      if (variants.size >= 4) break;
    }
  }

  // 3. Controlled intent patterns commonly targeted by scam profiles
  const intentKeywords = [
    'Support',
    'Customer Care',
    'Official',
    'Help',
  ];

  for (const kw of intentKeywords) {
    variants.add(`${brandName} ${kw}`);
  }

  // Cap at 8 targeted queries to respect API rate limits
  return Array.from(variants).slice(0, 8);
}

export class SocialDiscoveryEngine {
  private providers: SocialCandidateProvider[];
  private demoProvider: DemoSocialProvider;

  constructor() {
    this.providers = [
      new YouTubeProvider(),
      new XProvider(),
      new MetaProvider('instagram'),
      new MetaProvider('facebook'),
      new LinkedInProvider(),
    ];
    this.demoProvider = new DemoSocialProvider();
  }

  async runDiscovery(
    brandProfile: BrandIdentityProfile,
    options?: {
      onProgress?: (step: string, stepIndex: number, totalSteps: number) => void;
      includeDemoData?: boolean;
    }
  ): Promise<DiscoveryEngineRunResult> {
    const startTime = Date.now();
    const config = getSocialMonitoringConfig();
    const variants = generateBrandSearchVariants(brandProfile);

    options?.onProgress?.('Generating brand search variations', 1, 6);

    const providerResults: Record<string, SocialProviderResult> = {};
    const rawCandidates: SocialCandidate[] = [];

    // Filter which real providers to run based on environment config
    const enabledProviders = this.providers.filter((p) => {
      if (p.platform === 'youtube' && !config.providers.youtube.enabled) return false;
      if (p.platform === 'twitter' && !config.providers.twitter.enabled) return false;
      if ((p.platform === 'instagram' || p.platform === 'facebook') && !config.providers.meta.enabled) return false;
      if (p.platform === 'linkedin' && !config.providers.linkedin.enabled) return false;
      return true;
    });

    options?.onProgress?.('Querying configured social providers', 2, 6);

    // Run real providers in parallel with independent fault isolation
    const realRuns = await Promise.allSettled(
      enabledProviders.map(async (provider) => {
        try {
          return await provider.searchBrandCandidates(brandProfile, variants);
        } catch (err: any) {
          return {
            platform: provider.platform,
            provider: provider.name,
            status: 'error' as const,
            candidates: [],
            message: `Provider runtime error: ${err?.message || err}`,
            queryCount: 0,
            executionMs: 0,
          };
        }
      })
    );

    for (const r of realRuns) {
      if (r.status === 'fulfilled') {
        const res = r.value;
        providerResults[`${res.platform}_${res.provider}`] = res;
        rawCandidates.push(...res.candidates);
      }
    }

    // Include demo provider ONLY if explicitly requested or if demo mode is enabled in config
    const shouldRunDemo = options?.includeDemoData !== undefined
      ? Boolean(options.includeDemoData)
      : config.demoMode;

    if (shouldRunDemo) {
      try {
        const demoRes = await this.demoProvider.searchBrandCandidates(brandProfile, variants);
        providerResults['demo_provider'] = demoRes;
        rawCandidates.push(...demoRes.candidates);
      } catch (err) {
        console.warn('[SAFENET Discovery] Demo provider execution issue:', err);
      }
    }

    options?.onProgress?.('Normalizing candidates and deduplicating footprint', 3, 6);

    // Deduplication by platform + normalized username / candidateId
    const seenKeys = new Set<string>();
    const deduplicated: SocialCandidate[] = [];

    for (const cand of rawCandidates) {
      const normUser = (cand.username || '').toLowerCase().replace(/^@/, '').trim();
      const key = `${cand.platform}:${normUser || cand.candidateId || cand.profileUrl}`.toLowerCase();

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicated.push(cand);
      }
    }

    let realCount = 0;
    let demoCount = 0;
    for (const c of deduplicated) {
      if (c.isDemoData) demoCount++;
      else realCount++;
    }

    return {
      brandProfile,
      generatedVariants: variants,
      candidates: deduplicated,
      providerResults,
      totalCandidates: deduplicated.length,
      realCount,
      demoCount,
      executionMs: Date.now() - startTime,
    };
  }
}

export const globalSocialDiscoveryEngine = new SocialDiscoveryEngine();
