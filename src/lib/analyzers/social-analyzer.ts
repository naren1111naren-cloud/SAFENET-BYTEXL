import { BrandProfile, SocialProfileEntity, ThreatEvidence, ThreatIOC } from '@/types/brand';
import { getSimilarityScore, analyzePrefixSuffixAdditions } from '@/lib/similarity/levenshtein';
import { analyzeHomoglyphs } from '@/lib/similarity/homoglyphs';
import { analyzeScamSignals } from '@/lib/scam-detector/scam-signals';
import { evaluateRiskScore, generateExplainableIndicators, generateThreatTimeline } from '@/lib/risk-engine/risk-calculator';

export interface SocialAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summaryPhrase: string;
  riskBreakdown: any;
  explainableIndicators: any[];
  evidenceList: ThreatEvidence[];
  extractedIocs: ThreatIOC[];
  timeline: any[];
  reasons: string[];
}

export function analyzeSocialProfile(
  profile: SocialProfileEntity,
  brand: BrandProfile
): SocialAnalysisResult {
  const username = (profile.username || '').replace(/^@/, '').trim();
  const displayName = (profile.displayName || '').trim();
  const bio = (profile.bio || '').trim();
  const brandName = (brand.name || 'Brand').trim();

  // 1. Username similarity calculation
  const cleanBrand = brandName.toLowerCase();
  const cleanUser = username.toLowerCase();
  const nameSim = getSimilarityScore(cleanUser, cleanBrand);
  const prefixCheck = analyzePrefixSuffixAdditions(cleanUser, cleanBrand);

  // Check against registered official handles
  let isOfficialHandle = false;
  const officialHandles = Object.values(brand.handles || {})
    .filter(Boolean)
    .map((h) => h!.replace(/^@/, '').toLowerCase());
  
  if (officialHandles.includes(cleanUser)) {
    isOfficialHandle = true;
  }

  // Calculate composite similarity ratio
  let simRatio = Math.max(nameSim.similarityRatio, prefixCheck.isCombosquatting ? 0.9 : 0);
  if (cleanUser.includes(cleanBrand)) {
    simRatio = Math.max(simRatio, 0.85);
  }

  // 2. Homoglyph check on username and display name
  const homoglyphMatch = analyzeHomoglyphs(username + ' ' + displayName);

  // 3. Scam signals in bio / status
  const scamSignals = analyzeScamSignals(bio + ' ' + (profile.profileUrl || ''));

  // 4. Account Age and Verification
  const isNewAccount = (profile.accountAgeDays !== undefined && profile.accountAgeDays < 45);
  const isUnverified = !profile.isVerified;

  // 5. Check if profile contains external links not belonging to brand domain
  let hasSuspiciousUrl = false;
  let isCombosquattingUrl = false;
  if (profile.profileUrl && profile.profileUrl.trim() !== '') {
    const cleanUrl = profile.profileUrl.toLowerCase();
    const cleanDomain = brand.domain.toLowerCase();
    if (!cleanUrl.includes(cleanDomain)) {
      hasSuspiciousUrl = true;
      if (cleanUrl.includes(cleanBrand) || cleanUrl.includes('support') || cleanUrl.includes('help') || cleanUrl.includes('refund')) {
        isCombosquattingUrl = true;
      }
    }
  }

  // 6. Evaluate Risk Score
  const evaluated = evaluateRiskScore({
    usernameSimilarityRatio: isOfficialHandle ? 0 : simRatio,
    logoSimilarityRatio: undefined,
    bioContentSimilarityRatio: bio.toLowerCase().includes(cleanBrand) ? 0.8 : 0.0,
    hasSuspiciousUrl,
    isCombosquattingUrl,
    hasPaymentRequest: scamSignals.hasUpiRequests,
    hasUrgency: scamSignals.hasUrgency,
    hasFakeRefundOrPrize: scamSignals.hasFakeRefunds,
    isNewAccount,
    isUnverified,
    isUnregisteredAsset: !isOfficialHandle,
  });

  // If this is the official handle, override to safe
  if (isOfficialHandle) {
    evaluated.score = 5;
    evaluated.riskLevel = 'LOW';
    evaluated.summaryPhrase = 'Risk Score: 5/100 (Verified Official Brand Asset).';
  }

  // 7. Generate Explainable Indicators
  const explainableIndicators = generateExplainableIndicators(
    {
      usernameSimilarityRatio: isOfficialHandle ? 0 : simRatio,
      logoSimilarityRatio: undefined,
      hasSuspiciousUrl,
      isCombosquattingUrl,
      hasPaymentRequest: scamSignals.hasUpiRequests,
      hasUrgency: scamSignals.hasUrgency,
      hasFakeRefundOrPrize: scamSignals.hasFakeRefunds,
      isNewAccount,
      isUnregisteredAsset: !isOfficialHandle,
    },
    brand,
    `@${username}`
  );

  // 8. Generate Evidence List
  const evidenceList: ThreatEvidence[] = [];
  const reasons: string[] = [];

  if (simRatio > 0.6 && !isOfficialHandle) {
    const desc = `Username "@${username}" has high lexical similarity (${Math.round(simRatio * 100)}%) with brand "${brandName}".`;
    evidenceList.push({
      id: 'ev-user-sim',
      category: 'Identity',
      title: 'High Username Similarity',
      description: desc,
      severity: simRatio > 0.8 ? 'critical' : 'high',
      value: `@${username}`,
    });
    reasons.push(desc);
  }

  if (prefixCheck.isCombosquatting && !isOfficialHandle) {
    const desc = `Deceptive impersonation pattern detected: appended unauthorized suffix/prefix (${prefixCheck.matchedAffixes.join(', ')}).`;
    evidenceList.push({
      id: 'ev-combosquat',
      category: 'Identity',
      title: 'Deceptive Keyword Stacking',
      description: desc,
      severity: 'critical',
      value: prefixCheck.matchedAffixes.join(', '),
    });
    reasons.push(desc);
  }

  if (homoglyphMatch.hasHomoglyphs) {
    const desc = `Confusable homoglyphs or IDN character substitutions detected in profile handle.`;
    evidenceList.push({
      id: 'ev-homoglyph',
      category: 'Encoding',
      title: 'Unicode Homoglyph Substitution',
      description: desc,
      severity: 'high',
    });
    reasons.push(desc);
  }

  if (scamSignals.hasUpiRequests) {
    const desc = `Contains unauthorized payment requests or UPI VPA addresses.`;
    evidenceList.push({
      id: 'ev-upi-scam',
      category: 'Financial Risk',
      title: 'Payment Solicitations & VPA Extortion',
      description: desc,
      severity: 'critical',
    });
    reasons.push(desc);
  }

  if (scamSignals.hasFakeRefunds) {
    const desc = `Offers unverified cashback, prize rewards, or fake customer refunds.`;
    evidenceList.push({
      id: 'ev-fake-refund',
      category: 'Content',
      title: 'Fake Refund / Cashback Lures',
      description: desc,
      severity: 'critical',
    });
    reasons.push(desc);
  }

  if (hasSuspiciousUrl) {
    const desc = `Bio link routes traffic to unauthorized external destination (${profile.profileUrl}).`;
    evidenceList.push({
      id: 'ev-suspicious-url',
      category: 'Infrastructure',
      title: 'Off-Brand Redirection Link',
      description: desc,
      severity: isCombosquattingUrl ? 'critical' : 'high',
      value: profile.profileUrl,
    });
    reasons.push(desc);
  }

  if (isNewAccount) {
    const desc = `Account registered recently (${profile.accountAgeDays || '<30'} days ago) displaying high brand mimicry.`;
    evidenceList.push({
      id: 'ev-account-age',
      category: 'Behavior',
      title: 'Recent Account Creation',
      description: desc,
      severity: 'medium',
    });
    reasons.push(desc);
  }

  // 9. Timeline
  const timeline = generateThreatTimeline(`@${username} (${profile.platform})`, evaluated.score);

  return {
    riskScore: evaluated.score,
    riskLevel: evaluated.riskLevel,
    summaryPhrase: evaluated.summaryPhrase,
    riskBreakdown: evaluated.breakdown,
    explainableIndicators,
    evidenceList,
    extractedIocs: scamSignals.extractedIocs,
    timeline,
    reasons: reasons.length > 0 ? reasons : ['Potential impersonation of brand digital assets.'],
  };
}
