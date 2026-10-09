/**
 * SAFENET API Route: /api/lookalike/review
 * Records analyst review decisions: legitimate, suspicious, confirmed_impersonation
 */

import { NextRequest, NextResponse } from 'next/server';
import { LookalikeReviewStore, ReviewDecisionType } from '@/lib/similarity/review-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      brandId,
      brandName = 'Paytm',
      candidateName,
      platform,
      profileUrl,
      decision,
      similarityScore = 0,
      riskScore = 0,
      variationType = 'unknown',
      notes = '',
      reviewedBy = 'SOC Analyst (L2)',
    } = body;

    if (!candidateName) {
      return NextResponse.json(
        { success: false, error: 'Candidate name is required.' },
        { status: 400 }
      );
    }

    const validDecisions: ReviewDecisionType[] = ['legitimate', 'suspicious', 'confirmed_impersonation'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { success: false, error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    const record = await LookalikeReviewStore.recordDecision({
      brandId: brandId || brandName,
      brandName,
      candidateName,
      platform,
      profileUrl,
      decision,
      similarityScore: Number(similarityScore),
      riskScore: Number(riskScore),
      variationType,
      notes,
      reviewedBy,
    });

    return NextResponse.json({
      success: true,
      record,
      message: `Decision successfully recorded: candidate marked as "${decision}".`,
    });
  } catch (error: any) {
    console.error('[SAFENET] Review submission error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit review decision.' },
      { status: 500 }
    );
  }
}
