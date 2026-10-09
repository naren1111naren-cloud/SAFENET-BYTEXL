import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ThreatItem, ThreatType } from '@/types/brand';

export const SimulatedThreatItemSchema = z.object({
  id: z.string(),
  type: z.enum(['domain', 'social_profile', 'mobile_app']),
  targetAsset: z.string(),
  impersonationTactic: z.string(),
  riskScore: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  fakeAppName: z.string().optional(),
  fakePackageName: z.string().optional(),
  socialPlatform: z.string().optional(),
  primaryIoc: z.object({
    type: z.enum(['domain', 'telegram', 'upi', 'phone', 'ip']),
    value: z.string(),
  }).optional(),
});

export const AttackSimulationResultSchema = z.object({
  brandName: z.string(),
  brandDomain: z.string(),
  simulatedAt: z.string(),
  summary: z.string(),
  threats: z.array(SimulatedThreatItemSchema),
});

export type SimulatedThreat = z.infer<typeof SimulatedThreatItemSchema>;
export type AttackSimulationResult = z.infer<typeof AttackSimulationResultSchema>;

/**
 * Generates synthetic attack lookalikes and phishing vectors using Gemini LLM or algorithmic fallback
 */
export async function generateAttackScenarios(
  brandName: string,
  brandDomain: string,
  count: number = 8
): Promise<{ result: AttackSimulationResult; isLLMPowered: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      result: generateAlgorithmicScenarios(brandName, brandDomain),
      isLLMPowered: false,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const prompt = `You are a Red Team Adversary Simulation specialist in Digital Brand Protection.
Generate realistic synthetic attack vectors and lookalike brand impersonation assets targeting the official brand:
Brand Name: "${brandName}"
Official Domain: "${brandDomain}"

Generate an array of at least 8 to 12 varied impersonation threats across three attack categories:
1. "domain": Typosquatting domains (omissions, Cyrillic/homoglyphs, hyphenated fake support/login portals, predatory TLDs like .top, .vip, .support, .net)
2. "social_profile": Deceptive customer care & refund scam handles across Twitter, Telegram, Instagram, Facebook (e.g., @${brandName.toLowerCase()}_care_refund, @${brandName.toLowerCase()}_official_helpdesk)
3. "mobile_app": Fake Android / iOS Trojan APK or predatory loan/rewards clone app names (e.g., "${brandName} Instant Loan & Refund Support", package: "com.${brandName.toLowerCase()}.instantrefund.cash")

Return STRICT JSON matching this schema:
{
  "brandName": "${brandName}",
  "brandDomain": "${brandDomain}",
  "simulatedAt": "${new Date().toISOString()}",
  "summary": "Brief executive summary of brand risk attack surface",
  "threats": [
    {
      "id": "unique-slug-id",
      "type": "domain" | "social_profile" | "mobile_app",
      "targetAsset": string (the malicious domain, handle like @xyz, or app title),
      "impersonationTactic": string (e.g., "Homoglyph Cyrillic 'a' replacement", "Fake Refund Telegram Bot", "Rogue APK APK with loan lure"),
      "riskScore": number (70 to 98),
      "reasons": [string, string],
      "fakeAppName": string (only if type is mobile_app),
      "fakePackageName": string (only if type is mobile_app),
      "socialPlatform": string (e.g. "Telegram", "Twitter/X", "Instagram" if type is social_profile),
      "primaryIoc": { "type": "domain" | "telegram" | "upi" | "phone", "value": string }
    }
  ]
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const parsed = JSON.parse(text);
    const validated = AttackSimulationResultSchema.parse(parsed);

    return {
      result: validated,
      isLLMPowered: true,
    };
  } catch (err) {
    console.warn('Gemini Attack Simulator fallback:', err);
    return {
      result: generateAlgorithmicScenarios(brandName, brandDomain),
      isLLMPowered: false,
    };
  }
}

/**
 * High-fidelity algorithmic simulation generator for when Gemini API key is not present
 */
export function generateAlgorithmicScenarios(brandName: string, brandDomain: string): AttackSimulationResult {
  const cleanBrand = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rootDomain = brandDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainParts = rootDomain.split('.');
  const baseName = domainParts[0] || cleanBrand;

  const threats: SimulatedThreat[] = [];

  // 1. Homoglyph Domain Attack
  threats.push({
    id: `sim-${Date.now()}-1`,
    type: 'domain',
    targetAsset: `${baseName.replace(/a/g, 'а').replace(/o/g, 'о')}.com`, // Cyrillic replacement
    impersonationTactic: 'IDN Homoglyph / Confusable Cyrillic Character Replacement',
    riskScore: 96,
    reasons: [
      'Visually indistinguishable Unicode confusable character replaces Latin vowel.',
      'Designed for high-trust credential harvesting and phishing emails.',
    ],
    primaryIoc: {
      type: 'domain',
      value: `xn--${baseName}.com`,
    },
  });

  // 2. Typosquatting Omission / Transposition
  const transposed = baseName.length > 2
    ? baseName.slice(0, 1) + baseName.charAt(2) + baseName.charAt(1) + baseName.slice(3)
    : `${baseName}s`;
  threats.push({
    id: `sim-${Date.now()}-2`,
    type: 'domain',
    targetAsset: `${transposed}.com`,
    impersonationTactic: 'Adjacent Character Transposition Typosquatting',
    riskScore: 88,
    reasons: [
      'Preys on common user typing errors on mobile keyboards.',
      'Frequently registered to redirect traffic to affiliate scams or ad networks.',
    ],
    primaryIoc: {
      type: 'domain',
      value: `${transposed}.com`,
    },
  });

  // 3. Phishing Subdomain / Fake Support Portal
  threats.push({
    id: `sim-${Date.now()}-3`,
    type: 'domain',
    targetAsset: `${cleanBrand}-secure-login.net`,
    impersonationTactic: 'Combosquatting with High-Trust Action Keyword',
    riskScore: 92,
    reasons: [
      'Combines legitimate brand name with security keywords ("secure-login").',
      'Commonly deployed in SMS smishing attacks to harvest 2FA OTP codes.',
    ],
    primaryIoc: {
      type: 'domain',
      value: `${cleanBrand}-secure-login.net`,
    },
  });

  // 4. Predatory TLD Swapping
  threats.push({
    id: `sim-${Date.now()}-4`,
    type: 'domain',
    targetAsset: `${cleanBrand}.support`,
    impersonationTactic: 'Alternative TLD Hijacking (.support)',
    riskScore: 84,
    reasons: [
      'Utilizes descriptive new gTLD to mimic customer resolution portal.',
      'Lacks official DMARC/SPF authentication matching the parent entity.',
    ],
    primaryIoc: {
      type: 'domain',
      value: `${cleanBrand}.support`,
    },
  });

  // 5. Fake Telegram Refund Bot
  threats.push({
    id: `sim-${Date.now()}-5`,
    type: 'social_profile',
    targetAsset: `@${cleanBrand}_24x7_refund_bot`,
    impersonationTactic: 'Impersonated Customer Support & Refund Bot',
    riskScore: 95,
    reasons: [
      'Lures frustrated customers from public comment sections into private chats.',
      'Asks victim to send token fee or enter UPI PIN to receive pending refund.',
    ],
    socialPlatform: 'Telegram',
    primaryIoc: {
      type: 'telegram',
      value: `${cleanBrand}_24x7_refund_bot`,
    },
  });

  // 6. Twitter / X Impersonation Handle
  threats.push({
    id: `sim-${Date.now()}-6`,
    type: 'social_profile',
    targetAsset: `@${cleanBrand}Care_HelpDesk`,
    impersonationTactic: 'Social Media Customer Care Interception Handle',
    riskScore: 91,
    reasons: [
      'Actively monitors brand hashtags to reply to customer grievances with fake helpline numbers.',
      'Uses official logos and blue checkmark spoofing.',
    ],
    socialPlatform: 'Twitter / X',
    primaryIoc: {
      type: 'phone',
      value: '+91-9876543210',
    },
  });

  // 7. Fake Mobile App / Rogue Loan APK
  threats.push({
    id: `sim-${Date.now()}-7`,
    type: 'mobile_app',
    targetAsset: `${brandName} Pay: Instant Cashback & Loans`,
    fakeAppName: `${brandName} Pay: Instant Cashback & Loans`,
    fakePackageName: `com.${cleanBrand}.instantloan.rewardpay`,
    impersonationTactic: 'Predatory Rogue Loan App / Credential Stealer',
    riskScore: 94,
    reasons: [
      'Clones official brand branding to distribute malware APK via third-party app stores.',
      'Requests extensive SMS and Contact permissions to execute financial extortion.',
    ],
    primaryIoc: {
      type: 'domain',
      value: `get-${cleanBrand}-app.apk`,
    },
  });

  // 8. Fake WhatsApp KYC Helpline
  threats.push({
    id: `sim-${Date.now()}-8`,
    type: 'social_profile',
    targetAsset: `+91 91234 56789 (${brandName} Verification Desk)`,
    impersonationTactic: 'WhatsApp KYC & Account Re-activation Scam',
    riskScore: 89,
    reasons: [
      'Sends unsolicited WhatsApp warnings threatening 24-hour service suspension.',
      'Directs victim to pay reactivation fee via unauthorized UPI VPA.',
    ],
    socialPlatform: 'WhatsApp',
    primaryIoc: {
      type: 'upi',
      value: `${cleanBrand}.verify@okaxis`,
    },
  });

  return {
    brandName,
    brandDomain,
    simulatedAt: new Date().toISOString(),
    summary: `Simulated 8 high-probability digital risk attack vectors targeting ${brandName} across typosquat domains, rogue social bots, and predatory mobile clones.`,
    threats,
  };
}

/**
 * Helper to convert simulated threats into standard SAFENET ThreatItems
 */
export function convertSimulatedToThreatItems(
  simulated: AttackSimulationResult,
  brandId: string
): ThreatItem[] {
  return simulated.threats.map((t) => ({
    id: t.id,
    brandId,
    targetAsset: t.targetAsset,
    type: t.type as ThreatType,
    source: 'simulator',
    riskScore: t.riskScore,
    riskLevel: t.riskScore >= 80 ? 'CRITICAL' : t.riskScore >= 60 ? 'HIGH' : t.riskScore >= 30 ? 'MEDIUM' : 'LOW',
    reasons: t.reasons,
    iocs: t.primaryIoc ? [t.primaryIoc] : [],
    discoveredAt: simulated.simulatedAt,
    status: 'under_review',
    rawContent: `Attack Tactic: ${t.impersonationTactic}${t.fakePackageName ? ` | Package: ${t.fakePackageName}` : ''}`,
  }));
}
