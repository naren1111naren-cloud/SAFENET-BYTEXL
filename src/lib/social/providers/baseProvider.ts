/**
 * SAFENET Social Candidate Provider - Base Interface
 * Decouples external social media APIs from normalization and risk engines.
 */

import { BrandIdentityProfile, SocialCandidate, SocialPlatform, SocialProviderResult } from '../types';

export interface SocialCandidateProvider {
  platform: SocialPlatform;
  name: string;
  isConfigured(): boolean;
  searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult>;
}
