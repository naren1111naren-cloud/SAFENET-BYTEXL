/**
 * SAFENET API Route: POST /api/brands & GET /api/brands
 * Manages confirmed authoritative brand identity baseline in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandProfile } from '@/types/brand';
import { supabaseClient } from '@/lib/supabase/client';
import {
  DbBrand,
  DbBrandDomain,
  DbBrandSocialProfile,
  DbBrandApplication,
  DbBrandAlias,
} from '@/lib/supabase/types';

// In-memory fallback cache for resilience
let activeBrandBaseline: BrandProfile | null = null;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domainQuery = url.searchParams.get('domain');

  // Try retrieving from Supabase first
  if (supabaseClient.getIsConfigured()) {
    const targetDomain = domainQuery || activeBrandBaseline?.domain;
    if (targetDomain) {
      const dbBaseline = await supabaseClient.getFullBrandBaseline(targetDomain);
      if (dbBaseline && dbBaseline.brand) {
        const handles: Record<string, string> = {};
        for (const s of dbBaseline.socialProfiles) {
          if (s.status === 'official') {
            handles[s.platform] = s.username;
          }
        }

        const profile: BrandProfile = {
          id: dbBaseline.brand.id || `brand-${dbBaseline.brand.name.toLowerCase()}`,
          name: dbBaseline.brand.name,
          domain: dbBaseline.brand.domain,
          officialDomains: dbBaseline.domains.map((d) => d.domain),
          handles,
          authorizedAppIds: dbBaseline.applications.map((a) => a.package_id || a.name).filter(Boolean),
          appPackageName: dbBaseline.applications[0]?.package_id || undefined,
          officialDevelopers: [dbBaseline.brand.name],
          brandKeywords: dbBaseline.aliases.map((a) => a.alias),
          logoUrl: dbBaseline.brand.logo_url || undefined,
          aliases: dbBaseline.aliases.map((a) => a.alias),
          createdAt: dbBaseline.brand.created_at || new Date().toISOString(),
          updatedAt: dbBaseline.brand.updated_at || new Date().toISOString(),
        };

        return NextResponse.json({
          status: 'confirmed',
          source: 'supabase',
          brand: profile,
        });
      }
    }
  }

  if (!activeBrandBaseline) {
    return NextResponse.json(
      { status: 'not_configured', message: 'No authoritative brand baseline has been confirmed yet.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: 'confirmed',
    source: 'memory_cache',
    brand: activeBrandBaseline,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      domain,
      officialDomains = [],
      handles = {},
      appPackageName,
      authorizedAppIds = [],
      officialDevelopers = [],
      brandKeywords = [],
      officialSupportChannels = [],
      logoUrl,
      aliases = [],
      confirmedFields,
    } = body;

    const brandName = (name || confirmedFields?.name || '').trim();
    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required.' },
        { status: 400 }
      );
    }

    const primaryDomain = (domain || confirmedFields?.domain || '').toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!primaryDomain) {
      return NextResponse.json(
        { error: 'Primary domain is required.' },
        { status: 400 }
      );
    }

    const domainList = Array.from(new Set([primaryDomain, ...(officialDomains || confirmedFields?.officialDomains || [])].filter(Boolean)));
    const appsList = Array.from(new Set([appPackageName, ...(authorizedAppIds || confirmedFields?.authorizedAppIds || [])].filter(Boolean)));
    const activeHandles = handles || confirmedFields?.handles || {};
    const devList = officialDevelopers.length > 0 ? officialDevelopers : (confirmedFields?.officialDevelopers || [brandName]);
    const kwList = brandKeywords.length > 0 ? brandKeywords : (confirmedFields?.brandKeywords || [brandName]);
    const aliasList = Array.from(new Set([brandName, ...(aliases || confirmedFields?.aliases || [])])).filter(Boolean);

    const profile: BrandProfile = {
      id: `brand-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: brandName,
      domain: primaryDomain,
      officialDomains: domainList,
      handles: activeHandles,
      appPackageName: appPackageName || confirmedFields?.appPackageName,
      authorizedAppIds: appsList,
      officialDevelopers: devList,
      brandKeywords: kwList,
      officialSupportChannels: officialSupportChannels || confirmedFields?.officialSupportChannels || [],
      logoUrl: logoUrl || confirmedFields?.logoUrl,
      aliases: aliasList,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activeBrandBaseline = profile;

    // Persist to Supabase if configured
    let supabasePersisted = false;
    if (supabaseClient.getIsConfigured()) {
      try {
        const dbBrand = await supabaseClient.upsertBrand({
          name: brandName,
          domain: primaryDomain,
          logo_url: logoUrl || null,
          description: `Authoritative brand identity for ${brandName}`,
          status: 'active',
        });

        if (dbBrand && dbBrand.id) {
          const brandId = dbBrand.id;

          // 1. Sync Domains
          const dbDomains: DbBrandDomain[] = domainList.map((d) => ({
            brand_id: brandId,
            domain: d,
            is_primary: d === primaryDomain,
            status: 'official',
            source: 'analyst_confirmed_baseline',
            confidence: 'high',
          }));
          await supabaseClient.syncBrandDomains(brandId, dbDomains);

          // 2. Sync Social Profiles
          const dbSocials: DbBrandSocialProfile[] = Object.entries(activeHandles)
            .filter(([_, handle]) => Boolean(handle))
            .map(([platform, handle]) => ({
              brand_id: brandId,
              platform,
              url: `https://${platform}.com/${String(handle).replace(/^@/, '')}`,
              username: String(handle),
              status: 'official',
              source: 'analyst_confirmed_baseline',
              confidence: 'high',
            }));
          await supabaseClient.syncBrandSocialProfiles(brandId, dbSocials);

          // 3. Sync Applications
          const dbApps: DbBrandApplication[] = appsList.map((appId) => ({
            brand_id: brandId,
            name: appId,
            store: appId.startsWith('id') ? 'Apple App Store' : 'Google Play',
            store_url: appId.startsWith('id')
              ? `https://apps.apple.com/app/${appId}`
              : `https://play.google.com/store/apps/details?id=${appId}`,
            package_id: appId,
            developer: devList[0] || brandName,
            status: 'official',
            source: 'analyst_confirmed_baseline',
            confidence: 'high',
          }));
          await supabaseClient.syncBrandApplications(brandId, dbApps);

          // 4. Sync Aliases
          const dbAliases: DbBrandAlias[] = aliasList.map((a) => ({
            brand_id: brandId,
            alias: a,
            source: 'analyst_confirmed_baseline',
            confidence: 'high',
          }));
          await supabaseClient.syncBrandAliases(brandId, dbAliases);

          supabasePersisted = true;
          console.log(`[Supabase Persistence] Brand "${brandName}" and associated assets committed to Supabase.`);
        }
      } catch (dbErr) {
        console.warn('[Supabase Persistence] Non-fatal error persisting to Supabase:', dbErr);
      }
    }

    console.log(`[Brand Intelligence] Confirmed authoritative baseline for brand "${brandName}" (${primaryDomain})`);

    return NextResponse.json({
      status: 'confirmed',
      message: 'Brand identity baseline successfully confirmed and stored as ground truth.',
      supabasePersisted,
      brand: profile,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to confirm brand profile: ${errorMsg}` },
      { status: 500 }
    );
  }
}
