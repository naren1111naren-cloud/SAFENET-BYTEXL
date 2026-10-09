/**
 * SAFENET Social Candidate External URL & Domain Intelligence
 * REUSES existing SAFENET Domain Intelligence (`analyzeDomain` and `parseDomain`).
 * Strictly does not create a disconnected second scanner.
 */

import { BrandIdentityProfile, DomainAnalysisSignal } from './types';
import { analyzeDomain, parseDomain, DomainAnalysisResult } from '../analyzers/domain-analyzer';
import { BrandProfile } from '@/types/brand';

export interface CandidateUrlsAnalysisReport {
  signals: DomainAnalysisSignal[];
  hasExternalUrls: boolean;
  hasOfficialMatch: boolean;
  hasMismatch: boolean;
  hasLookalike: boolean;
  domainRiskScore: number; // 0 to 100
  reasons: string[];
}

/**
 * Normalizes BrandIdentityProfile to the standard BrandProfile consumed by analyzeDomain
 */
function toBrandProfile(profile: BrandIdentityProfile): BrandProfile {
  return {
    id: profile.id,
    name: profile.brandName,
    domain: profile.officialDomain,
    officialDomains: profile.knownDomains?.length ? profile.knownDomains : [profile.officialDomain],
    handles: {
      twitter: profile.officialSocialHandles.twitter,
      instagram: profile.officialSocialHandles.instagram,
      facebook: profile.officialSocialHandles.facebook,
      linkedin: profile.officialSocialHandles.linkedin,
      youtube: profile.officialSocialHandles.youtube,
      telegram: profile.officialSocialHandles.telegram,
    },
    aliases: profile.aliases,
    brandKeywords: profile.brandKeywords,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function analyzeCandidateExternalUrls(
  urls: string[],
  brandProfile: BrandIdentityProfile
): Promise<CandidateUrlsAnalysisReport> {
  if (!urls || urls.length === 0) {
    return {
      signals: [],
      hasExternalUrls: false,
      hasOfficialMatch: false,
      hasMismatch: false,
      hasLookalike: false,
      domainRiskScore: 0,
      reasons: ['No external website linked in candidate profile.'],
    };
  }

  const brand = toBrandProfile(brandProfile);
  const signals: DomainAnalysisSignal[] = [];
  const reasons: string[] = [];

  let hasOfficial = false;
  let hasMismatch = false;
  let hasLookalike = false;
  let maxDomainRisk = 0;

  for (const rawUrl of urls.slice(0, 3)) {
    try {
      // Reuse existing SAFENET domain analyzer
      const domainResult: DomainAnalysisResult = await analyzeDomain(rawUrl, brand);
      const parsed = parseDomain(rawUrl);

      const isOfficial = domainResult.isOfficial;
      const isLookalike = domainResult.riskScore >= 50 && !isOfficial;

      if (isOfficial) {
        hasOfficial = true;
      } else {
        hasMismatch = true;
        if (isLookalike) {
          hasLookalike = true;
        }
      }

      const signal: DomainAnalysisSignal = {
        url: rawUrl,
        hostname: domainResult.hostname,
        isOfficialDomain: isOfficial,
        isLookalike,
        similarityScore: domainResult.riskScore,
        hasSuspiciousKeywords: domainResult.reasons.some((r) =>
          r.toLowerCase().includes('combosquat') ||
          r.toLowerCase().includes('homoglyph') ||
          r.toLowerCase().includes('prefix')
        ),
        isHighRiskTld: domainResult.riskScore > 30 && domainResult.reasons.some((r) => r.toLowerCase().includes('tld')),
        riskContribution: isOfficial ? 0 : domainResult.riskScore,
        details: domainResult.reasons,
      };

      signals.push(signal);

      if (isOfficial) {
        reasons.push(`External link points to verified official domain: "${domainResult.hostname}".`);
      } else {
        reasons.push(`External link points to unauthorized domain: "${domainResult.hostname}" (${domainResult.summaryPhrase || `Risk: ${domainResult.riskScore}/100`}).`);
        if (domainResult.riskScore > maxDomainRisk) {
          maxDomainRisk = domainResult.riskScore;
        }
      }
    } catch (err: any) {
      console.warn(`[SAFENET URL Analyzer] Failed inspecting external URL "${rawUrl}":`, err);
      // Fallback parse without crashing
      const parsed = parseDomain(rawUrl);
      signals.push({
        url: rawUrl,
        hostname: parsed.hostname,
        isOfficialDomain: false,
        isLookalike: false,
        similarityScore: 20,
        hasSuspiciousKeywords: false,
        isHighRiskTld: false,
        riskContribution: 20,
        details: [`Domain parsing succeeded for ${parsed.hostname}; DNS lookup unreachable.`],
      });
      hasMismatch = true;
      maxDomainRisk = Math.max(maxDomainRisk, 20);
    }
  }

  return {
    signals,
    hasExternalUrls: true,
    hasOfficialMatch: hasOfficial,
    hasMismatch,
    hasLookalike,
    domainRiskScore: hasOfficial && !hasMismatch ? 0 : maxDomainRisk,
    reasons,
  };
}
