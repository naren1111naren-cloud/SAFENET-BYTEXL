/**
 * SAFENET API Route: POST /api/social/brands/[id]/scan
 * Triggers full multi-platform discovery, candidate normalization,
 * identity comparison, external URL analysis, and explainable risk scoring.
 * Automatically ensures Brand Identity Fingerprint is established.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore, SocialScanRecord } from '@/lib/social/social-store';
import { globalSocialDiscoveryEngine } from '@/lib/social/discovery-engine';
import { analyzeAllSocialCandidates } from '@/lib/social/analyzer-orchestrator';
import { globalBrandDiscoveryService } from '@/lib/social/brand-discovery';
import { buildBrandIdentityFingerprint } from '@/lib/social/identity-fingerprint';
import { SocialCandidate } from '@/lib/social/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { includeDemoData, inlineBrandProfile } = body;

    let brandProfile = SocialStore.getBrandById(id);

    // If an inline brand profile was sent directly
    if (!brandProfile && inlineBrandProfile) {
      brandProfile = SocialStore.saveBrand(inlineBrandProfile);
    }

    if (!brandProfile) {
      return NextResponse.json(
        { success: false, error: `Brand with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    // Step 0: Ensure Brand Identity Baseline exists before allowing threat discovery
    if (!brandProfile.fingerprint || brandProfile.fingerprint.verificationStatus === 'UNVERIFIED' || brandProfile.fingerprint.confidence < 50) {
      const discovery = await globalBrandDiscoveryService.discoverBrandIdentity(
        brandProfile.brandName,
        brandProfile.officialDomain
      );
      if (!discovery.isIdentityEstablished || !discovery.fingerprint) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot perform threat discovery: trusted identity could not be established for this brand from the available sources. A verified identity baseline is required before lookalike scanning.',
            identityStatus: 'UNVERIFIED',
            message: 'SAFENET could not establish a trusted digital identity for this brand from the available sources.',
          },
          { status: 400 }
        );
      }
      brandProfile.fingerprint = discovery.fingerprint;
      SocialStore.saveBrand(brandProfile);
    }

    // Step 1: Run Discovery Engine across all enabled providers & demo provider
    const discoveryResult = await globalSocialDiscoveryEngine.runDiscovery(brandProfile, {
      includeDemoData: includeDemoData !== undefined ? Boolean(includeDemoData) : undefined,
    });

    const candidatesToAnalyze: SocialCandidate[] = [...discoveryResult.candidates];

    // Ensure only VERIFIED or LIKELY official profiles from fingerprint are present in candidates
    if (brandProfile.fingerprint?.officialProfiles) {
      for (const op of brandProfile.fingerprint.officialProfiles) {
        if (op.platform === 'website') continue;
        if (op.verificationStatus !== 'VERIFIED' && op.verificationStatus !== 'LIKELY') continue;

        const opKey = `${op.platform}:${op.username.toLowerCase().replace(/^@/, '')}`;
        const alreadyPresent = candidatesToAnalyze.some(
          (c) => `${c.platform}:${c.username.toLowerCase().replace(/^@/, '')}` === opKey
        );

        if (!alreadyPresent) {
          candidatesToAnalyze.push({
            id: `official-${op.platform}-${op.username.replace(/[^a-z0-9]/gi, '')}`,
            platform: op.platform,
            candidateId: `official_${op.platform}`,
            username: op.username,
            displayName: brandProfile.brandName,
            profileUrl: op.url,
            description: `Official verified ${op.platform.toUpperCase()} asset for ${brandProfile.brandName}.`,
            externalUrls: brandProfile.officialUrls,
            verificationStatus: 'verified',
            discoveredAt: new Date().toISOString(),
            source: 'Authoritative Digital Fingerprint Registry',
            isDemoData: false,
          });
        }
      }
    }

    // Step 2: Run Full Candidate Analysis (Identity, URL intelligence, Logo check, Risk scoring)
    const analyzedCandidates = await analyzeAllSocialCandidates(
      candidatesToAnalyze,
      brandProfile
    );

    // Step 3: Persist candidates in SocialStore
    SocialStore.saveCandidateAnalyses(analyzedCandidates);

    // Step 4: Record Scan History
    const highCritical = analyzedCandidates.filter(
      (c) => c.risk.riskLevel === 'CRITICAL' || c.risk.riskLevel === 'HIGH'
    ).length;

    const scanRecord: SocialScanRecord = {
      id: `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      brandId: brandProfile.id,
      brandName: brandProfile.brandName,
      status: 'completed',
      totalCandidates: analyzedCandidates.length,
      highCriticalCount: highCritical,
      queryVariants: discoveryResult.generatedVariants,
      providersUsed: discoveryResult.providerResults,
      executionMs: Date.now() - startTime,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
    };

    SocialStore.saveScan(scanRecord);

    return NextResponse.json({
      success: true,
      scan: scanRecord,
      brandProfile,
      fingerprint: brandProfile.fingerprint,
      totalCandidates: analyzedCandidates.length,
      highCriticalCount: highCritical,
      candidates: analyzedCandidates,
      generatedVariants: discoveryResult.generatedVariants,
      providerBreakdown: discoveryResult.providerResults,
      executionMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('[API Social Scan] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Social media monitoring scan failed.' },
      { status: 500 }
    );
  }
}
