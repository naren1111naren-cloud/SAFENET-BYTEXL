import { BrandProfile, ThreatEvidence, ThreatIOC } from '@/types/brand';
import { analyzeScamSignals } from '@/lib/scam-detector/scam-signals';
import { evaluateRiskScore, generateExplainableIndicators, generateThreatTimeline } from '@/lib/risk-engine/risk-calculator';

export interface ContentAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summaryPhrase: string;
  riskBreakdown: any;
  explainableIndicators: any[];
  evidenceList: ThreatEvidence[];
  extractedIocs: ThreatIOC[];
  timeline: any[];
  reasons: string[];
  detectedPatterns: Array<{
    category: string;
    label: string;
    severity: 'critical' | 'high' | 'medium';
    matchedSnippet: string;
    explanation: string;
  }>;
}

export function analyzeScamContent(
  text: string,
  brand: BrandProfile,
  platformContext: string = 'social_post'
): ContentAnalysisResult {
  const brandName = (brand.name || 'Brand').trim();
  const rawText = (text || '').trim();
  const lowerText = rawText.toLowerCase();

  // 1. Analyze with deterministic regex & heuristic patterns
  const signals = analyzeScamSignals(rawText);

  // 2. Additional context checks
  const mentionsBrand = lowerText.includes(brandName.toLowerCase());
  const hasProcessingFee = /(?:processing\s*fee|registration\s*fee|deposit\s*(?:of|amount)|pay\s*(?:rs|₹|\$)\s*\d+)/i.test(rawText);
  const hasPrizeClaim = /(?:won\s*(?:a|the)?\s*(?:reward|prize|lottery|cashback)|congratulations|selected\s*for\s*exclusive)/i.test(rawText);
  const hasCredentialHarvester = /(?:enter\s*otp|share\s*otp|bank\s*details|cvv|password|debit\s*card)/i.test(rawText);
  const hasUrgencyCoercion = /(?:within\s*(?:24|12|48|2)\s*hours|immediate|last\s*warning|blocked|suspended)/i.test(rawText);
  const hasOffBrandLink = /(?:https?:\/\/|www\.)[^\s]+/i.test(rawText) && !lowerText.includes(brand.domain.toLowerCase());

  // 3. Formulate detected patterns
  const detectedPatterns: ContentAnalysisResult['detectedPatterns'] = [];

  if (signals.hasUpiRequests || hasProcessingFee) {
    detectedPatterns.push({
      category: 'PAYMENT_REQUEST',
      label: 'Advance Payment / VPA Fee Request',
      severity: 'critical',
      matchedSnippet: rawText.slice(0, 80),
      explanation: 'Demands upfront payment or fee to release funds/rewards, a hallmark of 419 & advance-fee fraud.',
    });
  }

  if (signals.hasFakeRefunds || hasPrizeClaim) {
    detectedPatterns.push({
      category: 'PRIZE_CLAIM',
      label: 'Fraudulent Prize / Refund Claim',
      severity: 'high',
      matchedSnippet: rawText.slice(0, 80),
      explanation: 'Lures users with counterfeit winnings, unearned prizes, or fake cashback claims.',
    });
  }

  if (signals.hasUrgency || hasUrgencyCoercion) {
    detectedPatterns.push({
      category: 'URGENCY',
      label: 'Artificial Urgency & Coercion',
      severity: 'medium',
      matchedSnippet: rawText.slice(0, 80),
      explanation: 'Manufactures psychological pressure through imminent account suspension or deadline threats.',
    });
  }

  if (hasCredentialHarvester || signals.hasOtpHarvesting) {
    detectedPatterns.push({
      category: 'CREDENTIAL_HARVESTING',
      label: 'OTP / Credential Harvesting',
      severity: 'critical',
      matchedSnippet: rawText.slice(0, 80),
      explanation: 'Directly attempts to harvest sensitive OTPs, banking credentials, or remote access installations.',
    });
  }

  if (signals.hasDmSupport) {
    detectedPatterns.push({
      category: 'UNOFFICIAL_SUPPORT',
      label: 'Redirection to Private Messaging',
      severity: 'high',
      matchedSnippet: rawText.slice(0, 80),
      explanation: 'Channels support requests into unmonitored WhatsApp, Telegram, or private DMs.',
    });
  }

  // 4. Evaluate composite risk score
  const evaluated = evaluateRiskScore({
    usernameSimilarityRatio: mentionsBrand ? 0.8 : 0.1,
    bioContentSimilarityRatio: mentionsBrand ? 0.7 : 0.1,
    hasSuspiciousUrl: hasOffBrandLink,
    isCombosquattingUrl: hasOffBrandLink && mentionsBrand,
    hasPaymentRequest: signals.hasUpiRequests || hasProcessingFee,
    hasUrgency: signals.hasUrgency || hasUrgencyCoercion,
    hasFakeRefundOrPrize: signals.hasFakeRefunds || hasPrizeClaim,
  });

  // 5. Indicators
  const explainableIndicators = generateExplainableIndicators(
    {
      usernameSimilarityRatio: mentionsBrand ? 0.8 : 0.1,
      hasSuspiciousUrl: hasOffBrandLink,
      hasPaymentRequest: signals.hasUpiRequests || hasProcessingFee,
      hasUrgency: signals.hasUrgency || hasUrgencyCoercion,
      hasFakeRefundOrPrize: signals.hasFakeRefunds || hasPrizeClaim,
    },
    brand,
    platformContext
  );

  // 6. Evidence
  const evidenceList: ThreatEvidence[] = [];
  const reasons: string[] = [];

  detectedPatterns.forEach((p, idx) => {
    evidenceList.push({
      id: `ev-content-${idx}`,
      category: p.category,
      title: p.label,
      description: p.explanation,
      severity: p.severity,
      value: p.matchedSnippet,
    });
    reasons.push(`${p.label}: ${p.explanation}`);
  });

  if (hasOffBrandLink) {
    evidenceList.push({
      id: 'ev-off-brand-link',
      category: 'Link',
      title: 'Suspicious External Destination',
      description: `Contains external web link not hosted under official ${brand.domain} infrastructure.`,
      severity: 'high',
    });
    reasons.push('Contains suspicious external redirection link.');
  }

  const timeline = generateThreatTimeline(`Scam Content (${platformContext})`, evaluated.score);

  return {
    riskScore: evaluated.score,
    riskLevel: evaluated.riskLevel,
    summaryPhrase: evaluated.summaryPhrase,
    riskBreakdown: evaluated.breakdown,
    explainableIndicators,
    evidenceList,
    extractedIocs: signals.extractedIocs,
    timeline,
    reasons: reasons.length > 0 ? reasons : ['Content exhibits suspicious impersonation or deceptive language.'],
    detectedPatterns,
  };
}
