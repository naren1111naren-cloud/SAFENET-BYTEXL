/**
 * SAFENET Instagram Impersonation & Brand Risk Analyzer
 * 
 * Performs deterministic, explainable risk assessment on discovered Instagram candidates:
 * - Username similarity (Levenshtein, Jaro-Winkler, homoglyphs, prefix/suffix additions, typosquatting)
 * - Display-name and biography intent (support, KYC, refund, helpdesk, unverified contact claims)
 * - Website and external-link inconsistencies (lookalike domains, unofficial redirectors vs official brand domain)
 * - Profile image signal evaluation (lawful inspection status without fabricated visual scores)
 * - Follower and engagement metrics (screening signal context, never sole determinant of fraud)
 * - Data completeness, provenance, and freshness
 * 
 * PRINCIPLE OF RESPONSIBLE DETECTION:
 * Risk scores are screening signals to assist security analysts, not definitive proof of wrongdoing.
 */

import {
  BrandIdentityProfile,
  SocialCandidate,
  SocialRiskResult,
  ThreatClassification,
  EvidenceItem,
  LogoAnalysisSignal,
  DomainAnalysisSignal,
} from './types';
import { analyzeCandidateIdentity } from './identity-analyzer';
import { analyzeCandidateExternalUrls } from './url-analyzer';
import { analyzeLogoSimilarity } from './logo-analyzer';

export interface InstagramAnalysisReport {
  candidate: SocialCandidate;
  brandProfile: BrandIdentityProfile;
  risk: SocialRiskResult;
  screeningSummary: string;
  signals: {
    usernameSimilarity: number;
    displayNameSimilarity: number;
    bioSupportIntentScore: number;
    externalLinkRiskScore: number;
    isCombosquatting: boolean;
    detectedAffix?: string;
    hasHomoglyphs: boolean;
    hasOfficialDomainLink: boolean;
    hasLookalikeDomainLink: boolean;
    avatarStatus: 'evaluated' | 'not_available' | 'error';
    isEnrichedViaMeta: boolean;
  };
}

