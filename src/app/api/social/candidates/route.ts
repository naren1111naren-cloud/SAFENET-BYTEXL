/**
 * SAFENET API Route: GET /api/social/candidates
 * Lists candidate social profiles with multi-parameter filtering:
 * platform, risk level, status, brand ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const brandId = url.searchParams.get('brandId') || undefined;
    const platform = url.searchParams.get('platform') || undefined;
    const riskLevel = url.searchParams.get('riskLevel') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const candidates = SocialStore.getCandidates({
      brandId,
      platform,
      riskLevel,
      status,
    });

    const highCritical = candidates.filter(
      (c) => c.risk.riskLevel === 'CRITICAL' || c.risk.riskLevel === 'HIGH'
    ).length;

    return NextResponse.json({
      success: true,
      candidates,
      total: candidates.length,
      highCriticalCount: highCritical,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list candidates.' },
      { status: 500 }
    );
  }
}
