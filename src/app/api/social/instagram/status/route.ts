/**
 * SAFENET API Route: GET /api/social/instagram/status
 * 
 * Inspects server-side Meta Instagram credential readiness and capabilities.
 * Strictly never exposes API keys or access tokens in response.
 */

import { NextResponse } from 'next/server';
import { globalMetaInstagramClient } from '@/lib/social/meta-instagram-client';

export async function GET() {
  try {
    const readiness = await globalMetaInstagramClient.checkCredentialReadiness();
    return NextResponse.json({
      success: true,
      readiness,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to inspect Instagram credential readiness.',
      },
      { status: 500 }
    );
  }
}
