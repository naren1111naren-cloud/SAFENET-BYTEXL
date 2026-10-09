import {
  RiskScoreBreakdown,
  RiskLevel,
  ExplainableIndicator,
  ThreatTimelineEvent,
  BrandProfile,
} from '@/types/brand';

/**
 * Configurable Risk Engine Weights (Total = 100)
 */
export const RISK_WEIGHTS = {
  USERNAME_SIMILARITY: 20,    // 0 - 20 pts
  LOGO_SIMILARITY: 20,        // 0 - 20 pts
  BIO_CONTENT_SIMILARITY: 15, // 0 - 15 pts
  SUSPICIOUS_URL: 20,         // 0 - 20 pts
  PAYMENT_SCAM_INDICATORS: 15,// 0 - 15 pts
  ACCOUNT_APP_BEHAVIOR: 10,   // 0 - 10 pts
};

export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export interface RiskCalculationInput {
  usernameSimilarityRatio?: number; // 0 - 1.0
  logoSimilarityRatio?: number;     // 0 - 1.0
  bioContentSimilarityRatio?: number; // 0 - 1.0
  hasSuspiciousUrl?: boolean;
  isCombosquattingUrl?: boolean;
  hasPaymentRequest?: boolean;
  hasUrgency?: boolean;
  hasFakeRefundOrPrize?: boolean;
  isNewAccount?: boolean;           // < 30 days
  isUnverified?: boolean;
  hasSuspiciousPermissions?: boolean;
  isMismatchedDeveloper?: boolean;
  isUnregisteredAsset?: boolean;
  customDetections?: string[];
}

export function evaluateRiskScore(input: RiskCalculationInput): {
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
  breakdown: RiskScoreBreakdown;
  summaryPhrase: string;
} {
  let usernameSimilarity = 0;
  if (input.usernameSimilarityRatio !== undefined) {
    if (input.usernameSimilarityRatio >= 0.85) {
      usernameSimilarity = RISK_WEIGHTS.USERNAME_SIMILARITY;
    } else if (input.usernameSimilarityRatio >= 0.6) {
      usernameSimilarity = Math.round(RISK_WEIGHTS.USERNAME_SIMILARITY * 0.75);
    } else if (input.usernameSimilarityRatio >= 0.4) {
      usernameSimilarity = Math.round(RISK_WEIGHTS.USERNAME_SIMILARITY * 0.4);
    }
  }

  let logoSimilarity = 0;
  if (input.logoSimilarityRatio !== undefined) {
    if (input.logoSimilarityRatio >= 0.8) {
      logoSimilarity = RISK_WEIGHTS.LOGO_SIMILARITY;
    } else if (input.logoSimilarityRatio >= 0.5) {
      logoSimilarity = Math.round(RISK_WEIGHTS.LOGO_SIMILARITY * 0.7);
    } else if (input.logoSimilarityRatio >= 0.3) {
      logoSimilarity = Math.round(RISK_WEIGHTS.LOGO_SIMILARITY * 0.35);
    }
  }

  let bioContentSimilarity = 0;
  if (input.bioContentSimilarityRatio !== undefined) {
    if (input.bioContentSimilarityRatio >= 0.7) {
      bioContentSimilarity = RISK_WEIGHTS.BIO_CONTENT_SIMILARITY;
    } else if (input.bioContentSimilarityRatio >= 0.4) {
      bioContentSimilarity = Math.round(RISK_WEIGHTS.BIO_CONTENT_SIMILARITY * 0.6);
    }
  }

  let suspiciousUrl = 0;
  if (input.hasSuspiciousUrl) {
    suspiciousUrl = input.isCombosquattingUrl ? RISK_WEIGHTS.SUSPICIOUS_URL : Math.round(RISK_WEIGHTS.SUSPICIOUS_URL * 0.8);
  }

  let paymentScamIndicators = 0;
  if (input.hasPaymentRequest || input.hasFakeRefundOrPrize) {
    paymentScamIndicators = RISK_WEIGHTS.PAYMENT_SCAM_INDICATORS;
  } else if (input.hasUrgency) {
    paymentScamIndicators = Math.round(RISK_WEIGHTS.PAYMENT_SCAM_INDICATORS * 0.6);
  }

  let accountAppBehavior = 0;
  if (input.hasSuspiciousPermissions || input.isMismatchedDeveloper) {
    accountAppBehavior += 6;
  }
  if (input.isNewAccount) {
    accountAppBehavior += 4;
  }
  accountAppBehavior = Math.min(accountAppBehavior, RISK_WEIGHTS.ACCOUNT_APP_BEHAVIOR);

  // Calculate composite total
  const totalScore = Math.min(
    100,
    usernameSimilarity +
    logoSimilarity +
    bioContentSimilarity +
    suspiciousUrl +
    paymentScamIndicators +
    accountAppBehavior
  );

  // Calculate confidence based on available signal strength
  let confidence = 75;
  if (input.isUnregisteredAsset === false) {
    confidence = 96; // Definite official asset match
  } else if (input.isCombosquattingUrl || input.hasPaymentRequest || input.hasSuspiciousPermissions) {
    confidence = Math.min(95, 80 + Math.round(totalScore * 0.15));
  } else if (input.usernameSimilarityRatio !== undefined && input.usernameSimilarityRatio > 0.8) {
    confidence = 88;
  } else if (totalScore < 15) {
    confidence = 85; // Clean benign determination
  } else {
    confidence = 72;
  }

  const riskLevel = calculateRiskLevel(totalScore);
  const summaryPhrase = `Risk Score: ${totalScore}/100 based on multiple detected indicators.`;

  return {
    score: totalScore,
    riskLevel,
    confidence,
    breakdown: {
      usernameSimilarity,
      logoSimilarity,
      bioContentSimilarity,
      suspiciousUrl,
      paymentScamIndicators,
      accountAppBehavior,
      totalScore,
    },
    summaryPhrase,
  };
}

