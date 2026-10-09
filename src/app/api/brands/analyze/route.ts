/**
 * SAFENET API Route: POST /api/brands/analyze
 * Real-time server-side official website analysis & identity extraction.
 * Enforces SSRF defense, controlled timeouts, bounded HTML parsing, evidence provenance,
 * and auditable run recording in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizeUrlInput } from '@/lib/intelligence/url-normalizer';
import { validateSafeTarget } from '@/lib/intelligence/safe-target';
import { inspectHttpEndpoint } from '@/lib/intelligence/http-inspector';
import { analyzeWebsiteIdentity } from '@/lib/analyzers/website-identity-analyzer';
import { WebSearchProvider } from '@/lib/providers/search/search-provider';
import { supabaseClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const body = await req.json();
    const { brandName, officialWebsite } = body;

    // 1. Input Validation
    const cleanBrandName = (brandName || '').trim();
    if (!cleanBrandName) {
      return NextResponse.json(
        { error: 'Brand name is required.' },
        { status: 400 }
      );
    }

    const rawWebsite = (officialWebsite || '').trim();
    if (!rawWebsite) {
      return NextResponse.json(
        { error: 'Official website URL or domain is required.' },
        { status: 400 }
      );
    }

    // 2. URL Normalization
    const normalized = normalizeUrlInput(rawWebsite);
    if (!normalized.isValid || !normalized.data) {
      return NextResponse.json(
        { error: normalized.error || 'Invalid official website URL format.' },
        { status: 400 }
      );
    }

    const { hostname, normalizedUrl } = normalized.data;

    // 3. SSRF & Safety Protection
    const safety = await validateSafeTarget(hostname);
    if (!safety.isSafe) {
      return NextResponse.json(
        {
          error: `Website inspection blocked for security: ${safety.blockedReason || 'Prohibited network destination.'}`,
          ssrfBlocked: true,
        },
        { status: 400 }
      );
    }

    console.log(`[Brand Intelligence] Inspecting authoritative website: ${normalizedUrl} for brand "${cleanBrandName}"...`);

    // 4. Controlled HTTP Inspection (Safe redirects, bounded body, timeout)
    const inspection = await inspectHttpEndpoint(normalizedUrl, 5000);

    if (!inspection.isAccessible) {
      // Record failed run if Supabase configured
      if (supabaseClient.getIsConfigured()) {
        await supabaseClient.recordAnalysisRun({
          target_website: normalizedUrl,
          brand_name_query: cleanBrandName,
          status: 'failed',
          signals: [],
          provider_status: { error: inspection.error },
          raw_metadata: {},
          error_message: inspection.error,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        {
          status: 'website_unreachable',
          error: inspection.error || `Unable to establish connection to ${normalizedUrl}.`,
          inspectionDetails: {
            statusCode: inspection.statusCode,
            redirectCount: inspection.redirectCount,
            durationMs: inspection.durationMs,
          },
        },
        { status: 502 }
      );
    }

    // 5. Real-Time Identity Extraction from Retrieved HTML
    const identity = analyzeWebsiteIdentity({
      html: inspection.rawBodySnippet || '',
      targetUrl: normalizedUrl,
      finalUrl: inspection.finalUrl,
      brandNameInput: cleanBrandName,
      statusCode: inspection.statusCode,
    });

    // 6. Optional Search Discovery Check (Layer 2 Signals)
    const searchProvider = new WebSearchProvider();
    const searchHealth = await searchProvider.checkHealth();
    let searchCandidateNotes: string | undefined = undefined;

    if (searchHealth.status === 'not_configured') {
      searchCandidateNotes = 'External web search provider not configured (SEARCH_PROVIDER_API_KEY). Search discovery omitted.';
    }

    // 7. Supabase Database Health & Run Persistence
    const supabaseHealth = await supabaseClient.checkHealth();
    let recordedRunId: string | undefined = undefined;

    if (supabaseClient.getIsConfigured()) {
      try {
        const runRecord = await supabaseClient.recordAnalysisRun({
          target_website: normalizedUrl,
          brand_name_query: cleanBrandName,
          status: 'completed',
          signals: identity.signals,
          provider_status: {
            statusCode: inspection.statusCode,
            redirectCount: inspection.redirectCount,
            durationMs: inspection.durationMs,
          },
          raw_metadata: {
            title: identity.description,
            logoUrl: identity.logoUrl,
            canonicalDomain: identity.canonicalDomain,
          },
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        });
        if (runRecord && runRecord.id) {
          recordedRunId = runRecord.id;
        }
      } catch (dbErr) {
        console.warn('[Supabase Run Recording] Non-fatal log failure:', dbErr);
      }
    }

    // 8. Assemble Structured Intelligence Payload
    const providerStatus = {
      websiteAnalyzer: {
        status: 'connected',
        targetUrl: normalizedUrl,
        finalUrl: inspection.finalUrl,
        statusCode: inspection.statusCode,
        redirectCount: inspection.redirectCount,
        durationMs: inspection.durationMs,
        hstsActive: inspection.securityHeaders.hasHsts,
      },
      database: {
        status: supabaseHealth.connected ? (supabaseHealth.schemaStatus === 'migrated' ? 'connected' : 'pending_migration') : 'not_configured',
        schemaStatus: supabaseHealth.schemaStatus,
        message: supabaseHealth.message,
      },
      searchDiscovery: {
        status: searchHealth.status,
        message: searchCandidateNotes || searchHealth.message,
      },
    };

    return NextResponse.json({
      status: 'ready_for_review',
      analysisRunId: recordedRunId,
      brand: {
        name: identity.brandName,
        legalName: identity.legalName,
        website: identity.officialWebsite,
        domain: identity.canonicalDomain,
        logo: identity.logoUrl,
        logoSource: identity.logoSource,
        logoConfidence: identity.logoConfidence,
        description: identity.description,
        aliases: identity.aliases,
      },
      domains: identity.domains,
      socialProfiles: identity.socialProfiles,
      applications: identity.applications,
      signals: identity.signals,
      evidence: identity.evidence,
      providerStatus,
      discoveredAt: identity.discoveredAt,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Brand Intelligence] Error analyzing brand website:', error);
    return NextResponse.json(
      { error: `Internal error analyzing brand website: ${errorMsg}` },
      { status: 500 }
    );
  }
}
