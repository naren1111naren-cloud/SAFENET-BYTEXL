import { NextRequest, NextResponse } from 'next/server';
import { runFullIntelligenceScan } from '@/lib/intelligence/analysis-orchestrator';
import { normalizeUrlInput } from '@/lib/intelligence/url-normalizer';
import { analyzeSocialProfile } from '@/lib/analyzers/social-analyzer';
import { analyzeMobileApp } from '@/lib/analyzers/app-analyzer';
import { analyzeScamContent } from '@/lib/analyzers/scam-analyzer';
import { BrandProfile, ThreatEvidence, ThreatIOC } from '@/types/brand';

function detectInputType(input: string, explicitType: string): 'domain' | 'url' | 'message' | 'social_profile' | 'mobile_app' {
  if (explicitType === 'url') return 'url';
  if (explicitType === 'domain') return 'domain';
  if (explicitType === 'social' || explicitType === 'social_profile') return 'social_profile';
  if (explicitType === 'app' || explicitType === 'mobile_app') return 'mobile_app';
  if (explicitType === 'message' || explicitType === 'scam_content') return 'message';

  const trimmed = input.trim();
  if (trimmed.startsWith('@')) return 'social_profile';
  if (/\.apk$/i.test(trimmed)) return 'mobile_app';
  if (/^https?:\/\//i.test(trimmed)) return 'url';
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) return 'domain';
  return 'message';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'auto',
      input,
      socialProfile,
      mobileApp,
      content,
      brandName = 'Paytm',
      brandDomain = 'paytm.com',
      brandHandles = {},
      appPackageName = 'net.one97.paytm',
    } = body;

    const rawInput = (
      input ||
      body.target ||
      content?.text ||
      (socialProfile ? `@${socialProfile.username}` : '') ||
      mobileApp?.packageName ||
      ''
    ).trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: 'Input text, domain, URL, or entity is required for analysis.' },
        { status: 400 }
      );
    }

    const currentBrand: BrandProfile = {
      id: `brand-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: brandName,
      domain: brandDomain,
      officialDomains: [brandDomain, 'paytmbank.com', 'paytmmoney.com', 'nike.com', 'snkrs.com'].filter(
        (d) => d.toLowerCase().includes(brandName.toLowerCase()) || brandDomain.toLowerCase().includes(d.toLowerCase())
      ),
      handles: brandHandles,
      appPackageName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const detectedType = detectInputType(rawInput, type);
    console.log(`[SAFENET] Request received -> Type: ${detectedType}, Target: "${rawInput.slice(0, 70)}"`);

    // 1. Full Real Internet Intelligence Pipeline for Domains & URLs
    if (detectedType === 'domain' || detectedType === 'url') {
      const normCheck = normalizeUrlInput(rawInput);
      if (!normCheck.isValid) {
        return NextResponse.json(
          { error: normCheck.error || 'Invalid domain or URL format provided.' },
          { status: 400 }
        );
      }
      const scan = await runFullIntelligenceScan(rawInput, currentBrand);

      // Map normalized evidence items to ThreatEvidence for UI backwards-compatibility
      const evidenceList: ThreatEvidence[] = scan.evidencePackage.evidenceItems.map((e) => ({
        id: e.id,
        category: e.category,
        title: e.findingName,
        description: e.humanExplanation,
        severity: e.severity === 'critical' || e.severity === 'high' ? 'high' : e.severity === 'medium' ? 'medium' : 'low',
        value: e.observedValue,
        status: e.status === 'observed' ? 'available' : e.status === 'not_found' ? 'not_applicable' : 'unavailable',
        source: e.source,
      }));

      // Extract real IOCs
      const extractedIocs: ThreatIOC[] = [];
      if (scan.dns.ipv4.length > 0) {
        scan.dns.ipv4.forEach((ip) => extractedIocs.push({ type: 'ip', value: ip }));
      }
      if (scan.ipIntel?.asn) {
        extractedIocs.push({ type: 'asn', value: scan.ipIntel.asn });
      }
      extractedIocs.push({ type: 'domain', value: scan.normalizedTarget });

      console.log(`[SAFENET] Intelligence Complete -> Score: ${scan.riskScore}/100, Verdict: ${scan.riskLevel}, Confidence: ${scan.confidence}%`);

      return NextResponse.json({
        scanId: scan.scanId,
        targetInput: rawInput,
        normalizedTarget: scan.normalizedTarget,
        detectedType: scan.detectedType,
        type: scan.detectedType,
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        confidence: scan.confidence,
        isInconclusive: scan.isInconclusive,
        summaryPhrase: scan.summaryPhrase,
        reasons: scan.reasons,
        contributions: scan.contributions,
        dns: scan.dns,
        rdap: scan.rdap,
        tls: scan.tls,
        http: scan.http,
        page: scan.page,
        ipIntel: scan.ipIntel,
        threatFeeds: scan.threatFeeds,
        evidenceList,
        evidencePackage: scan.evidencePackage,
        limitations: scan.evidencePackage.limitations,
        extractedIocs,
        aiAnalysis: scan.ai?.interpretation,
        isLLMPowered: scan.isLLMPowered,
        aiStatus: scan.ai?.status || 'unavailable',
        recommendedAction: scan.recommendedAction,
        campaignId: null,
        threatClusterId: null,
      });
    }

    // 2. Non-domain pipelines (Social Profile, Mobile App, Message)
    if (detectedType === 'social_profile') {
      const handle = rawInput.replace(/^@/, '');
      const profile = socialProfile || {
        username: handle,
        displayName: `@${handle}`,
        platform: 'other',
        bio: '',
      };
      const socialResult = analyzeSocialProfile(profile, currentBrand);

      return NextResponse.json({
        targetInput: rawInput,
        detectedType: 'social_profile',
        type: 'social_profile',
        riskScore: socialResult.riskScore,
        riskLevel: socialResult.riskLevel,
        confidence: 85,
        summaryPhrase: socialResult.summaryPhrase,
        reasons: socialResult.reasons,
        evidenceList: socialResult.evidenceList,
        explainableIndicators: socialResult.explainableIndicators,
        riskBreakdown: socialResult.riskBreakdown,
        extractedIocs: [{ type: 'social', value: `@${profile.username}` }],
        recommendedAction: {
          action: socialResult.riskScore >= 70 ? 'IMPERSONATION_PROFILE' : 'VERIFIED_PROFILE',
          summary: socialResult.summaryPhrase,
          urgency: socialResult.riskScore >= 70 ? 'high' : 'low',
          steps: [
            'Do not share personal verification codes, OTPs, or passwords with unverified handles.',
            'Verify account handle against official social directory on the brand website.',
          ],
        },
        campaignId: null,
        isLLMPowered: false,
        aiStatus: 'unavailable',
      });
    }

    if (detectedType === 'mobile_app') {
      let liveAppMetadata: any = null;
      try {
        const itunesRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(rawInput)}&entity=software&limit=1`,
          { headers: { 'User-Agent': 'SAFENET-Risk-Intel/1.0' } }
        );
        if (itunesRes.ok) {
          const data = await itunesRes.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            liveAppMetadata = data.results[0];
          }
        }
      } catch {
        // App store query non-blocking
      }

      const app = mobileApp || {
        appName: liveAppMetadata?.trackName || rawInput,
        developerName: liveAppMetadata?.sellerName || liveAppMetadata?.artistName || 'Unverified Developer',
        packageName: liveAppMetadata?.bundleId || rawInput,
        permissions: [],
        appStoreUrl: liveAppMetadata?.trackViewUrl,
        iconUrl: liveAppMetadata?.artworkUrl512,
        description: liveAppMetadata?.description,
      };
      const appResult = analyzeMobileApp(app, currentBrand);

      return NextResponse.json({
        targetInput: rawInput,
        detectedType: 'mobile_app',
        type: 'mobile_app',
        riskScore: appResult.riskScore,
        riskLevel: appResult.riskLevel,
        confidence: 88,
        summaryPhrase: appResult.summaryPhrase,
        reasons: appResult.reasons,
        evidenceList: appResult.evidenceList,
        explainableIndicators: appResult.explainableIndicators,
        riskBreakdown: appResult.riskBreakdown,
        extractedIocs: [{ type: 'app', value: app.packageName }],
        recommendedAction: {
          action: appResult.riskScore >= 70 ? 'UNTRUSTED_PACKAGE' : 'VERIFIED_PACKAGE',
          summary: appResult.summaryPhrase,
          urgency: appResult.riskScore >= 70 ? 'high' : 'low',
          steps: [
            'Download mobile applications exclusively from official stores (Google Play, Apple App Store).',
            'Never install third-party APK files received via SMS, WhatsApp, or Telegram.',
          ],
        },
        campaignId: null,
        isLLMPowered: false,
        aiStatus: 'unavailable',
      });
    }

    // Message / Scam Content Pipeline
    const scamText = typeof content === 'string' ? content : content?.text || rawInput;
    const scamPlatform = typeof content === 'object' && content?.platform ? content.platform : 'sms';
    const scamResult = analyzeScamContent(scamText, currentBrand, scamPlatform);

    return NextResponse.json({
      targetInput: rawInput,
      detectedType: 'message',
      type: 'message',
      riskScore: scamResult.riskScore,
      riskLevel: scamResult.riskLevel,
      confidence: 85,
      summaryPhrase: scamResult.summaryPhrase,
      reasons: scamResult.reasons,
      evidenceList: scamResult.evidenceList,
      detectedPatterns: scamResult.detectedPatterns,
      extractedIocs: scamResult.extractedIocs,
      recommendedAction: {
        action: scamResult.riskScore >= 60 ? 'DO_NOT_ENGAGE' : 'VERIFY_SENDER',
        summary: scamResult.summaryPhrase,
        urgency: scamResult.riskScore >= 60 ? 'immediate' : 'medium',
        steps: [
          'Do not click links or call phone numbers contained in urgent messages.',
          'Official organizations never demand immediate KYC re-verification under threat of same-day suspension.',
          'Report phishing message to your telecom provider or cybersecurity hotline.',
        ],
      },
      campaignId: null,
      isLLMPowered: false,
      aiStatus: 'unavailable',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[SAFENET] API Execution Error:', error);
    return NextResponse.json(
      { error: `SAFENET intelligence analysis failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
