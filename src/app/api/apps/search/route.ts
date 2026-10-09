/**
 * SAFENET API Route: POST /api/apps/search
 * Queries Google Play via SerpApi with server-side API key protection,
 * normalizes store listings, and calculates deterministic impersonation risk.
 */

import { NextRequest, NextResponse } from 'next/server';
import { appStoreService } from '@/lib/apps/app-store-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, country = 'in', brandContext, scanVariants = false } = body;

    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return NextResponse.json(
        { error: 'App or brand search query is required.' },
        { status: 400 }
      );
    }

    if (!appStoreService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'SerpApi API key is not configured on the backend (SERPAPI_KEY).',
          providerStatus: 'not_configured',
        },
        { status: 503 }
      );
    }

    const searchResponse = await appStoreService.searchGooglePlay(cleanQuery, {
      country,
      brandContext,
      scanVariants,
    });

    return NextResponse.json(searchResponse);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API Apps Search] Failure:', error);
    return NextResponse.json(
      { error: `Google Play threat intelligence search failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
