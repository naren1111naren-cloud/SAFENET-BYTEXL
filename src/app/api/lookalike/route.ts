/**
 * SAFENET API Route: /api/lookalike
 * Evaluates candidate names, handles, and URLs against brand profiles
 * using multi-metric similarity, Unicode normalization, and contextual risk scoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile } from '@/types/brand';
import { assessLookalikeRisk } from '@/lib/similarity/lookalike-risk-engine';
import { LookalikeReviewStore } from '@/lib/similarity/review-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      candidateName,
      input,
      brandName = 'Paytm',
      platform,
      profileUrl,
      developer,
      appId,
      description,
      isVerifiedBadge,
    } = body;

    const rawCandidate = (candidateName || input || '').trim();
    if (!rawCandidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate name or input string is required.' },
        { status: 400 }
      );
    }

    // Resolve brand profile
    const targetBrand: BrandProfile =
      PRESET_BRANDS[brandName] || {
        id: `brand-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: brandName,
        domain: `${brandName.toLowerCase()}.com`,
        handles: { twitter: `@${brandName}` },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    const assessment = assessLookalikeRisk(
      {
        name: rawCandidate,
        username: rawCandidate.startsWith('@') ? rawCandidate : undefined,
        platform,
        profileUrl,
        developer,
        appId,
        description,
        isVerifiedBadge,
      },
      targetBrand
    );

    // Check if an analyst review already exists
    const existingReview = LookalikeReviewStore.getReviewForCandidate(rawCandidate, targetBrand.name);

    return NextResponse.json({
      success: true,
      assessment,
      existingReview,
      brand: {
        id: targetBrand.id,
        name: targetBrand.name,
        domain: targetBrand.domain,
        handles: targetBrand.handles,
      },
    });
  } catch (error: any) {
    console.error('[SAFENET] Lookalike evaluation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Look-alike evaluation failed.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const brand = url.searchParams.get('brand') || undefined;

    const reviews = LookalikeReviewStore.getReviews(brand);

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews: reviews.length,
      legitimateCount: reviews.filter((r) => r.decision === 'legitimate').length,
      suspiciousCount: reviews.filter((r) => r.decision === 'suspicious').length,
      confirmedImpersonationCount: reviews.filter((r) => r.decision === 'confirmed_impersonation').length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list look-alike reviews.' },
      { status: 500 }
    );
  }
}
