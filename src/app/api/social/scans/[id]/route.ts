/**
 * SAFENET API Route: GET /api/social/scans/[id]
 * Retrieves details for a specific social media scan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scans = SocialStore.getScans();
    const scan = scans.find((s) => s.id === id);

    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan record not found.' },
        { status: 404 }
      );
    }

    const candidates = SocialStore.getCandidates({ brandId: scan.brandId });

    return NextResponse.json({
      success: true,
      scan,
      candidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve scan.' },
      { status: 500 }
    );
  }
}