/**
 * Builds the Explainable "WHY WAS THIS FLAGGED?" indicator cards
 */
export function generateExplainableIndicators(
  input: RiskCalculationInput,
  brand: BrandProfile,
  targetName: string
): ExplainableIndicator[] {
  const indicators: ExplainableIndicator[] = [];

  // 1. Identity
  if ((input.usernameSimilarityRatio && input.usernameSimilarityRatio > 0.5) || input.usernameSimilarityRatio === 1) {
    indicators.push({
      category: 'identity',
      label: 'Identity Resemblance',
      severity: input.usernameSimilarityRatio > 0.8 ? 'CRITICAL' : 'HIGH',
      status: 'flagged',
      description: `Username / identifier strongly resembles official brand name "${brand.name}".`,
    });
  } else {
    indicators.push({
      category: 'identity',
      label: 'Identity Resemblance',
      severity: 'INFO',
      status: 'clean',
      description: 'Identifier does not show aggressive lexical squatting.',
    });
  }

  // 2. Branding
  if (input.logoSimilarityRatio && input.logoSimilarityRatio > 0.4) {
    indicators.push({
      category: 'branding',
      label: 'Brand Asset Impersonation',
      severity: input.logoSimilarityRatio > 0.7 ? 'CRITICAL' : 'HIGH',
      status: 'flagged',
      description: `Profile visual / app icon closely matches registered official ${brand.name} logo trademark.`,
    });
  } else {
    indicators.push({
      category: 'branding',
      label: 'Brand Asset Impersonation',
      severity: 'INFO',
      status: 'clean',
      description: 'No direct visual trademark match detected.',
    });
  }

  // 3. Content
  if (input.hasPaymentRequest || input.hasFakeRefundOrPrize) {
    indicators.push({
      category: 'content',
      label: 'Scam & Financial Lures',
      severity: 'CRITICAL',
      status: 'flagged',
      description: 'Contains illicit upfront payment solicitations, reverse UPI PIN triggers, or fake prize rewards.',
    });
  } else if (input.hasUrgency) {
    indicators.push({
      category: 'content',
      label: 'Urgency / Coercion Language',
      severity: 'HIGH',
      status: 'suspicious',
      description: 'Uses artificial urgency and account suspension threats to pressure victims.',
    });
  } else {
    indicators.push({
      category: 'content',
      label: 'Scam & Financial Lures',
      severity: 'INFO',
      status: 'clean',
      description: 'No obvious financial extortion triggers found in content body.',
    });
  }

  // 4. Link
  if (input.hasSuspiciousUrl) {
    indicators.push({
      category: 'link',
      label: 'Unauthorized External Link',
      severity: input.isCombosquattingUrl ? 'CRITICAL' : 'HIGH',
      status: 'flagged',
      description: `External domain does not match official brand domain (${brand.domain}) and uses deceptive keywords.`,
    });
  } else {
    indicators.push({
      category: 'link',
      label: 'External Link Check',
      severity: 'INFO',
      status: 'clean',
      description: `Links resolve directly to authorized ${brand.domain} infrastructure.`,
    });
  }

  // 5. Account / App Behavior
  if (input.hasSuspiciousPermissions) {
    indicators.push({
      category: 'account',
      label: 'Excessive App Permissions',
      severity: 'CRITICAL',
      status: 'flagged',
      description: 'Requests sensitive permissions (SMS interception, Accessibility services, Screen overlay).',
    });
  } else if (input.isNewAccount || input.isMismatchedDeveloper) {
    indicators.push({
      category: 'account',
      label: 'Entity Verification & Age',
      severity: 'MEDIUM',
      status: 'suspicious',
      description: input.isMismatchedDeveloper
        ? 'App developer identity does not match verified organization credentials.'
        : 'Newly created unverified account with high activity bursts.',
    });
  } else {
    indicators.push({
      category: 'account',
      label: 'Entity Verification & Age',
      severity: 'INFO',
      status: 'clean',
      description: 'Account age and operational profile appear consistent.',
    });
  }

  // 6. Authorization
  if (input.isUnregisteredAsset === false) {
    indicators.push({
      category: 'authorization',
      label: 'Brand Authorization',
      severity: 'INFO',
      status: 'clean',
      description: `Entity "${targetName}" is verified in the official ${brand.name} asset registry.`,
    });
  } else if (input.isUnregisteredAsset === true && (input.usernameSimilarityRatio || 0) >= 0.5) {
    indicators.push({
      category: 'authorization',
      label: 'Brand Authorization',
      severity: 'CRITICAL',
      status: 'unauthorized',
      description: `Entity "${targetName}" mimics ${brand.name} brand identity but is not registered in the official asset registry.`,
    });
  } else {
    indicators.push({
      category: 'authorization',
      label: 'Brand Authorization',
      severity: 'INFO',
      status: 'clean',
      description: `Entity is not registered to ${brand.name} and does not claim official affiliation.`,
    });
  }

  return indicators;
}

