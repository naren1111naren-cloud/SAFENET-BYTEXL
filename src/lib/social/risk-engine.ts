/**
 * SAFENET Social Impersonation Explainable Risk Engine
 * Deterministic, multi-factor risk assessment with technical evidence attribution.
 * NEVER outputs "AI says this is fake" — provides auditable reasons.
 * Classifies threats into 5 distinct tiers (Likely Official, Low Concern, Suspicious, High Risk, Critical Threat).
 */

import {
  BrandIdentityProfile,
  SocialCandidate,
  SocialRiskResult,
  ThreatClassification,
  EvidenceItem,
} from './types';
import { IdentityAnalysisReport } from './identity-analyzer';
import { CandidateUrlsAnalysisReport } from './url-analyzer';
import { LogoAnalysisSignal } from './types';

export interface RiskEngineInput {
  candidate: SocialCandidate;
  brandProfile: BrandIdentityProfile;
  identity: IdentityAnalysisReport;
  urlAnalysis: CandidateUrlsAnalysisReport;
  logoSignal: LogoAnalysisSignal;
}

export function evaluateSocialCandidateRisk(input: RiskEngineInput): SocialRiskResult {
  const { candidate, brandProfile, identity, urlAnalysis, logoSignal } = input;
  const brandName = brandProfile.brandName || 'Brand';
  const rawUsername = (candidate.username || '').replace(/^@/, '');

  // 1. Official Account Whitelist Override
  if (identity.officialAccountMatch) {
    const officialEvidence: EvidenceItem[] = [
      {
        signal: 'official_whitelist_match',
        value: `@${rawUsername}`,
        severity: 'INFO',
        source: 'Brand Identity Fingerprint',
        explanation: `Matches official brand profile handle configured in Brand Identity Profile.`,
      },
    ];

    return {
      riskScore: 3,
      riskLevel: 'LOW',
      threatClassification: 'LIKELY_OFFICIAL',
      confidence: 98,
      identityScore: 3,
      domainRiskScore: 0,
      nameSimilarity: identity.nameSimilarity,
      usernameSimilarity: identity.usernameSimilarity,
      brandingSimilarity: 0,
      logoSimilarity: logoSignal,
      domainAnalysis: urlAnalysis.signals,
      officialAccountMatch: true,
      isCombosquatting: false,
      reasons: [
        `Likely Official: Profile handle matches authenticated ${candidate.platform.toUpperCase()} registry for ${brandName}.`,
      ],
      evidenceList: [
        {
          id: `ev-official-${candidate.id}`,
          category: 'Identity Whitelist',
          label: 'Official Account Verified',
          severity: 'INFO',
          value: `@${rawUsername}`,
          details: `Matches official brand profile handle configured in Brand Identity Profile.`,
        },
      ],
      structuredEvidence: officialEvidence,
    };
  }

  // 2. Identity Risk Calculation (0 to 100)
  // Weighted: Username similarity (45%), Display name (30%), Bio branding triggers (25%)
  let identityScore = Math.round(
    identity.usernameSimilarity * 0.45 +
    identity.nameSimilarity * 0.30 +
    identity.brandingSimilarity * 0.25
  );

  // Combosquatting boost (e.g. _support, -official)
  if (identity.isCombosquatting) {
    identityScore = Math.max(identityScore, 75);
  }

  // 3. Domain Risk (0 to 100)
  let domainRiskScore = 0;
  if (urlAnalysis.hasExternalUrls) {
    domainRiskScore = urlAnalysis.domainRiskScore;
  }

  // 4. Composite Risk Score Synthesis
  // Balance identity mimicry and external domain risk
  let composite = 0;

  if (urlAnalysis.hasExternalUrls) {
    // 60% identity, 40% domain risk
    composite = identityScore * 0.60 + domainRiskScore * 0.40;
  } else {
    // Identity-dominant with slight unverified/support penalty
    composite = identityScore * 0.85;
  }

  // Unverified penalty for high-mimicry profiles
  if (candidate.verificationStatus === 'unverified' && (identity.usernameSimilarity >= 75 || identity.isCombosquatting)) {
    composite += 10;
  }

  // Homoglyph penalty
  if (identity.hasHomoglyphs) {
    composite += 15;
  }

  // Cap composite score to [0, 100]
  const finalScore = Math.min(100, Math.max(0, Math.round(composite)));

  // Risk Level & 5-Tier Threat Classification
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
  } else if (finalScore >= 12) {
    riskLevel = 'LOW';
    threatClassification = 'LOW_CONCERN';
  } else {
    riskLevel = 'LOW';
    threatClassification = 'LIKELY_OFFICIAL';
  }

  // Confidence Calculation based on signal coverage
  let confidenceScore = 65; // baseline for social handle & title
  if (candidate.description && candidate.description.length > 20) confidenceScore += 15;
  if (urlAnalysis.hasExternalUrls) confidenceScore += 15;
  if (candidate.followers !== undefined) confidenceScore += 5;
  if (logoSignal.status === 'evaluated') confidenceScore += 5;
  const confidence = Math.min(96, confidenceScore);

  // Compile Structured Evidence Model (Section 25)
  const structuredEvidence: EvidenceItem[] = [];
  const evidenceList: SocialRiskResult['evidenceList'] = [];
  const reasons: string[] = [];

  // Evidence: Username Similarity
  if (identity.usernameSimilarity >= 60) {
    const sev = identity.usernameSimilarity >= 80 ? 'HIGH' : 'MEDIUM';
    structuredEvidence.push({
      signal: 'username_similarity',
      value: (identity.usernameSimilarity / 100).toFixed(2),
      severity: sev,
      source: `${candidate.platform.toUpperCase()} Discovery`,
      explanation: `Username closely resembles the official brand identity "${brandName}" (${identity.usernameSimilarity}% similarity).`,
    });
    evidenceList.push({
      id: `ev-username-${candidate.id}`,
      category: 'Lexical Identity',
      label: 'Brand Username Mimicry',
      severity: sev,
      value: `@${rawUsername} (${identity.usernameSimilarity}%)`,
      details: `Candidate username exhibits strong lexical resemblance to monitored brand "${brandName}".`,
    });
    reasons.push(`Username "@${rawUsername}" strongly resembles monitored brand name (${identity.usernameSimilarity}% similarity).`);
  }

  // Evidence: Combosquatting
  if (identity.isCombosquatting) {
    structuredEvidence.push({
      signal: 'combosquatting_detected',
      value: identity.detectedAffix || 'support',
      severity: 'HIGH',
      source: 'Lexical Combosquatting Engine',
      explanation: `Appends authority keyword "${identity.detectedAffix || 'support'}" to brand name, a hallmark pattern of support scam accounts.`,
    });
    evidenceList.push({
      id: `ev-combo-${candidate.id}`,
      category: 'Combosquatting',
      label: 'Support / Authority Suffix Added',
      severity: 'HIGH',
      value: identity.detectedAffix || 'support',
      details: `Appends authority keyword "${identity.detectedAffix || 'support'}" to brand name, a hallmark pattern of support scam accounts.`,
    });
    reasons.push(`Combosquatting detected with keyword affix "${identity.detectedAffix || 'support'}".`);
  }

  // Evidence: Bio Intent & Claims
  if (identity.brandingTriggers.length > 0) {
    const sev = identity.brandingTriggers.length >= 2 ? 'HIGH' : 'MEDIUM';
    structuredEvidence.push({
      signal: 'support_intent_extracted',
      value: identity.brandingTriggers.join(', '),
      severity: sev,
      source: 'Bio Intent NLP Analyzer',
      explanation: `Profile claims to provide "${identity.brandingTriggers.join(', ')}" without authorized relationship.`,
    });
    evidenceList.push({
      id: `ev-bio-${candidate.id}`,
      category: 'Bio Intent',
      label: 'Authority & Customer Support Claims',
      severity: sev,
      value: identity.brandingTriggers.join(', '),
      details: `Profile claims to provide "${identity.brandingTriggers.join(', ')}" without authorized relationship.`,
    });
    reasons.push(`Profile description claims authority using keywords: "${identity.brandingTriggers.slice(0, 3).join('", "')}".`);
  }

  // Evidence: External URLs (Reusing SAFENET Domain Intelligence)
  for (const s of urlAnalysis.signals) {
    if (s.isOfficialDomain) {
      structuredEvidence.push({
        signal: 'external_domain_matched',
        value: s.hostname,
        severity: 'LOW',
        source: 'SAFENET Domain Intelligence Engine',
        explanation: `Linked website points to authenticated official brand domain.`,
      });
      evidenceList.push({
        id: `ev-url-off-${Math.random().toString(36).slice(2, 6)}`,
        category: 'External Destination',
        label: 'Official Domain Link',
        severity: 'LOW',
        value: s.hostname,
        details: `Linked website points to authenticated official brand domain.`,
      });
    } else {
      const sev = s.isLookalike || s.isHighRiskTld ? 'CRITICAL' : 'HIGH';
      structuredEvidence.push({
        signal: s.isLookalike ? 'lookalike_destination_detected' : 'unauthorized_external_link',
        value: s.hostname,
        severity: sev,
        source: 'SAFENET Domain Intelligence Engine',
        explanation: `External destination "${s.hostname}" is unauthorized. SAFENET Domain Risk: ${s.similarityScore}/100.`,
      });
      evidenceList.push({
        id: `ev-url-risk-${Math.random().toString(36).slice(2, 6)}`,
        category: 'External Destination',
        label: s.isLookalike ? 'Lookalike Destination Domain' : 'Unauthorized External Domain',
        severity: sev,
        value: s.hostname,
        details: `Linked URL "${s.url}" does not belong to official domain "${brandProfile.officialDomain}". SAFENET Domain Risk: ${s.similarityScore}/100.`,
      });
      reasons.push(`External website "${s.hostname}" is not authorized by ${brandName} and exhibits risk score ${s.similarityScore}/100.`);
    }
  }

  // Evidence: Account Authorization Mismatch
  structuredEvidence.push({
    signal: 'unauthorized_identity_registry',
    value: `@${rawUsername}`,
    severity: 'MEDIUM',
    source: 'Brand Identity Fingerprint',
    explanation: `Account is not present in the registered official social profiles for ${brandName}.`,
  });
  evidenceList.push({
    id: `ev-auth-${candidate.id}`,
    category: 'Authorization',
    label: 'Not in Official Asset Inventory',
    severity: 'MEDIUM',
    value: `@${rawUsername}`,
    details: `Account is not present in the registered official social profiles for ${brandName}.`,
  });
  reasons.push(`Account is not listed as an official ${brandName} profile.`);

  // Evidence: Synthetic Demo Data Flag
  if (candidate.isDemoData) {
    structuredEvidence.push({
      signal: 'synthetic_demo_telemetry',
      value: 'Local Sandbox Benchmark',
      severity: 'INFO',
      source: 'SAFENET Synthetic Benchmark Generator',
      explanation: 'Generated locally for UI demonstration and heuristic benchmarking. Not live internet data.',
    });
    evidenceList.push({
      id: `ev-demo-${candidate.id}`,
      category: 'Telemetry Source',
      label: 'DEMO DATA (Synthetic Benchmark)',
      severity: 'INFO',
      value: 'Local Sandbox Profile',
      details: 'This candidate is generated locally by SAFENET for simulation and UI validation. Not from live internet crawls.',
    });
  }

  return {
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
    isCombosquatting: identity.isCombosquatting,
    reasons,
    evidenceList,
    structuredEvidence,
  };
}
