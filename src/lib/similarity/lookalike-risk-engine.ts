/**
 * SAFENET Look-alike Risk Scoring Engine
 * Implements a transparent, calibrated 0-100 risk score separate from name similarity.
 * Combines lexical similarity with independent contextual evidence.
 * Prevents double-counting and enforces strict allowlisting before escalation.
 */

import { BrandProfile } from '@/types/brand';
import { evaluateLookalikeMatch, LookalikeEvaluation, VariationType } from './lookalike-engine';
import { LegitimateAssetRegistry, AllowlistMatch } from './legitimate-registry';

export type RiskBand = 'Low concern' | 'Needs review' | 'Suspicious' | 'High priority';

export type CandidateClassification =
  | 'CONFIRMED_OFFICIAL'
  | 'COMMON_WORD_BENIGN'
  | 'LOW_CONCERN_BENIGN'
  | 'INCONCLUSIVE_NEEDS_REVIEW'
  | 'SUSPICIOUS_CANDIDATE'
  | 'HIGH_PRIORITY_IMPERSONATION';

export interface RiskSignalContribution {
  id: string;
  category: 'name_similarity' | 'account_identity' | 'developer_publisher' | 'content_lures' | 'allowlist_status';
  points: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LookalikeRiskAssessment {
  candidateName: string;
  brandName: string;
  // Lexical similarity score (displayed separately)
  similarityScore: number; // 0 - 100
  similarityMetrics: {
    levenshteinSimilarity: number;
    jaroWinklerSimilarity: number;
    tokenSimilarity: number;
    editDistance: number;
  };
  variationType: VariationType;

  // Transparent contextual risk score
  riskScore: number;       // 0 - 100
  riskBand: RiskBand;      // "Low concern" | "Needs review" | "Suspicious" | "High priority"
  classification: CandidateClassification;
  isAllowlisted: boolean;
  allowlistDetail?: AllowlistMatch;

  // Contributing factors & explainability
  contributions: RiskSignalContribution[];
  reasons: string[];
  summaryPhrase: string;
  heuristicNotice: string;
}

/**
 * Maps risk score (0-100) to standard calibrated bands
 */
export function mapScoreToRiskBand(score: number): RiskBand {
  if (score >= 80) return 'High priority';
  if (score >= 60) return 'Suspicious';
  if (score >= 30) return 'Needs review';
  return 'Low concern';
}

export interface CandidateContextInput {
  name?: string;
  username?: string;
  platform?: string;
  profileUrl?: string;
  domain?: string;
  appId?: string;
  developer?: string;
  description?: string;
  hasSuspiciousLinks?: boolean;
  isVerifiedBadge?: boolean;
}

/**
 * Assesses complete look-alike risk with independent contextual evidence
 */
export function assessLookalikeRisk(
  candidateInput: string | CandidateContextInput,
  brand: BrandProfile
): LookalikeRiskAssessment {
  const context: CandidateContextInput =
    typeof candidateInput === 'string'
      ? { name: candidateInput }
      : candidateInput;

  const candidateName = (context.name || context.username || '').trim();
  const brandName = (brand.name || '').trim();

  // 1. Evaluate Lexical Similarity
  const lookalikeEval = evaluateLookalikeMatch(candidateName, brandName);
  const similarityScore = lookalikeEval.metrics.compositeSimilarityPercent;

  // 2. Evaluate Allowlist and Legitimate Asset Registry
  const allowlistMatch = LegitimateAssetRegistry.evaluateCandidateLegitimacy(
    {
      name: candidateName,
      username: context.username,
      url: context.profileUrl,
      domain: context.domain,
      appId: context.appId,
      developer: context.developer,
    },
    brand
  );

  const heuristicNotice =
    'Risk scores are transparent heuristic estimates combining name similarity with external evidence, not legal proof of fraud.';

  // 3. Handle Confirmed Official Asset
  if (allowlistMatch.isAllowlisted) {
    return {
      candidateName,
      brandName,
      similarityScore,
      similarityMetrics: {
        levenshteinSimilarity: lookalikeEval.metrics.levenshteinSimilarity,
        jaroWinklerSimilarity: lookalikeEval.metrics.jaroWinklerSimilarity,
        tokenSimilarity: lookalikeEval.metrics.tokenJaccardSimilarity,
        editDistance: lookalikeEval.metrics.damerauLevenshteinDistance,
      },
      variationType: lookalikeEval.variationType,
      riskScore: 0,
      riskBand: 'Low concern',
      classification: 'CONFIRMED_OFFICIAL',
      isAllowlisted: true,
      allowlistDetail: allowlistMatch,
      contributions: [
        {
          id: 'sig-allowlist-pass',
          category: 'allowlist_status',
          points: 0,
          description: allowlistMatch.reason,
          severity: 'low',
        },
      ],
      reasons: [allowlistMatch.reason],
      summaryPhrase: `Verified legitimate brand asset authenticated for "${brandName}".`,
      heuristicNotice,
    };
  }

  // 4. Handle Common Dictionary Word Suppression
  if (allowlistMatch.matchType === 'common_dictionary_word') {
    return {
      candidateName,
      brandName,
      similarityScore,
      similarityMetrics: {
        levenshteinSimilarity: lookalikeEval.metrics.levenshteinSimilarity,
        jaroWinklerSimilarity: lookalikeEval.metrics.jaroWinklerSimilarity,
        tokenSimilarity: lookalikeEval.metrics.tokenJaccardSimilarity,
        editDistance: lookalikeEval.metrics.damerauLevenshteinDistance,
      },
      variationType: 'low_similarity',
      riskScore: 5,
      riskBand: 'Low concern',
      classification: 'COMMON_WORD_BENIGN',
      isAllowlisted: false,
      allowlistDetail: allowlistMatch,
      contributions: [
        {
          id: 'sig-dict-word',
          category: 'name_similarity',
          points: 5,
          description: `Ordinary dictionary word recognized ("${candidateName}"). Suppressed from threat escalation.`,
          severity: 'low',
        },
      ],
      reasons: [`Ordinary common word that naturally resembles short brand name "${brandName}". No deception signals detected.`],
      summaryPhrase: `Low concern: candidate is an ordinary dictionary word without impersonation evidence.`,
      heuristicNotice,
    };
  }

  // 5. Evaluate Independent Risk Vectors
  const contributions: RiskSignalContribution[] = [];
  const reasons: string[] = [];

  // Vector 1: Name Similarity & Deception Signals (Capped at 30 if no other context exists)
  let namePoints = 0;
  if (lookalikeEval.isLookalike) {
    if (lookalikeEval.variationType === 'exact_match') {
      namePoints += 25;
      contributions.push({
        id: 'sig-exact-name',
        category: 'name_similarity',
        points: 25,
        description: `Name exactly matches protected brand "${brandName}" on an unverified asset.`,
        severity: 'high',
      });
      reasons.push(`Exact brand name match on unverified entity.`);
    } else if (lookalikeEval.variationType === 'homoglyph_confusable') {
      namePoints += 30;
      contributions.push({
        id: 'sig-homoglyph',
        category: 'name_similarity',
        points: 30,
        description: `Deceptive Unicode homoglyphs detected mimicking brand characters.`,
        severity: 'critical',
      });
      reasons.push(`Contains deceptive confusable Unicode characters.`);
    } else if (lookalikeEval.variationType === 'added_keyword') {
      namePoints += 25;
      contributions.push({
        id: 'sig-added-words',
        category: 'name_similarity',
        points: 25,
        description: `Appended authority or support keywords targeting brand "${brandName}".`,
        severity: 'high',
      });
      reasons.push(`Appended support/official keyword additions.`);
      // Unauthorized service/authority claim on unverified entity
      contributions.push({
        id: 'sig-unauthorized-service-claim',
        category: 'account_identity',
        points: 20,
        description: `Entity claims official support/service functions for "${brandName}" without registry authorization.`,
        severity: 'high',
      });
      reasons.push(`Unverified entity asserting authorized brand role.`);
    } else if (lookalikeEval.variationType === 'character_transposition') {
      namePoints += 20;
      contributions.push({
        id: 'sig-transposition',
        category: 'name_similarity',
        points: 20,
        description: `Adjacent character transposition (typo-squatting) targeting "${brandName}".`,
        severity: 'medium',
      });
      reasons.push(`Character transposition typosquatting pattern.`);
    } else if (lookalikeEval.variationType === 'separator_variation') {
      namePoints += 18;
      contributions.push({
        id: 'sig-separator',
        category: 'name_similarity',
        points: 18,
        description: `Delimiter / punctuation variation around brand stem "${brandName}".`,
        severity: 'medium',
      });
      reasons.push(`Punctuation or delimiter variation around brand stem.`);
    } else if (lookalikeEval.metrics.compositeSimilarityPercent >= 75) {
      namePoints += 15;
      contributions.push({
        id: 'sig-high-similarity',
        category: 'name_similarity',
        points: 15,
        description: `High lexical resemblance (${lookalikeEval.metrics.compositeSimilarityPercent}%) to protected brand.`,
        severity: 'medium',
      });
      reasons.push(`High name similarity to "${brandName}".`);
    } else if (lookalikeEval.metrics.compositeSimilarityPercent >= 60) {
      namePoints += 8;
      contributions.push({
        id: 'sig-mod-similarity',
        category: 'name_similarity',
        points: 8,
        description: `Moderate name similarity (${lookalikeEval.metrics.compositeSimilarityPercent}%).`,
        severity: 'low',
      });
    }
  }

  // Vector 2: Account Identity & Profile URL Mismatch (up to 25 points)
  if (context.username) {
    const cleanUser = context.username.replace(/^@/, '').toLowerCase();
    const userEval = evaluateLookalikeMatch(cleanUser, brandName);
    if (userEval.isLookalike && !allowlistMatch.isAllowlisted) {
      contributions.push({
        id: 'sig-unregistered-handle',
        category: 'account_identity',
        points: 20,
        description: `Handle "@${cleanUser}" mimics brand identity but is absent from registered official directory.`,
        severity: 'high',
      });
      reasons.push(`Unregistered handle mimicking brand identity.`);
    }
  }

  if (context.profileUrl) {
    const isOfficialDomain = (brand.officialDomains || [brand.domain]).some((od) =>
      context.profileUrl!.toLowerCase().includes(od.toLowerCase())
    );
    if (!isOfficialDomain && lookalikeEval.isLookalike) {
      contributions.push({
        id: 'sig-external-url',
        category: 'account_identity',
        points: 15,
        description: `Candidate profile links to external unauthenticated infrastructure.`,
        severity: 'medium',
      });
      reasons.push(`Routes users to non-official external URL.`);
    }
  }

  // Vector 3: Developer / Publisher Mismatch for Apps (up to 25 points)
  if (context.developer) {
    const cleanDev = context.developer.toLowerCase();
    const isAuthorizedDev = (brand.officialDevelopers || [brandName]).some(
      (od) => cleanDev.includes(od.toLowerCase()) || od.toLowerCase().includes(cleanDev)
    );
    if (!isAuthorizedDev && lookalikeEval.isLookalike) {
      contributions.push({
        id: 'sig-unauthorized-publisher',
        category: 'developer_publisher',
        points: 22,
        description: `Application publisher "${context.developer}" does not match verified organization: "${brandName}".`,
        severity: 'high',
      });
      reasons.push(`Application publisher does not match official organization.`);
    }
  }

  // Vector 4: Suspicious Content & Description (up to 20 points)
  if (context.description) {
    const desc = context.description.toLowerCase();
    const scamCues = ['official support', '24x7 help', 'helpline', 'refund status', 'kyc update', 'verify account', 'call now', 'support team', 'official support', 'claim cashback'];
    const matchedCues = scamCues.filter((c) => desc.includes(c));
    if (matchedCues.length > 0 && lookalikeEval.isLookalike) {
      const cuePoints = matchedCues.length > 1 ? 20 : 15;
      contributions.push({
        id: 'sig-desc-lures',
        category: 'content_lures',
        points: cuePoints,
        description: `Profile / app description makes unauthorized service claims: [${matchedCues.join(', ')}].`,
        severity: 'high',
      });
      reasons.push(`Description claims authority with support keywords: [${matchedCues.join(', ')}].`);
    }
  }

  // Vector 5: Mitigating evidence (e.g. platform verified badge)
  if (context.isVerifiedBadge) {
    contributions.push({
      id: 'sig-platform-verified',
      category: 'account_identity',
      points: -15,
      description: `Platform verification badge observed (mitigating factor).`,
      severity: 'low',
    });
  }

  // Calculate composite risk score
  // If NO external corroborating evidence exists, cap the risk score at 29 (Low concern)
  // to avoid classifying as malicious solely based on name similarity!
  const hasCorroboratingContext =
    contributions.some((c) => c.category !== 'name_similarity');

  let rawTotal = contributions.reduce((acc, c) => acc + c.points, 0);

  if (!hasCorroboratingContext && lookalikeEval.variationType !== 'homoglyph_confusable') {
    // Isolated name similarity without any external risk context is capped at 28 (Low concern)
    rawTotal = Math.min(28, rawTotal);
  }

  const finalScore = Math.min(100, Math.max(0, rawTotal));
  const riskBand = mapScoreToRiskBand(finalScore);

  let classification: CandidateClassification = 'LOW_CONCERN_BENIGN';
  if (finalScore >= 80) classification = 'HIGH_PRIORITY_IMPERSONATION';
  else if (finalScore >= 60) classification = 'SUSPICIOUS_CANDIDATE';
  else if (finalScore >= 30) classification = 'INCONCLUSIVE_NEEDS_REVIEW';
  else classification = 'LOW_CONCERN_BENIGN';

  const summaryPhrase =
    finalScore >= 80
      ? `High-priority brand impersonation candidate targeting "${brandName}" with multiple corroborating signals.`
      : finalScore >= 60
      ? `Suspicious brand-resembling entity identified. Analyst review recommended.`
      : finalScore >= 30
      ? `Inconclusive resemblance detected. Contextual indicators require manual review.`
      : `Low concern: no significant impersonation or threat evidence detected.`;

  return {
    candidateName,
    brandName,
    similarityScore,
    similarityMetrics: {
      levenshteinSimilarity: lookalikeEval.metrics.levenshteinSimilarity,
      jaroWinklerSimilarity: lookalikeEval.metrics.jaroWinklerSimilarity,
      tokenSimilarity: lookalikeEval.metrics.tokenJaccardSimilarity,
      editDistance: lookalikeEval.metrics.damerauLevenshteinDistance,
    },
    variationType: lookalikeEval.variationType,
    riskScore: finalScore,
    riskBand,
    classification,
    isAllowlisted: false,
    allowlistDetail: allowlistMatch,
    contributions,
    reasons: reasons.length > 0 ? reasons : ['No threat signals detected.'],
    summaryPhrase,
    heuristicNotice,
  };
}
