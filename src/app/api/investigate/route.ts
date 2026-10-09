import { NextRequest, NextResponse } from 'next/server';
import { globalProviderRegistry } from '@/lib/providers/registry';
import { assessCandidateRisk } from '@/lib/risk-engine/candidate-risk-engine';
import { explainCandidateWithAi } from '@/lib/intelligence/ai-candidate-interpreter';
import { BrandProfile, ThreatItem, ThreatEvidence } from '@/types/brand';
import { DiscoveredCandidate } from '@/lib/providers/types';

export async function POST(req: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const body = await req.json();
    const {
      brandName,
      officialWebsite,
      officialSocialAccounts = {},
      officialApps = [],
      officialDevelopers = [],
      officialDomains = [],
      domain,
      handles,
      appPackageName,
    } = body;

    const name = (brandName || body.name || '').trim();
    if (!name) {
      return NextResponse.json(
        { error: 'Brand name is required to launch an investigation.' },
        { status: 400 }
      );
    }

    const primaryDomain = (officialWebsite || domain || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];

    const allDomains = Array.from(
      new Set(
        [
          primaryDomain,
          ...(officialDomains || []),
          ...(body.officialDomains || []),
        ]
          .filter(Boolean)
          .map((d: string) => d.toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0])
      )
    );

    const socialHandles = handles || officialSocialAccounts || {};
    const primaryAppPackage = appPackageName || officialApps[0] || undefined;
    const authorizedApps = Array.from(
      new Set([primaryAppPackage, ...(officialApps || [])].filter(Boolean))
    );

    const brandProfile: BrandProfile = {
      id: `brand-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name,
      domain: primaryDomain,
      officialDomains: allDomains,
      handles: socialHandles,
      appPackageName: primaryAppPackage,
      authorizedAppIds: authorizedApps,
      officialDevelopers: officialDevelopers.length > 0 ? officialDevelopers : [name],
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`[SAFENET Investigation] Launching multi-provider discovery for brand "${name}"...`);

    // 1. Run real discovery across all providers
    const discoveryResult = await globalProviderRegistry.runDiscovery({
      brandName: name,
      domain: primaryDomain,
      officialDomains: allDomains,
      handles: socialHandles,
      appPackageName: primaryAppPackage,
      officialDevelopers: brandProfile.officialDevelopers,
    });

    const discoveredCandidates = discoveryResult.candidates;
    console.log(`[SAFENET Investigation] Discovered ${discoveredCandidates.length} candidate entities across providers.`);

    // 2. Assess Risk & Explain Each Candidate with Deterministic Signals + AI
    const evaluatedThreats: ThreatItem[] = [];
    const aggregatedEvidence: ThreatEvidence[] = [];

    for (const cand of discoveredCandidates) {
      // Deterministic risk scoring
      const riskAssessment = assessCandidateRisk(cand, brandProfile);

      // AI explanation strictly bounded by retrieved evidence
      const aiExplanation = await explainCandidateWithAi(cand, riskAssessment, brandProfile);

      cand.riskScore = riskAssessment.riskScore;
      cand.riskLevel = riskAssessment.riskLevel;
      cand.assessment = aiExplanation.assessment;
      cand.reasons = riskAssessment.reasons;

      // Map to standard SAFENET ThreatItem
      const threatType = cand.sourceType === 'app'
        ? 'mobile_app'
        : cand.sourceType === 'social'
        ? 'social_profile'
        : 'domain';

      const threatSource = cand.source.includes('app')
        ? 'app_store_monitor'
        : cand.source.includes('social')
        ? 'social_crawler'
        : 'live_check';

      const threatItem: ThreatItem = {
        id: cand.id,
        brandId: brandProfile.name,
        targetAsset: cand.title,
        type: threatType,
        source: threatSource,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        status: riskAssessment.riskScore >= 70 ? 'under_review' : 'active',
        discoveredAt: cand.discoveredAt,
        reasons: riskAssessment.reasons,
        evidenceList: riskAssessment.evidence,
        iocs: riskAssessment.iocs,
        aiAnalysis: aiExplanation.assessment,
        riskBreakdown: {
          usernameSimilarity: riskAssessment.breakdown.usernameSimilarity,
          logoSimilarity: riskAssessment.breakdown.brandingSimilarity,
          bioContentSimilarity: riskAssessment.breakdown.brandClaim,
          suspiciousUrl: riskAssessment.breakdown.externalLinkMismatch,
          paymentScamIndicators: 0,
          accountAppBehavior: riskAssessment.breakdown.developerMismatch,
          totalScore: riskAssessment.riskScore,
        },
        explainableIndicators: riskAssessment.reasons.map((r, i) => ({
          category: i === 0 ? 'identity' : i === 1 ? 'authorization' : 'content',
          label: `Indicator ${i + 1}`,
          severity: riskAssessment.riskScore >= 80 ? 'CRITICAL' : riskAssessment.riskScore >= 60 ? 'HIGH' : 'MEDIUM',
          status: 'flagged',
          description: r,
        })),
        socialProfile: cand.sourceType === 'social' ? {
          username: cand.username?.replace(/^@/, '') || cand.title,
          displayName: cand.title,
          platform: 'other',
          profileUrl: cand.url,
          bio: cand.description,
        } : undefined,
        mobileApp: cand.sourceType === 'app' ? {
          appName: cand.title,
          developerName: cand.developer || 'Unknown',
          packageName: cand.appId || cand.id,
          appStoreUrl: cand.url,
          iconUrl: cand.imageUrl,
          permissions: [],
          description: cand.description,
          rating: cand.rating,
        } : undefined,
      };

      evaluatedThreats.push(threatItem);
      aggregatedEvidence.push(...riskAssessment.evidence);
    }

    // Sort threats by risk score descending
    evaluatedThreats.sort((a, b) => b.riskScore - a.riskScore);

    // Determine honest investigation status
    let status: 'completed' | 'no_results' | 'partial_results' = 'completed';
    if (evaluatedThreats.length === 0) {
      status = 'no_results';
    } else {
      const anyUnconfigured = Object.values(discoveryResult.providerRuns).some(
        (p) => p.status === 'not_configured'
      );
      if (anyUnconfigured) {
        status = 'partial_results';
      }
    }

    const highRiskCount = evaluatedThreats.filter((t) => t.riskScore >= 60).length;
    const completedAt = new Date().toISOString();

    const summary = status === 'no_results'
      ? `Investigation completed for "${name}". No impersonation candidates or suspicious digital assets were discovered from configured providers.`
      : `Discovered ${evaluatedThreats.length} candidate assets across digital perimeter. ${highRiskCount} candidates identified with elevated or high risk scores requiring analyst review.`;

    const investigationId = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return NextResponse.json({
      investigationId,
      status,
      brand: brandProfile,
      summary,
      candidatesCount: discoveredCandidates.length,
      highRiskCount,
      candidates: discoveredCandidates,
      threats: evaluatedThreats,
      evidence: aggregatedEvidence.slice(0, 50),
      providerRuns: discoveryResult.providerRuns,
      startedAt,
      completedAt,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[SAFENET Investigation] Failure:', error);
    return NextResponse.json(
      { error: `SAFENET brand investigation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
