/**
 * SAFENET API Route: GET & PATCH /api/social/candidates/[id]
 * Retrieves deep investigation evidence for a candidate, and updates threat status (watchlist/reviewed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidate = SocialStore.getCandidateById(id);

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve candidate.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status } = body;

    const validStatuses = ['new', 'reviewed', 'watchlist', 'confirmed_threat'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = SocialStore.updateCandidateStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found.' },
        { status: 404 }
      );
    }

    const item = SocialStore.getCandidateById(id);

    return NextResponse.json({
      success: true,
      candidate: item,
      message: `Candidate status updated to "${status}".`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update candidate status.' },
      { status: 500 }
    );
  }
}
