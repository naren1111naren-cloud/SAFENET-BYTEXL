/**
 * SAFENET Social Candidate Analysis Orchestrator
 * Glues discovery candidates with identity analysis, domain intelligence,
 * logo verification, and explainable risk evaluation.
 */

import {
  BrandIdentityProfile,
  SocialCandidate,
  SocialCandidateAnalysis,
} from './types';
import { analyzeCandidateIdentity } from './identity-analyzer';
import { analyzeCandidateExternalUrls } from './url-analyzer';
import { analyzeLogoSimilarity } from './logo-analyzer';
import { evaluateSocialCandidateRisk } from './risk-engine';

export async function analyzeAllSocialCandidates(
  candidates: SocialCandidate[],
  brandProfile: BrandIdentityProfile,
  options?: {
    onProgress?: (analyzed: number, total: number) => void;
  }
): Promise<SocialCandidateAnalysis[]> {
  const analyzedList: SocialCandidateAnalysis[] = [];
  let count = 0;

  for (const candidate of candidates) {
    count++;
    options?.onProgress?.(count, candidates.length);

    // 1. Identity similarity & intent
    const identity = analyzeCandidateIdentity(candidate, brandProfile);

    // 2. Linked external domain intelligence (reusing SAFENET domain engine)
    const urlAnalysis = await analyzeCandidateExternalUrls(candidate.externalUrls, brandProfile);

    // 3. Logo trademark analysis (pluggable, reports not_available if unconfigured)
    const logoSignal = await analyzeLogoSimilarity({
      officialLogoUrl: brandProfile.logo,
      candidateImageUrl: candidate.profileImageUrl,
    });

    // 4. Multi-factor explainable risk evaluation
    const risk = evaluateSocialCandidateRisk({
      candidate,
      brandProfile,
      identity,
      urlAnalysis,
      logoSignal,
    });

    analyzedList.push({
      candidate,
      matchedBrand: brandProfile,
      risk,
      status: risk.officialAccountMatch ? 'reviewed' : 'new',
      updatedAt: new Date().toISOString(),
    });
  }

  // Sort descending by risk score
  analyzedList.sort((a, b) => b.risk.riskScore - a.risk.riskScore);

  return analyzedList;
}
