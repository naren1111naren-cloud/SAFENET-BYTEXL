/**
 * SAFENET API Route: GET /api/social/brands & POST /api/social/brands
 * Manages monitored brand identity profiles for social impersonation protection.
 * Supports single-field brand input ("Nike") with autonomous discovery of official identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';
import { BrandIdentityProfile } from '@/lib/social/types';
import { normalizeUrlInput } from '@/lib/intelligence/url-normalizer';
import { globalBrandDiscoveryService } from '@/lib/social/brand-discovery';
import { buildBrandIdentityFingerprint } from '@/lib/social/identity-fingerprint';

export async function GET() {
  try {
    const brands = SocialStore.getBrands();
    return NextResponse.json({
      success: true,
      brands,
      total: brands.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list monitored brands.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      brandName,
      officialWebsite,
      officialSocialHandles = {},
      aliases = [],
      brandKeywords = [],
      knownDomains = [],
      officialDescription,
      logo,
    } = body;

    const cleanName = (brandName || '').trim();
    if (!cleanName) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required.' },
        { status: 400 }
      );
    }

    // If officialWebsite is not provided, autonomously discover it from brand name
    const cleanWebsite = (officialWebsite || '').trim();
    if (!cleanWebsite) {
      const discovery = await globalBrandDiscoveryService.discoverBrandIdentity(cleanName);
      const fingerprint = buildBrandIdentityFingerprint(discovery);

      if (discovery.isIdentityEstablished && discovery.profile) {
        const profile: BrandIdentityProfile = {
          ...discovery.profile,
          fingerprint: fingerprint || undefined,
        };
        const saved = SocialStore.saveBrand(profile);
        return NextResponse.json({
          success: true,
          brand: saved,
          fingerprint,
          discovery,
          isIdentityEstablished: true,
          message: `Autonomously discovered trusted identity for "${cleanName}".`,
        });
      } else {
        const unverifiedBrand: BrandIdentityProfile = {
          id: `brand-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          brandName: cleanName,
          officialDomain: '',
          officialUrls: [],
          officialSocialHandles: {},
          aliases: [],
          brandKeywords: [],
          knownDomains: [],
          officialDescription: 'No verified official identity established.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const saved = SocialStore.saveBrand(unverifiedBrand);
        return NextResponse.json({
          success: true,
          brand: saved,
          fingerprint: null,
          discovery,
          isIdentityEstablished: false,
          message: discovery.statusMessage,
        });
      }
    }

    const norm = normalizeUrlInput(cleanWebsite);
    const domain =
      norm.data?.registrableDomain ||
      cleanWebsite.replace(/^[a-zA-Z]+:\/\//, '').split('/')[0].replace(/^www\./, '');

    const profile: BrandIdentityProfile = {
      id: `brand-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      brandName: cleanName,
      officialDomain: domain,
      officialUrls: norm.data?.normalizedUrl ? [norm.data.normalizedUrl] : [cleanWebsite],
      officialSocialHandles: {
        youtube: officialSocialHandles.youtube?.trim() || undefined,
        twitter: officialSocialHandles.twitter?.trim() || undefined,
        instagram: officialSocialHandles.instagram?.trim() || undefined,
        facebook: officialSocialHandles.facebook?.trim() || undefined,
        linkedin: officialSocialHandles.linkedin?.trim() || undefined,
        telegram: officialSocialHandles.telegram?.trim() || undefined,
      },
      aliases: Array.isArray(aliases) && aliases.length > 0 ? aliases.filter(Boolean) : [cleanName],
      logo: logo || null,
      brandKeywords: Array.isArray(brandKeywords) && brandKeywords.length > 0 ? brandKeywords.filter(Boolean) : [cleanName],
      knownDomains: Array.isArray(knownDomains) && knownDomains.length > 0 ? knownDomains : [domain],
      officialDescription: officialDescription?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Build fingerprint for the profile
    const discovery = await globalBrandDiscoveryService.discoverBrandIdentity(cleanName, cleanWebsite);
    profile.fingerprint = buildBrandIdentityFingerprint(discovery) || undefined;

    const saved = SocialStore.saveBrand(profile);

    return NextResponse.json({
      success: true,
      brand: saved,
      fingerprint: profile.fingerprint,
      message: `Brand "${cleanName}" registered for social media monitoring.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save brand profile.' },
      { status: 500 }
    );
  }
}
