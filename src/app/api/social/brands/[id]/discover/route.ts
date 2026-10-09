/**
 * SAFENET API Route: POST /api/social/brands/[id]/discover
 * Autonomously discovers the official digital identity, official website,
 * social profiles, and generates the Brand Identity Fingerprint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialStore } from '@/lib/social/social-store';
import { globalBrandDiscoveryService } from '@/lib/social/brand-discovery';
import { buildBrandIdentityFingerprint } from '@/lib/social/identity-fingerprint';
import { BrandIdentityProfile } from '@/lib/social/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { brandName, officialWebsite } = body;

    const brand = SocialStore.getBrandById(id);
    const queryName = brandName || brand?.brandName;

    if (!queryName) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required for identity discovery.' },
        { status: 400 }
      );
    }

    const discoveryResult = await globalBrandDiscoveryService.discoverBrandIdentity(
      queryName,
      officialWebsite || brand?.officialDomain
    );

    const fingerprint = buildBrandIdentityFingerprint(discoveryResult);

    if (discoveryResult.isIdentityEstablished && discoveryResult.profile) {
      // Update brand profile with discovered baseline and fingerprint
      const updatedProfile = {
        ...(brand || discoveryResult.profile),
        id: brand?.id || discoveryResult.profile.id,
        brandName: discoveryResult.brandName,
        officialDomain: discoveryResult.officialDomain || '',
        officialUrls: discoveryResult.officialWebsite ? [discoveryResult.officialWebsite] : [],
        officialSocialHandles: discoveryResult.profile.officialSocialHandles,
        aliases: discoveryResult.aliases,
        brandKeywords: discoveryResult.brandKeywords,
        fingerprint: fingerprint || undefined,
        updatedAt: new Date().toISOString(),
      };

      SocialStore.saveBrand(updatedProfile);

      return NextResponse.json({
        success: true,
        discovery: discoveryResult,
        fingerprint,
        brand: updatedProfile,
        isIdentityEstablished: true,
        message: `Trusted brand identity and fingerprint established for "${queryName}".`,
      });
    } else {
      const unverifiedProfile: BrandIdentityProfile = {
        id: brand?.id || `brand-${queryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        brandName: queryName,
        officialDomain: '',
        officialUrls: [],
        officialSocialHandles: {},
        aliases: [],
        brandKeywords: [],
        knownDomains: [],
        createdAt: brand?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      SocialStore.saveBrand(unverifiedProfile);

      return NextResponse.json({
        success: true,
        discovery: discoveryResult,
        fingerprint: null,
        brand: unverifiedProfile,
        isIdentityEstablished: false,
        message: discoveryResult.statusMessage,
      });
    }
  } catch (error: any) {
    console.error('[API Brand Discover] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Brand discovery failed.' },
      { status: 500 }
    );
  }
}
