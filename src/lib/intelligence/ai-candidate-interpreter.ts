/**
 * SAFENET AI Candidate Evidence Interpreter
 * Strictly bounds Gemini to explaining observed candidate evidence without inventing facts.
 * Falls back cleanly to deterministic explainability when Gemini is unconfigured.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DiscoveredCandidate } from '../providers/types';
import { CandidateRiskAssessment } from '../risk-engine/candidate-risk-engine';
import { BrandProfile } from '@/types/brand';

export interface CandidateAiExplanation {
  isLLMPowered: boolean;
  status: 'active' | 'fallback' | 'unavailable';
  assessment: string;
  impersonationTactics: string[];
  recommendedAction: string;
  defensiveSteps: string[];
}

export async function explainCandidateWithAi(
  candidate: DiscoveredCandidate,
  assessment: CandidateRiskAssessment,
  brand: BrandProfile
): Promise<CandidateAiExplanation> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini is unavailable, use deterministic rule-based explainability
  if (!apiKey || apiKey.length < 20) {
    return generateDeterministicCandidateExplanation(candidate, assessment, brand);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `You are SAFENET, an expert Cyber Threat Intelligence Analyst.
Explain the following digital entity discovered during brand protection monitoring.

CRITICAL INSTRUCTIONS:
- You must ONLY reason over the provided candidate details and evidence.
- NEVER invent URLs, account usernames, apps, or IOCs not present in the evidence.
- Do NOT alter the deterministic risk score (${assessment.riskScore}/100, ${assessment.riskLevel}).
- Return valid JSON matching the schema.

BRAND BASELINE:
- Brand Name: "${brand.name}"
- Official Domain: "${brand.domain}"
- Official Handles: ${JSON.stringify(brand.handles || {})}

DISCOVERED ENTITY:
- Title: "${candidate.title}"
- Source: "${candidate.source}" (${candidate.sourceType})
- URL: "${candidate.url}"
- Username: "${candidate.username || 'N/A'}"
- Developer: "${candidate.developer || 'N/A'}"
- Description: "${(candidate.description || '').slice(0, 300)}"
- Deterministic Risk Score: ${assessment.riskScore}/100 (${assessment.riskLevel})
- Observed Evidence:
${assessment.evidence.map((e) => `  * [${e.category}] ${e.title}: ${e.description}`).join('\n')}

SCHEMA:
{
  "assessment": "2-3 concise sentences synthesizing why this entity presents risk to the brand",
  "impersonationTactics": ["short bullet describing observed impersonation signals"],
  "recommendedAction": "Immediate mitigation action (e.g. Initiate App Store takedown, Monitor profile)",
  "defensiveSteps": ["Actionable step 1", "Actionable step 2"]
}`;

    const res = await model.generateContent(prompt);
    const parsed = JSON.parse(res.response.text());

    return {
      isLLMPowered: true,
      status: 'active',
      assessment: parsed.assessment || assessment.summaryPhrase,
      impersonationTactics: Array.isArray(parsed.impersonationTactics) ? parsed.impersonationTactics : assessment.reasons,
      recommendedAction: parsed.recommendedAction || (assessment.riskScore >= 60 ? 'IMMEDIATE_TAKEDOWN' : 'CONTINUE_MONITORING'),
      defensiveSteps: Array.isArray(parsed.defensiveSteps) ? parsed.defensiveSteps : [
        'Document candidate profile URL and timestamp evidence.',
        'Issue notice of infringement to hosting provider or app store.',
      ],
    };
  } catch (err) {
    console.warn('[SAFENET] Gemini candidate explanation error, using deterministic fallback:', err);
    return generateDeterministicCandidateExplanation(candidate, assessment, brand);
  }
}

function generateDeterministicCandidateExplanation(
  candidate: DiscoveredCandidate,
  assessment: CandidateRiskAssessment,
  brand: BrandProfile
): CandidateAiExplanation {
  const isHighRisk = assessment.riskScore >= 60;
  const tactics = [...assessment.reasons];

  let recommendedAction = 'ROUTINE_MONITORING';
  const steps: string[] = [];

  if (assessment.isOfficialAsset) {
    recommendedAction = 'AUTHENTICATED_OFFICIAL_ASSET';
    steps.push('Asset verified against organizational registry. No defensive mitigation required.');
  } else if (isHighRisk) {
    recommendedAction = candidate.sourceType === 'app' ? 'INITIATE_STORE_TAKEDOWN' : 'SUBMIT_PLATFORM_ABUSE_REPORT';
    steps.push(`Export cryptographic evidence package containing URL: ${candidate.url}.`);
    steps.push(`Submit formal takedown request citing brand infringement of "${brand.name}".`);
    steps.push('Add entity to real-time watchlist for infrastructure pivoting.');
  } else {
    recommendedAction = 'FLAG_FOR_ANALYST_TRIAGE';
    steps.push('Entity exhibits peripheral similarity without conclusive abusive intent.');
    steps.push('Retain on perimeter watchlist for behavioral updates.');
  }

  return {
    isLLMPowered: false,
    status: 'fallback',
    assessment: assessment.summaryPhrase,
    impersonationTactics: tactics,
    recommendedAction,
    defensiveSteps: steps,
  };
}
