import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

export const GeminiAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  confidence: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  explanation: z.string(),
  suspiciousSignals: z.array(z.string()).default([]),
  extractedIocs: z.array(
    z.object({
      type: z.enum(['upi', 'phone', 'telegram', 'domain', 'ip', 'asn']),
      value: z.string(),
    })
  ).default([]),
  recommendedAction: z.string(),
});

export type GeminiAnalysis = z.infer<typeof GeminiAnalysisSchema>;

export interface GeminiResult {
  analysis: GeminiAnalysis | null;
  isLLMPowered: boolean;
  error?: string;
}

/**
 * Invokes Gemini AI with graceful fallback and strict validation
 */
export async function analyzeContentWithGemini(
  content: string,
  brandContext: {
    name: string;
    domain: string;
    officialHandles?: Record<string, string>;
  }
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Fast check for missing or obvious non-API key placeholders
  if (!apiKey || apiKey.length < 20) {
    console.log('[SAFENET] Gemini: unavailable (invalid or missing GEMINI_API_KEY), using heuristic engine');
    return {
      analysis: null,
      isLLMPowered: false,
      error: 'GEMINI_API_KEY is missing or invalid in .env.local',
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

    const prompt = `You are SAFENET, an expert Digital Risk & Anti-Phishing Cyber Threat Intelligence Analyst.
Analyze the following suspect communication / URL / domain / message targeting the brand:
Official Brand Name: "${brandContext.name}"
Official Brand Domain: "${brandContext.domain}"
Official Brand Handles: ${JSON.stringify(brandContext.officialHandles || {})}

Suspect Content to Evaluate:
"""
${content}
"""

Evaluate this suspect content for digital risk and scam patterns targeting consumers, including:
1. Brand impersonation, typosquatting, combosquatting
2. High-pressure urgency (threats of account suspension, KYC expiry, immediate penalties)
3. Financial fraud (UPI payment requests, fee demands, fake refunds/cashback/prizes)
4. Credential harvesting (OTP, passwords, login capture)
5. Redirection to unverified channels (WhatsApp, Telegram bots, rogue URLs)

Return a strictly formatted JSON object matching this schema:
{
  "riskScore": number between 0 and 100,
  "riskLevel": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": number between 0 and 100,
  "reasons": ["short bullet reasons"],
  "explanation": "2-3 concise sentences detailing threat intent and tactics",
  "suspiciousSignals": ["list of detected signals"],
  "extractedIocs": [
    { "type": "upi" | "phone" | "telegram" | "domain", "value": "string" }
  ],
  "recommendedAction": "Actionable guidance for user/security team"
}`;

    const res = await model.generateContent(prompt);
    const responseText = res.response.text();
    const parsed = JSON.parse(responseText);
    const validated = GeminiAnalysisSchema.parse(parsed);

    console.log('[SAFENET] Gemini: analysis completed successfully');
    return {
      analysis: validated,
      isLLMPowered: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(`[SAFENET] Gemini: unavailable (${errorMsg}), using heuristic engine`);
    return {
      analysis: null,
      isLLMPowered: false,
      error: errorMsg,
    };
  }
}
