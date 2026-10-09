/**
 * SAFENET API Route: GET & DELETE /api/social/brands/[id]
 * Manages an individual monitored brand identity profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = SocialStore.getBrandById(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Monitored brand not found.' },
        { status: 404 }
      );
    }

    const scans = SocialStore.getScans(id);
    const candidates = SocialStore.getCandidates({ brandId: id });

    return NextResponse.json({
      success: true,
      brand,
      stats: {
        totalScans: scans.length,
        totalCandidates: candidates.length,
        highCriticalCount: candidates.filter((c) => c.risk.riskLevel === 'CRITICAL' || c.risk.riskLevel === 'HIGH').length,
        watchlistCount: candidates.filter((c) => c.status === 'watchlist').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve brand profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    SocialStore.deleteBrand(id);

    return NextResponse.json({
      success: true,
      message: 'Monitored brand profile deleted.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete brand profile.' },
      { status: 500 }
    );
  }
}
