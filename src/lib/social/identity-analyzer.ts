/**
 * SAFENET Social Identity Analyzer
 * Compares candidate account identity against protected Brand Identity Profile:
 * - Display name similarity & alias matching
 * - Username / handle normalization & lookalike evaluation
 * - Combosquatting detection (affixes like support, kyc, care, official)
 * - Official handle verification & whitelist match
 * - Branding / bio intent extraction (urgent assistance, refunds, UPI, credential harvesting)
 */

import { BrandIdentityProfile, SocialCandidate } from './types';
import { evaluateLookalikeMatch } from '../similarity/lookalike-engine';
import { getSimilarityScore, analyzePrefixSuffixAdditions } from '../similarity/levenshtein';
import { analyzeHomoglyphs } from '../similarity/homoglyphs';

export interface IdentityAnalysisReport {
  nameSimilarity: number;        // 0 to 100
  usernameSimilarity: number;    // 0 to 100
  brandingSimilarity: number;    // 0 to 100
  officialAccountMatch: boolean;
  isCombosquatting: boolean;
  detectedAffix?: string;
  hasHomoglyphs: boolean;
  brandingTriggers: string[];
  matchedAlias?: string;
  reasons: string[];
}

export function normalizeHandle(handle: string): string {
  return (handle || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[._\-]/g, '');
}

const SUPPORT_SCAM_KEYWORDS = [
  'support',
  'customer care',
  'helpline',
  'helpdesk',
  'official',
  'resolution',
  'grievance',
  'refund',
  'kyc',
  'verification',
  'account recovery',
  'toll free',
  'whatsapp',
  '24x7',
  'urgent',
  'immediate reversal',
  'complaint',
  'help line',
  'service desk',
  'care center',
];

export function analyzeCandidateIdentity(
  candidate: SocialCandidate,
  brandProfile: BrandIdentityProfile
): IdentityAnalysisReport {
  const brandName = (brandProfile.brandName || '').trim();
  const rawUsername = (candidate.username || '').replace(/^@/, '').trim();
  const rawDisplayName = (candidate.displayName || '').trim();
  const description = (candidate.description || '').toLowerCase();

  const reasons: string[] = [];

  // 1. Official Handle Match Check
  const platformHandle = brandProfile.officialSocialHandles?.[candidate.platform];
  const allOfficialHandles = Object.values(brandProfile.officialSocialHandles || {})
    .filter(Boolean)
    .map((h) => normalizeHandle(h!));

  const normCandidateHandle = normalizeHandle(rawUsername);
  const isOfficialHandle = Boolean(
    (platformHandle && normalizeHandle(platformHandle) === normCandidateHandle) ||
    allOfficialHandles.includes(normCandidateHandle)
  );

  if (isOfficialHandle) {
    reasons.push(`Account handle matches official registered ${candidate.platform.toUpperCase()} asset.`);
    return {
      nameSimilarity: 100,
      usernameSimilarity: 100,
      brandingSimilarity: 0,
      officialAccountMatch: true,
      isCombosquatting: false,
      hasHomoglyphs: false,
      brandingTriggers: [],
      reasons,
    };
  }

  // 2. Name Similarity against Brand Name and Aliases
  let maxNameSim = 0;
  let matchedAlias: string | undefined = undefined;

  const nameTargets = [brandName, ...(brandProfile.aliases || [])].filter(Boolean);
  for (const target of nameTargets) {
    const evalResult = evaluateLookalikeMatch(rawDisplayName, target);
    const score = Math.round(evalResult.similarityRatio * 100);
    if (score > maxNameSim) {
      maxNameSim = score;
      if (target.toLowerCase() !== brandName.toLowerCase()) {
        matchedAlias = target;
      }
    }
  }

  // 3. Username Similarity & Combosquatting
  let maxUsernameSim = 0;
  let isCombosquatting = false;
  let detectedAffix: string | undefined = undefined;

  for (const target of nameTargets) {
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanUser = rawUsername.toLowerCase().replace(/[^a-z0-9]/g, '');

    const simScore = getSimilarityScore(cleanUser, cleanTarget);
    const ratioScore = Math.round(simScore.similarityRatio * 100);

    const comboCheck = analyzePrefixSuffixAdditions(cleanUser, cleanTarget);
    if (comboCheck.isCombosquatting) {
      isCombosquatting = true;
      detectedAffix = comboCheck.matchedAffixes?.[0] || comboCheck.suffix || comboCheck.prefix;
    }

    // Direct containment bonus (e.g. "hdfc_bank_support" contains "hdfcbank")
    let effectiveScore = ratioScore;
    if (cleanUser.includes(cleanTarget) && cleanTarget.length >= 3) {
      effectiveScore = Math.max(effectiveScore, 85);
    }

    if (effectiveScore > maxUsernameSim) {
      maxUsernameSim = effectiveScore;
    }
  }

  // 4. Homoglyphs check on username and display name
  const homoglyphs = analyzeHomoglyphs(`${rawUsername} ${rawDisplayName}`);
  const hasHomoglyphs = homoglyphs.hasHomoglyphs;
  if (hasHomoglyphs) {
    const chars = homoglyphs.matches.map((m) => m.confusableChar).join(', ');
    reasons.push(`Contains deceptive character substitutions (homoglyphs): ${chars}.`);
  }

  // 5. Branding / Bio Intent Analysis
  const brandingTriggers: string[] = [];
  for (const kw of SUPPORT_SCAM_KEYWORDS) {
    if (description.includes(kw)) {
      brandingTriggers.push(kw);
    }
  }

  let brandingSimilarity = 0;
  if (brandingTriggers.length > 0) {
    // 20 points per trigger keyword, max 100
    brandingSimilarity = Math.min(100, brandingTriggers.length * 25);
    reasons.push(`Profile description uses high-risk support/authority terminology: "${brandingTriggers.slice(0, 4).join('", "')}".`);
  }

  // Record descriptive reasons
  if (maxUsernameSim >= 80) {
    reasons.push(`Username "@${rawUsername}" exhibits strong similarity (${maxUsernameSim}%) to brand "${brandName}".`);
  } else if (maxUsernameSim >= 60) {
    reasons.push(`Username "@${rawUsername}" contains brand name patterns (${maxUsernameSim}% match).`);
  }

  if (isCombosquatting) {
    reasons.push(`Combosquatting detected with keyword affix "${detectedAffix || 'support'}".`);
  }

  if (maxNameSim >= 85) {
    reasons.push(`Display name "${rawDisplayName}" closely matches brand identity (${maxNameSim}% similarity).`);
  }

  return {
    nameSimilarity: maxNameSim,
    usernameSimilarity: maxUsernameSim,
    brandingSimilarity,
    officialAccountMatch: false,
    isCombosquatting,
    detectedAffix,
    hasHomoglyphs,
    brandingTriggers,
    matchedAlias,
    reasons,
  };
}