export async function analyzeInstagramCandidate(
  candidate: SocialCandidate,
  brandProfile: BrandIdentityProfile
): Promise<InstagramAnalysisReport> {
  const brandName = brandProfile.brandName || 'Brand';
  const rawUsername = (candidate.username || '').replace(/^@/, '').trim();
  const rawDisplayName = (candidate.displayName || '').trim();
  const description = (candidate.description || '').toLowerCase();

  // 1. Run core identity analysis (handles lexical matching, combosquatting, homoglyphs, bio triggers)
  const identity = analyzeCandidateIdentity(candidate, brandProfile);

  // 2. Run URL and external domain intelligence
  const urlAnalysis = await analyzeCandidateExternalUrls(candidate.externalUrls, brandProfile);

  // 3. Run logo / visual asset analysis
  const logoSignal = await analyzeLogoSimilarity({
    officialLogoUrl: brandProfile.logo,
    candidateImageUrl: candidate.profileImageUrl,
  });

  // 4. Evaluate Instagram-specific signals
  const isCombosquatting = identity.isCombosquatting;
  const hasHomoglyphs = identity.hasHomoglyphs;
  const isEnrichedViaMeta = Boolean(candidate.rawMetadata?.isEnrichedViaMeta || candidate.source.includes('Meta'));

  let hasOfficialDomainLink = false;
  let hasLookalikeDomainLink = false;
  for (const s of urlAnalysis.signals) {
    if (s.isOfficialDomain) hasOfficialDomainLink = true;
    if (s.isLookalike) hasLookalikeDomainLink = true;
  }

  // 5. Calculate transparent multi-factor score (0-100)
  // Whitelist check
  if (identity.officialAccountMatch) {
    const risk: SocialRiskResult = {
      riskScore: 2,
      riskLevel: 'LOW',
      threatClassification: 'LIKELY_OFFICIAL',
      confidence: 99,
      identityScore: 2,
      domainRiskScore: 0,
      nameSimilarity: identity.nameSimilarity,
      usernameSimilarity: identity.usernameSimilarity,
      brandingSimilarity: 0,
      logoSimilarity: logoSignal,
      domainAnalysis: urlAnalysis.signals,
      officialAccountMatch: true,
      isCombosquatting: false,
      reasons: [
        `Likely Official: Handle "@${rawUsername}" matches the authenticated Instagram registry for ${brandName}.`,
      ],
      evidenceList: [
        {
          id: `ev-ig-official-${candidate.id}`,
          category: 'Identity Registry',
          label: 'Official Account Verified',
          severity: 'INFO',
          value: `@${rawUsername}`,
          details: `Matches official Instagram handle registered in Brand Identity Profile.`,
        },
      ],
      structuredEvidence: [
        {
          signal: 'official_whitelist_match',
          value: `@${rawUsername}`,
          severity: 'INFO',
          source: 'Brand Identity Fingerprint',
          explanation: `Matches official Instagram handle configured in Brand Identity Profile.`,
        },
      ],
    };

    return {
      candidate,
      brandProfile,
      risk,
      screeningSummary: `Authenticated official Instagram profile for ${brandName}.`,
      signals: {
        usernameSimilarity: 100,
        displayNameSimilarity: 100,
        bioSupportIntentScore: 0,
        externalLinkRiskScore: 0,
        isCombosquatting: false,
        hasHomoglyphs: false,
        hasOfficialDomainLink: true,
        hasLookalikeDomainLink: false,
        avatarStatus: logoSignal.status,
        isEnrichedViaMeta,
      },
    };
  }

  // Weight components
  // Base identity score: Username (40%), Display name (25%), Bio branding (20%), External URLs (15%)
  let identityScore = Math.round(
    identity.usernameSimilarity * 0.40 +
    identity.nameSimilarity * 0.25 +
    identity.brandingSimilarity * 0.20
  );

  if (isCombosquatting) {
    identityScore = Math.max(identityScore, 70);
  }

  let domainRiskScore = 0;
  if (urlAnalysis.hasExternalUrls) {
    domainRiskScore = urlAnalysis.domainRiskScore;
  }

  let compositeScore = 0;
  if (urlAnalysis.hasExternalUrls) {
    compositeScore = identityScore * 0.60 + domainRiskScore * 0.40;
  } else {
    compositeScore = identityScore * 0.85;
  }

  // Adjustments for specific risk indicators
  if (isCombosquatting && identity.brandingTriggers.length > 0) {
    // Both combosquatting AND support claims in bio -> elevated screening priority
    compositeScore += 12;
  }

  if (hasLookalikeDomainLink) {
    // Bio link points to lookalike domain -> critical indicator
    compositeScore += 20;
  }

  if (hasHomoglyphs) {
    compositeScore += 15;
  }

  // Cap score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(compositeScore)));

  // Threat classification tier
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let threatClassification: ThreatClassification = 'LOW_CONCERN';

  if (finalScore >= 85) {
    riskLevel = 'CRITICAL';
    threatClassification = 'CRITICAL_THREAT';
  } else if (finalScore >= 60) {
    riskLevel = 'HIGH';
    threatClassification = 'HIGH_RISK';
  } else if (finalScore >= 30) {
    riskLevel = 'MEDIUM';
    threatClassification = 'SUSPICIOUS';
  } else {
    riskLevel = 'LOW';
    threatClassification = 'LOW_CONCERN';
  }

  // Confidence calculation
  let confidence = 65;
  if (candidate.description && candidate.description.length > 20) confidence += 15;
  if (urlAnalysis.hasExternalUrls) confidence += 10;
  if (isEnrichedViaMeta) confidence += 10;
  confidence = Math.min(95, confidence);

  // Compile reasons and structured evidence
  const reasons: string[] = [];
  const evidenceList: SocialRiskResult['evidenceList'] = [];
  const structuredEvidence: EvidenceItem[] = [];

  // Username mimicry
  if (identity.usernameSimilarity >= 60) {
    const sev = identity.usernameSimilarity >= 80 ? 'HIGH' : 'MEDIUM';
    reasons.push(`Instagram handle "@${rawUsername}" exhibits strong similarity (${identity.usernameSimilarity}%) to brand "${brandName}".`);
    evidenceList.push({
      id: `ev-ig-user-${candidate.id}`,
      category: 'Handle Similarity',
      label: 'Brand Username Mimicry',
      severity: sev,
      value: `@${rawUsername} (${identity.usernameSimilarity}%)`,
      details: `Candidate Instagram handle resembles monitored brand "${brandName}".`,
    });
    structuredEvidence.push({
      signal: 'instagram_handle_similarity',
      value: (identity.usernameSimilarity / 100).toFixed(2),
      severity: sev,
      source: 'Instagram Handle Analyzer',
      explanation: `Handle "@${rawUsername}" has ${identity.usernameSimilarity}% lexical similarity to brand "${brandName}".`,
    });
  }

  // Combosquatting
  if (isCombosquatting) {
    reasons.push(`Combosquatting detected on Instagram: handle appends authority keyword "${identity.detectedAffix || 'support'}".`);
    evidenceList.push({
      id: `ev-ig-combo-${candidate.id}`,
      category: 'Combosquatting',
      label: 'Authority Keyword Added',
      severity: 'HIGH',
      value: identity.detectedAffix || 'support',
      details: `Appends authority keyword "${identity.detectedAffix || 'support'}" to brand handle.`,
    });
    structuredEvidence.push({
      signal: 'instagram_combosquatting',
      value: identity.detectedAffix || 'support',
      severity: 'HIGH',
      source: 'Combosquatting Engine',
      explanation: `Appends "${identity.detectedAffix || 'support'}" to brand identity, common in deceptive customer care handles.`,
    });
  }

  // Bio claims
  if (identity.brandingTriggers.length > 0) {
    reasons.push(`Bio claims customer service / authority using keywords: "${identity.brandingTriggers.slice(0, 4).join('", "')}".`);
    evidenceList.push({
      id: `ev-ig-bio-${candidate.id}`,
      category: 'Bio Intent',
      label: 'Customer Support Claims',
      severity: 'HIGH',
      value: identity.brandingTriggers.join(', '),
      details: `Profile biography claims customer service or verification role without verified brand authorization.`,
    });
    structuredEvidence.push({
      signal: 'instagram_bio_support_claims',
      value: identity.brandingTriggers.join(', '),
      severity: 'HIGH',
      source: 'Bio NLP Analyzer',
      explanation: `Biography includes high-risk keywords: "${identity.brandingTriggers.join(', ')}".`,
    });
  }

  // External URLs
  for (const s of urlAnalysis.signals) {
    if (s.isOfficialDomain) {
      reasons.push(`Bio website points to verified official domain "${s.hostname}".`);
      evidenceList.push({
        id: `ev-ig-url-off-${candidate.id}`,
        category: 'External Link',
        label: 'Official Domain Link',
        severity: 'LOW',
        value: s.hostname,
        details: `Linked website belongs to authentic brand domain.`,
      });
    } else {
      const sev = s.isLookalike ? 'CRITICAL' : 'HIGH';
      reasons.push(`Bio website points to unauthorized external domain "${s.hostname}" (Domain Risk: ${s.similarityScore}/100).`);
      evidenceList.push({
        id: `ev-ig-url-risk-${candidate.id}`,
        category: 'External Link',
        label: s.isLookalike ? 'Lookalike Bio Link' : 'Unauthorized Bio Link',
        severity: sev,
        value: s.hostname,
        details: `Linked URL "${s.url}" does not match official domain "${brandProfile.officialDomain}".`,
      });
      structuredEvidence.push({
        signal: s.isLookalike ? 'instagram_lookalike_bio_link' : 'instagram_unauthorized_bio_link',
        value: s.hostname,
        severity: sev,
        source: 'SAFENET Domain Intelligence',
        explanation: `External destination "${s.hostname}" is not authorized. Risk: ${s.similarityScore}/100.`,
      });
    }
  }

  // Unregistered notice
  reasons.push(`Account is not listed in the official ${brandName} social asset inventory.`);
  evidenceList.push({
    id: `ev-ig-auth-${candidate.id}`,
    category: 'Asset Inventory',
    label: 'Unregistered Social Profile',
    severity: 'MEDIUM',
    value: `@${rawUsername}`,
    details: `Account is not present in the verified social handles for ${brandName}.`,
  });

  const risk: SocialRiskResult = {
    riskScore: finalScore,
    riskLevel,
    threatClassification,
    confidence,
    identityScore,
    domainRiskScore,
    nameSimilarity: identity.nameSimilarity,
    usernameSimilarity: identity.usernameSimilarity,
    brandingSimilarity: identity.brandingSimilarity,
    logoSimilarity: logoSignal,
    domainAnalysis: urlAnalysis.signals,
    officialAccountMatch: false,
    isCombosquatting,
    reasons,
    evidenceList,
    structuredEvidence,
  };

  return {
    candidate,
    brandProfile,
    risk,
    screeningSummary: `Instagram account @${rawUsername} evaluated with risk score ${finalScore}/100 (${threatClassification}). Screening signal only.`,
    signals: {
      usernameSimilarity: identity.usernameSimilarity,
      displayNameSimilarity: identity.nameSimilarity,
      bioSupportIntentScore: identity.brandingSimilarity,
      externalLinkRiskScore: domainRiskScore,
      isCombosquatting,
      detectedAffix: identity.detectedAffix,
      hasHomoglyphs,
      hasOfficialDomainLink,
      hasLookalikeDomainLink,
      avatarStatus: logoSignal.status,
      isEnrichedViaMeta,
    },
  };
}
