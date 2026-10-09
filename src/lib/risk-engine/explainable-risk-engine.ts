/**
 * SAFENET Internet Intelligence Platform - Explainable Risk Engine
 * Computes deterministic, deduplicated, evidence-supported risk scores (0-100)
 * with explicit itemized signal contributions, confidence metrics, and severity bands.
 */

import { NormalizedEvidenceItem } from '../intelligence/evidence-builder';

export type RiskSeverityBand = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface SignalContribution {
  id: string;
  vector: string;
  points: number;
  reason: string;
  supportingEvidenceIds: string[];
}

export interface RiskEvaluationResult {
  score: number;
  severity: RiskSeverityBand;
  isInconclusive: boolean;
  confidence: number;
  summaryPhrase: string;
  contributions: SignalContribution[];
  primaryReasons: string[];
}

export interface RiskEvaluationInput {
  isOfficialBrandDomain: boolean;
  isMimickingBrand: boolean;
  brandName: string;
  combosquattingMatched?: boolean;
  matchedAffixes?: string[];
  homoglyphsDetected?: boolean;
  brandSimilarityRatio?: number;
  isHighRiskTld?: boolean;
  tld?: string;
  domainAgeDays?: number;
  dnsResolved: boolean;
  tlsStatus?: 'valid' | 'invalid_cert' | 'expired' | 'hostname_mismatch' | 'no_tls' | 'timeout' | 'error';
  hasCrossDomainFormSubmission?: boolean;
  hasPasswordInputOnUnverifiedHost?: boolean;
  hasOtpInput?: boolean;
  hasPaymentFields?: boolean;
  suspiciousKeywordsCount?: number;
  threatFeedDetectionsCount?: number;
  threatFeedDetails?: string[];
  evidenceItems: NormalizedEvidenceItem[];
}

export function mapScoreToSeverity(score: number): RiskSeverityBand {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'ELEVATED';
  if (score >= 20) return 'GUARDED';
  return 'LOW';
}

/**
 * Evaluates holistic risk score and explains every point contributed.
 */
