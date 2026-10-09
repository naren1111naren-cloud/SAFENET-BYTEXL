import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

export const LLMScamAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  scamSignalsDetected: z.object({
    upiPaymentRequest: z.boolean(),
    urgencyOrCoercion: z.boolean(),
    fakeRefundOrCashback: z.boolean(),
    dmForSupport: z.boolean(),
    credentialHarvesting: z.boolean(),
  }),
  detectedReasons: z.array(z.string()),
  intentAnalysis: z.string(),
  extractedIocs: z.array(
    z.object({
      type: z.enum(['upi', 'phone', 'telegram', 'domain', 'ip', 'asn']),
      value: z.string(),
    })
  ).default([]),
  recommendedAction: z.string(),
});

export type LLMScamAnalysis = z.infer<typeof LLMScamAnalysisSchema>;

export async function analyzeWithGemini(
  content: string,
  brandContext: {
    name: string;
    domain: string;
    officialHandles?: Record<string, string>;
  }
): Promise<{ analysis: LLMScamAnalysis; isLLMPowered: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey.length < 15 || !apiKey.startsWith('AIzaSy')) {
    console.log('[SAFENET] Gemini: unavailable (invalid or missing GEMINI_API_KEY), falling back to heuristic engine');
    return {
      analysis: getMockOrHeuristicLLMAnalysis(content, brandContext),
      isLLMPowered: false,
    };
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

    const prompt = `You are SAFENET, an expert Digital Risk & Anti-Phishing Cyber Analyst.
Analyze the following suspect communication / profile bio / domain / message targeting the brand:
Official Brand Name: "${brandContext.name}"
Official Brand Domain: "${brandContext.domain}"
Official Brand Handles: ${JSON.stringify(brandContext.officialHandles || {})}

Suspect Content to Evaluate:
"""
${content}
"""

Evaluate this suspect content for scam patterns targeting consumers, including:
1. UPI Payment Requests / Reverse UPI PIN fraud / payment gateway fee demands
2. High-pressure Urgency (threats of account suspension, electricity cutoff, KYC expiry)
3. Fake Refunds / Cashback / Lottery / Prize lures
4. Redirection to private DMs (WhatsApp, Telegram bots, unofficial phone lines)
5. Credential Harvesting (OTP, passwords, AnyDesk/TeamViewer remote screen share)

Return a strictly formatted JSON object matching this schema:
{
  "riskScore": number (0 to 100),
  "riskLevel": "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "scamSignalsDetected": {
    "upiPaymentRequest": boolean,
    "urgencyOrCoercion": boolean,
    "fakeRefundOrCashback": boolean,
    "dmForSupport": boolean,
    "credentialHarvesting": boolean
  },
  "detectedReasons": string[],
  "intentAnalysis": string (2-3 concise sentences detailing threat intent and tactics),
  "extractedIocs": [
    { "type": "upi" | "phone" | "telegram" | "domain", "value": string }
  ],
  "recommendedAction": string (Action for security team or user, e.g. "Report UPI VPA to NPCI & initiate domain takedown")
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedJson = JSON.parse(responseText);
    const validated = LLMScamAnalysisSchema.parse(parsedJson);

    console.log('[SAFENET] Gemini: analysis completed successfully');
    return {
      analysis: validated,
      isLLMPowered: true,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`[SAFENET] Gemini: unavailable (${errorMsg}), falling back to heuristic engine`);
    return {
      analysis: getMockOrHeuristicLLMAnalysis(content, brandContext),
      isLLMPowered: false,
    };
  }
}

/**
 * Heuristic fallback when LLM API key is not supplied
 */
function getMockOrHeuristicLLMAnalysis(
  content: string,
  brandContext: { name: string; domain: string }
): LLMScamAnalysis {
  const lower = content.toLowerCase();
  const reasons: string[] = [];

  const hasUpi = /@[a-z0-9]+/i.test(content) && (lower.includes('upi') || lower.includes('pay') || lower.includes('vpa'));
  const hasUrgency = lower.includes('urgent') || lower.includes('block') || lower.includes('suspend') || lower.includes('kyc') || lower.includes('24 hour');
  const hasRefund = lower.includes('refund') || lower.includes('cashback') || lower.includes('reward') || lower.includes('bonus') || lower.includes('lottery');
  const hasDm = lower.includes('dm') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('helpline') || lower.includes('inbox');
  const hasCred = lower.includes('otp') || lower.includes('password') || lower.includes('anydesk') || lower.includes('pin');

  if (hasUpi) reasons.push('Direct payment address or UPI transfer mechanism detected');
  if (hasUrgency) reasons.push('Psychological urgency / coercive threats detected in messaging');
  if (hasRefund) reasons.push('Unsolicited refund, cashback, or reward incentive lure identified');
  if (hasDm) reasons.push('Redirection to unverified third-party communication channels');
  if (hasCred) reasons.push('Attempts to obtain sensitive verification credentials or remote access');

  let score = 0;
  if (hasUpi) score += 30;
  if (hasRefund) score += 25;
  if (hasUrgency) score += 20;
  if (hasDm) score += 15;
  if (hasCred) score += 35;

  score = Math.min(100, score);
  const cleanInput = lower.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  const isExactOfficialDomain = cleanInput === brandContext.domain.toLowerCase();

  if (!isExactOfficialDomain && score === 0 && (lower.includes(brandContext.name.toLowerCase()) || lower.includes(brandContext.domain.toLowerCase()))) {
    score = 15; // Low baseline mention
    reasons.push('Brand mention identified without explicit high-risk scam triggers');
  }

  let riskLevel: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'SAFE';
  if (score >= 80) riskLevel = 'CRITICAL';
  else if (score >= 60) riskLevel = 'HIGH';
  else if (score >= 35) riskLevel = 'MODERATE';
  else if (score >= 15) riskLevel = 'LOW';

  return {
    riskScore: score,
    riskLevel,
    scamSignalsDetected: {
      upiPaymentRequest: hasUpi,
      urgencyOrCoercion: hasUrgency,
      fakeRefundOrCashback: hasRefund,
      dmForSupport: hasDm,
      credentialHarvesting: hasCred,
    },
    detectedReasons: reasons.length > 0 ? reasons : ['No overt scam patterns or coercive phrases detected in text.'],
    intentAnalysis: reasons.length > 0
      ? `Pattern heuristic flagged ${reasons.length} risk indicators targeting ${brandContext.name} users.`
      : `Content appears benign with no immediate threat indicators matching known scam signatures.`,
    extractedIocs: [],
    recommendedAction: score >= 60
      ? 'Issue immediate takedown notice and blacklist associated contact vectors.'
      : 'Maintain surveillance and monitor for escalation.',
  };
}