/**
 * Generates initial forensic investigation timeline events
 */
export function generateThreatTimeline(
  targetAsset: string,
  riskScore: number,
  firstSeenMinutesAgo: number = 15
): ThreatTimelineEvent[] {
  const now = new Date();
  const formatTime = (minusMinutes: number) => {
    const d = new Date(now.getTime() - minusMinutes * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return [
    {
      id: `evt-${Date.now()}-1`,
      timestamp: formatTime(firstSeenMinutesAgo),
      title: 'Threat Discovered',
      description: `Target asset "${targetAsset}" captured by monitoring telemetry crawler.`,
      actor: 'SYSTEM',
      type: 'discovery',
    },
    {
      id: `evt-${Date.now()}-2`,
      timestamp: formatTime(firstSeenMinutesAgo - 1),
      title: 'AI Forensic Analysis Started',
      description: 'Submitted to SAFENET Multi-Modal Neural and Heuristic Signal Analyzers.',
      actor: 'AI_ENGINE',
      type: 'analysis',
    },
    {
      id: `evt-${Date.now()}-3`,
      timestamp: formatTime(firstSeenMinutesAgo - 2),
      title: 'Identity & Brand Match Detected',
      description: 'Lexical similarity engine identified high-confidence trademark overlap.',
      actor: 'AI_ENGINE',
      type: 'analysis',
    },
    {
      id: `evt-${Date.now()}-4`,
      timestamp: formatTime(firstSeenMinutesAgo - 3),
      title: 'Risk Score Calculated',
      description: `Composite Risk Score established at ${riskScore}/100 (${calculateRiskLevel(riskScore)} Risk).`,
      actor: 'AI_ENGINE',
      type: 'scoring',
    },
    {
      id: `evt-${Date.now()}-5`,
      timestamp: formatTime(firstSeenMinutesAgo - 4),
      title: 'Security Alert Generated',
      description: 'High-priority incident alert dispatched to SOC Analyst monitoring queue.',
      actor: 'SYSTEM',
      type: 'alert',
    },
  ];
}