export function evaluateExplainableRisk(input: RiskEvaluationInput): RiskEvaluationResult {
  // 1. Definite Official Asset Check
  if (input.isOfficialBrandDomain) {
    return {
      score: 0,
      severity: 'LOW',
      isInconclusive: false,
      confidence: 98,
      summaryPhrase: `Verified official domain authenticated for ${input.brandName}.`,
      contributions: [
        {
          id: 'sig-official',
          vector: 'Brand Identity Allowlist',
          points: 0,
          reason: `Target matches authenticated domain inventory for ${input.brandName}.`,
          supportingEvidenceIds: ['ev-official'],
        },
      ],
      primaryReasons: [`Verified official domain belonging to ${input.brandName}.`],
    };
  }

  const contributions: SignalContribution[] = [];
  const primaryReasons: string[] = [];

  // 2. Confirmed External Threat Intelligence Feed Detections
  if (input.threatFeedDetectionsCount && input.threatFeedDetectionsCount > 0) {
    const pts = 85;
    contributions.push({
      id: 'sig-threat-feed',
      vector: 'Threat Intelligence Feeds',
      points: pts,
      reason: `Flagged as malicious by authoritative security vendors (${input.threatFeedDetails?.join(', ') || 'Known threat'}).`,
      supportingEvidenceIds: ['ev-threat-feeds'],
    });
    primaryReasons.push(`Flagged as active malicious threat by external security feeds.`);
  }

  // 3. Brand Impersonation & Lexical Similarity Vectors
  if (input.homoglyphsDetected) {
    contributions.push({
      id: 'sig-homoglyph',
      vector: 'Unicode Deception',
      points: 40,
      reason: 'Contains non-ASCII Unicode homoglyphs or script-mixing designed to deceive human inspection.',
      supportingEvidenceIds: ['ev-homoglyph'],
    });
    primaryReasons.push('Detected deceptive Unicode homoglyph obfuscation.');
  }

  if (input.combosquattingMatched) {
    const affixes = input.matchedAffixes?.join(', ') || 'unauthorized keywords';
    contributions.push({
      id: 'sig-combosquatting',
      vector: 'Brand Combosquatting',
      points: 35,
      reason: `Unauthorized brand combosquatting: contains brand identity paired with suspicious affixes (${affixes}).`,
      supportingEvidenceIds: ['ev-combosquat'],
    });
    primaryReasons.push(`Combosquatting pattern detected targeting ${input.brandName} (${affixes}).`);
  } else if (input.brandSimilarityRatio && input.brandSimilarityRatio >= 0.75 && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-brand-similarity',
      vector: 'Lexical Brand Proximity',
      points: 25,
      reason: `High lexical similarity (${Math.round(input.brandSimilarityRatio * 100)}%) to protected brand "${input.brandName}".`,
      supportingEvidenceIds: ['ev-brand-sim'],
    });
    primaryReasons.push(`High lexical resemblance to protected brand ${input.brandName}.`);
  }

  // 4. Infrastructure & Domain Characteristics
  if (input.isHighRiskTld && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-high-risk-tld',
      vector: 'Disposable Registry',
      points: 20,
      reason: `Disposable / high-risk TLD (.${input.tld || 'xyz'}) paired with brand-targeting keywords.`,
      supportingEvidenceIds: ['ev-tld'],
    });
    primaryReasons.push(`High-risk disposable TLD (.${input.tld || 'xyz'}) paired with brand keywords.`);
  }

  // Domain recency (newly registered < 30 days)
  if (input.domainAgeDays !== undefined && input.domainAgeDays < 30 && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-domain-age',
      vector: 'Registration Recency',
      points: 20,
      reason: `Newly registered domain (${input.domainAgeDays} days old) mimicking protected brand.`,
      supportingEvidenceIds: ['ev-rdap-age'],
    });
    primaryReasons.push(`Newly registered domain (${input.domainAgeDays} days old) targeting ${input.brandName}.`);
  }

  // DNS unresolvability when mimicking
  if (!input.dnsResolved && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-dns-unresolved',
      vector: 'Infrastructure Persistence',
      points: 15,
      reason: 'Domain mimics protected brand but lacks stable DNS A/AAAA resolution (transient staging).',
      supportingEvidenceIds: ['ev-dns-a'],
    });
    primaryReasons.push('Target exhibits brand mimicry on transient, unresolving infrastructure.');
  }

  // 5. Cryptography & TLS Signals
  if (input.tlsStatus === 'expired') {
    contributions.push({
      id: 'sig-tls-expired',
      vector: 'Certificate Validity',
      points: 15,
      reason: 'TLS certificate is expired, indicating compromised or abandoned infrastructure.',
      supportingEvidenceIds: ['ev-tls'],
    });
    primaryReasons.push('TLS certificate is expired.');
  } else if (input.tlsStatus === 'hostname_mismatch') {
    contributions.push({
      id: 'sig-tls-mismatch',
      vector: 'Certificate Hostname Mismatch',
      points: 20,
      reason: 'TLS certificate Subject Alternative Names do not match the target hostname.',
      supportingEvidenceIds: ['ev-tls'],
    });
    primaryReasons.push('TLS certificate Subject Alternative Names do not match destination host.');
  } else if (input.tlsStatus === 'invalid_cert') {
    contributions.push({
      id: 'sig-tls-untrusted',
      vector: 'Untrusted Certificate',
      points: 20,
      reason: 'TLS certificate could not be verified by trusted root certificate authorities.',
      supportingEvidenceIds: ['ev-tls'],
    });
    primaryReasons.push('TLS certificate is untrusted or self-signed.');
  }

  // 6. Content & Behavioral Signals
  if (input.hasCrossDomainFormSubmission) {
    contributions.push({
      id: 'sig-cross-domain',
      vector: 'Credential Exfiltration',
      points: 30,
      reason: 'Webpage contains form submissions routing credentials across third-party foreign domains.',
      supportingEvidenceIds: ['ev-html-form'],
    });
    primaryReasons.push('Cross-domain form submission detected (credential exfiltration vector).');
  }

  if (input.hasPasswordInputOnUnverifiedHost && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-credential-harvesting',
      vector: 'Credential Harvesting Form',
      points: 35,
      reason: `Password authentication form present on unverified domain resembling ${input.brandName}.`,
      supportingEvidenceIds: ['ev-html-password'],
    });
    primaryReasons.push(`Password input detected on unverified domain mimicking ${input.brandName}.`);
  }

  if (input.hasOtpInput && input.isMimickingBrand) {
    contributions.push({
      id: 'sig-otp-harvesting',
      vector: '2FA / OTP Interception',
      points: 25,
      reason: 'OTP / two-factor authentication token solicitation detected on unverified destination.',
      supportingEvidenceIds: ['ev-html-otp'],
    });
    primaryReasons.push('Authentication OTP solicitation detected on unverified destination.');
  }

  if (input.suspiciousKeywordsCount && input.suspiciousKeywordsCount > 0) {
    const pts = Math.min(25, input.suspiciousKeywordsCount * 10);
    contributions.push({
      id: 'sig-urgency-lures',
      vector: 'Coercive Social Engineering',
      points: pts,
      reason: 'Contains urgency, account suspension, or KYC re-verification coercion language.',
      supportingEvidenceIds: ['ev-html-keywords'],
    });
    primaryReasons.push('Deceptive urgency and account suspension pressure language detected.');
  }

  // Unrelated third-party domain (no mimicking, clean)
  if (!input.isMimickingBrand && contributions.length === 0) {
    primaryReasons.push(`No significant brand impersonation signals detected against ${input.brandName}.`);
  }

  // Compute composite score with upper cap 100
  const rawSum = contributions.reduce((acc, c) => acc + c.points, 0);
  const score = Math.min(100, rawSum);
  const severity = mapScoreToSeverity(score);

  // Determine whether analysis is inconclusive (e.g. no DNS, no HTTP, no brand mimicry)
  const isTargetReachable = input.dnsResolved;
  const isInconclusive = !isTargetReachable && !input.isMimickingBrand && score === 0;

  // Calculate evidence coverage confidence (0 - 100%)
  let confidence = 70;
  if (input.threatFeedDetectionsCount && input.threatFeedDetectionsCount > 0) {
    confidence = 96;
  } else if (input.combosquattingMatched && input.isHighRiskTld) {
    confidence = 94;
  } else if (!input.isMimickingBrand && input.dnsResolved) {
    confidence = 90;
  } else if (input.isMimickingBrand) {
    confidence = 85;
  } else if (isInconclusive) {
    confidence = 45;
  }

  let summaryPhrase = '';
  if (isInconclusive) {
    summaryPhrase = 'Inconclusive: Domain does not resolve and exhibits no deceptive brand association.';
  } else if (score >= 70) {
    summaryPhrase = `High risk: Multiple corroborating threat indicators detected targeting ${input.brandName}.`;
  } else if (score >= 40) {
    summaryPhrase = `Elevated risk: Suspicious indicators require careful verification before authentication.`;
  } else if (score >= 20) {
    summaryPhrase = `Guarded: Low-to-moderate indicators observed. Exercise standard digital hygiene.`;
  } else {
    summaryPhrase = `Low observed risk: No deceptive or malicious indicators detected.`;
  }

  return {
    score,
    severity,
    isInconclusive,
    confidence,
    summaryPhrase,
    contributions,
    primaryReasons,
  };
}
