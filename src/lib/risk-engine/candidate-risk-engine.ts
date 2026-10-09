/**
 * SAFENET Candidate Risk Engine
 * Computes transparent, evidence-based risk scores (0-100) for discovered candidates
 * by comparing them against the official Brand Profile baseline.
 * ONLY includes signals when verifiable evidence exists.
 */

import { BrandProfile, ThreatEvidence, ThreatIOC } from '@/types/brand';
import { DiscoveredCandidate } from '../providers/types';
import { evaluateLookalikeMatch } from '../similarity/lookalike-engine';

export interface CandidateRiskBreakdown {
  nameSimilarity: number;        // 0 - 20
  usernameSimilarity: number;    // 0 - 15
  officialMismatch: number;      // 0 - 20
  developerMismatch: number;     // 0 - 15
  externalLinkMismatch: number;  // 0 - 15
  brandClaim: number;            // 0 - 10
  brandingSimilarity: number;    // 0 - 5
  totalScore: number;            // 0 - 100
}

export interface CandidateRiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isOfficialAsset: boolean;
  summaryPhrase: string;
  reasons: string[];
  breakdown: CandidateRiskBreakdown;
  evidence: ThreatEvidence[];
  iocs: ThreatIOC[];
}

export function assessCandidateRisk(
  candidate: DiscoveredCandidate,
  brand: BrandProfile
): CandidateRiskAssessment {
  const brandName = brand.name.trim();
  const brandDomain = brand.domain.trim().toLowerCase();
  const officialDomains = (brand.officialDomains || [brandDomain]).map((d: string) => d.toLowerCase().trim());
  const officialHandles = Object.values(brand.handles || {})
    .filter(Boolean)
    .map((h) => h!.replace(/^@/, '').toLowerCase().trim());
  const officialDevelopers = (brand.officialDevelopers || [brandName]).map((d: string) => d.toLowerCase().trim());
  const authorizedAppIds = (brand.authorizedAppIds || [brand.appPackageName || ''])
    .filter(Boolean)
    .map((id: string) => id.toLowerCase().trim());

  const reasons: string[] = [];
  const evidenceList: ThreatEvidence[] = [...(candidate.evidence || [])];
  const iocs: ThreatIOC[] = [];

  // Check 1: Is this candidate a verified official asset?
  let isOfficialAsset = false;

  // Social handle check
  if (candidate.username) {
    const cleanCandUser = candidate.username.replace(/^@/, '').toLowerCase().trim();
    if (officialHandles.includes(cleanCandUser)) {
      isOfficialAsset = true;
    }
    iocs.push({ type: 'domain', value: `@${cleanCandUser}` });
  }

  // App ID check
  if (candidate.appId && authorizedAppIds.includes(candidate.appId.toLowerCase().trim())) {
    isOfficialAsset = true;
  }

  // Domain / URL check
  if (candidate.url) {
    try {
      const parsed = new URL(candidate.url);
      const host = parsed.hostname.toLowerCase();
      if (officialDomains.some((od) => host === od || host.endsWith(`.${od}`))) {
        isOfficialAsset = true;
      }
      iocs.push({ type: 'domain', value: host });
    } catch {
      // Ignore URL parse failure
    }
  }

  // If verified official asset, return minimal risk immediately
  if (isOfficialAsset) {
    evidenceList.push({
      id: `ev-official-match-${Date.now()}`,
      title: 'Verified Official Brand Asset',
      description: `Target entity matches the registered brand profile baseline for "${brandName}".`,
      severity: 'low',
      category: 'Brand Inventory Verification',
      value: candidate.title,
      source: 'SAFENET Brand Registry',
      status: 'available',
    });

    return {
      riskScore: 0,
      riskLevel: 'LOW',
      isOfficialAsset: true,
      summaryPhrase: `Verified official brand entity authenticated for "${brandName}".`,
      reasons: [`Matches authorized brand asset directory for ${brandName}.`],
      breakdown: {
        nameSimilarity: 0,
        usernameSimilarity: 0,
        officialMismatch: 0,
        developerMismatch: 0,
        externalLinkMismatch: 0,
        brandClaim: 0,
        brandingSimilarity: 0,
        totalScore: 0,
      },
      evidence: evidenceList,
      iocs,
    };
  }

  // Evaluate individual risk signals from actual evidence
  let nameSimilarity = 0;
  let usernameSimilarity = 0;
  let officialMismatch = 0;
  let developerMismatch = 0;
  let externalLinkMismatch = 0;
  let brandClaim = 0;
  const brandingSimilarity = 0;

  // 1. Title / Name Similarity (0 - 20)
  const nameEval = evaluateLookalikeMatch(candidate.title, brandName);
  nameSimilarity = nameEval.similarityScore0to20;
  if (nameSimilarity > 0) {
    reasons.push(`Title exhibits ${nameEval.similarityRatio >= 0.8 ? 'strong' : 'moderate'} resemblance to protected brand "${brandName}".`);
    nameEval.signals.forEach((sig) => {
      evidenceList.push({
        id: `ev-sim-${sig.type}-${Date.now()}`,
        title: 'Brand Resemblance Signal',
        description: sig.description,
        severity: sig.weight >= 15 ? 'high' : 'medium',
        category: 'Identity Comparison',
        value: candidate.title,
        source: 'SAFENET Look-alike Engine',
        status: 'available',
      });
    });
  }

  // 2. Username / Handle Similarity (0 - 15)
  if (candidate.username) {
    const cleanCandUser = candidate.username.replace(/^@/, '').trim();
    const userEval = evaluateLookalikeMatch(cleanCandUser, brandName);
    usernameSimilarity = Math.min(15, Math.round(userEval.similarityScore0to20 * 0.75));

    if (usernameSimilarity > 0) {
      reasons.push(`Handle "@${cleanCandUser}" closely mimics official brand name "${brandName}".`);
      evidenceList.push({
        id: `ev-user-sim-${Date.now()}`,
        title: 'Username Impersonation Signal',
        description: `Candidate handle "@${cleanCandUser}" exhibits string distance similarity to brand stem "${brandName}".`,
        severity: 'high',
        category: 'Identity Comparison',
        value: `@${cleanCandUser}`,
        source: 'SAFENET Look-alike Engine',
        status: 'available',
      });
    }

    // Official Account Mismatch (0 - 20)
    // Candidate mimics brand name in handle or title, but is NOT in registered official handles!
    if (nameSimilarity >= 10 || usernameSimilarity >= 8) {
      officialMismatch = 20;
      reasons.push(`Candidate claims brand identity but is absent from registered official accounts.`);
      evidenceList.push({
        id: `ev-unauthorized-handle-${Date.now()}`,
        title: 'Unregistered Social Identity',
        description: `Account is not listed among authorized handles: [${officialHandles.join(', ') || 'None registered'}].`,
        severity: 'high',
        category: 'Authorization Audit',
        value: `@${cleanCandUser}`,
        source: 'SAFENET Brand Baseline Comparison',
        status: 'available',
      });
    }
  }

  // 3. Developer Mismatch (0 - 15) for Mobile Applications
  if (candidate.sourceType === 'app') {
    if (candidate.developer) {
      const devName = candidate.developer.toLowerCase().trim();
      const isAuthorizedDev = officialDevelopers.some(
        (od: string) => devName.includes(od) || od.includes(devName)
      );

      if (!isAuthorizedDev && nameSimilarity >= 10) {
        developerMismatch = 15;
        reasons.push(`Application publisher "${candidate.developer}" does not match official developer identity.`);
        evidenceList.push({
          id: `ev-dev-mismatch-${Date.now()}`,
          title: 'Unauthorized App Publisher',
          description: `Discovered app developer "${candidate.developer}" does not match verified organization: "${brandName}".`,
          severity: 'high',
          category: 'Publisher Authenticity',
          value: candidate.developer,
          source: 'App Store Storefront Inspection',
          status: 'available',
        });
      } else if (isAuthorizedDev) {
        // Legitimate app published by organization
        developerMismatch = 0;
      }
    }

    // App ID Mismatch
    if (candidate.appId && nameSimilarity >= 12 && !authorizedAppIds.includes(candidate.appId.toLowerCase())) {
      officialMismatch = Math.max(officialMismatch, 15);
      reasons.push(`Bundle ID "${candidate.appId}" is not registered in official app portfolio.`);
      evidenceList.push({
        id: `ev-appid-mismatch-${Date.now()}`,
        title: 'Unregistered Application Package',
        description: `Package identifier "${candidate.appId}" is not in authorized app inventory.`,
        severity: 'medium',
        category: 'Application Registry',
        value: candidate.appId,
        source: 'App Store Metadata',
        status: 'available',
      });
    }
  }

  // 4. External Link / Domain Mismatch (0 - 15)
  const candidateLink = candidate.website || candidate.url;
  if (candidateLink && (candidate.sourceType === 'social' || candidate.sourceType === 'app')) {
    try {
      const parsed = new URL(candidateLink);
      const host = parsed.hostname.toLowerCase();
      const isOfficialDomain = officialDomains.some((od: string) => host === od || host.endsWith(`.${od}`));

      if (!isOfficialDomain && (nameSimilarity >= 10 || usernameSimilarity >= 8)) {
        externalLinkMismatch = 15;
        reasons.push(`Candidate links to external unverified destination "${host}".`);
        evidenceList.push({
          id: `ev-link-mismatch-${Date.now()}`,
          title: 'External Domain Mismatch',
          description: `Entity redirects users to external domain "${host}", which does not match official domain "${brandDomain}".`,
          severity: 'high',
          category: 'Destination Integrity',
          value: host,
          source: 'Candidate Link Analysis',
          status: 'available',
        });
      }
    } catch {
      // Skip invalid URL
    }
  }

  // 5. Brand Claim in Description (0 - 10)
  const desc = (candidate.description || '').toLowerCase();
  if (desc) {
    const claimKeywords = ['official', 'customer support', '24x7', 'helpline', 'refund', 'kyc', 'care desk', 'security team'];
    const matchedClaims = claimKeywords.filter((k) => desc.includes(k));

    if (matchedClaims.length > 0 && (nameSimilarity >= 10 || usernameSimilarity >= 8)) {
      brandClaim = Math.min(10, matchedClaims.length * 4);
      reasons.push(`Candidate bio/description asserts authority using keywords: [${matchedClaims.join(', ')}].`);
      evidenceList.push({
        id: `ev-brand-claim-${Date.now()}`,
        title: 'Brand Impersonation Claims',
        description: `Description explicitly claims authorized support or service roles: [${matchedClaims.join(', ')}].`,
        severity: 'medium',
        category: 'Content Analysis',
        value: matchedClaims.join(', '),
        source: 'Profile/App Description Inspection',
        status: 'available',
      });
    }
  }

  // 6. Honest Branding / Logo Similarity (Rule: Never fabricate 93%)
  evidenceList.push({
    id: `ev-logo-eval-${Date.now()}`,
    title: 'Logo Comparison Assessment',
    description: 'Logo similarity unavailable — insufficient image evidence for deterministic pixel comparison.',
    severity: 'low',
    category: 'Visual Asset Comparison',
    value: candidate.imageUrl ? 'Candidate Image Present (Uncompared)' : 'No Candidate Image',
    source: 'Visual Similarity Engine',
    status: 'unavailable',
  });

  // Calculate composite total risk score (0 - 100)
  const rawTotal =
    nameSimilarity +
    usernameSimilarity +
    officialMismatch +
    developerMismatch +
    externalLinkMismatch +
    brandClaim +
    brandingSimilarity;

  const totalScore = Math.min(100, Math.max(0, rawTotal));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (totalScore >= 80) riskLevel = 'CRITICAL';
  else if (totalScore >= 60) riskLevel = 'HIGH';
  else if (totalScore >= 30) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  const summaryPhrase =
    totalScore >= 60
      ? `High-probability brand impersonation entity detected targeting "${brandName}".`
      : totalScore >= 30
      ? `Elevated risk signals detected requiring SOC analyst verification.`
      : `Low probability of active impersonation targeting "${brandName}".`;

  return {
    riskScore: totalScore,
    riskLevel,
    isOfficialAsset: false,
    summaryPhrase,
    reasons: reasons.length > 0 ? reasons : [`Nominal digital footprint for ${candidate.title}.`],
    breakdown: {
      nameSimilarity,
      usernameSimilarity,
      officialMismatch,
      developerMismatch,
      externalLinkMismatch,
      brandClaim,
      brandingSimilarity,
      totalScore,
    },
    evidence: evidenceList,
    iocs,
  };
}
