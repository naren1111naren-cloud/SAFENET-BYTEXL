/**
 * SAFENET Development Mock Provider
 * Generates synthetic candidate profiles for local testing & UI verification.
 * 
 * STRICT INTEGRITY RULE:
 * Every single mock record is explicitly marked with `isDemoData: true`
 * and source "SAFENET DEMO DATA". It is NEVER represented as real internet telemetry.
 */

import { BrandIdentityProfile, SocialCandidate, SocialProviderResult } from '../types';
import { SocialCandidateProvider } from './baseProvider';

export class DemoSocialProvider implements SocialCandidateProvider {
  platform = 'twitter' as const; // primary default; generates across platforms
  name = 'SAFENET Local Synthetic Demo Generator';

  isConfigured(): boolean {
    return process.env.SOCIAL_MONITORING_DEMO_MODE === 'true';
  }

  async searchBrandCandidates(
    brandProfile: BrandIdentityProfile,
    searchQueries: string[]
  ): Promise<SocialProviderResult> {
    const start = Date.now();
    const brand = brandProfile.brandName || 'Brand';
    const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDomain = brandProfile.officialDomain.toLowerCase().replace(/^www\./, '');

    const candidates: SocialCandidate[] = [
      // 1. Critical Risk: Support & Refund Impersonator on X (Twitter)
      {
        id: `demo-x-support-${cleanBrand}`,
        platform: 'twitter',
        candidateId: `demo_x_99812`,
        username: `@${cleanBrand}_support_24x7`,
        displayName: `[DEMO DATA] ${brand} Support & Resolution Desk`,
        profileUrl: `https://x.com/${cleanBrand}_support_24x7`,
        profileImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
        description: `Official 24/7 online grievance and refund resolution desk for ${brand}. DM us for immediate transaction recovery, UPI failure complaints, and quick reversal. Not affiliated with branch staff.`,
        externalUrls: [`https://${cleanBrand}-helpdesk-refund.top/portal/login`],
        followers: 412,
        verificationStatus: 'unverified',
        discoveredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
        rawMetadata: {
          note: 'Synthetic impersonation pattern: customer support claim + urgency + high-risk TLD lookalike',
          searchQuery: `${brand} Support`,
        },
      },

      // 2. High Risk: Fake KYC Verification Account on Instagram
      {
        id: `demo-ig-kyc-${cleanBrand}`,
        platform: 'instagram',
        candidateId: `demo_ig_44102`,
        username: `@${cleanBrand}_official_kyc`,
        displayName: `[DEMO DATA] ${brand} KYC & Account Update`,
        profileUrl: `https://instagram.com/${cleanBrand}_official_kyc`,
        profileImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80',
        description: `⚠️ MANDATORY KYC ALERT: Verify your ${brand} profile within 24 hours to avoid account suspension. Click link below to submit documentation.`,
        externalUrls: [`https://secure-${cleanBrand}-verification.online/verify`],
        followers: 1250,
        verificationStatus: 'unverified',
        discoveredAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
        rawMetadata: {
          note: 'Synthetic impersonation pattern: urgent threat of suspension + external credential harvesting link',
          searchQuery: `${brand} Official`,
        },
      },

      // 3. High Risk: YouTube Phishing / Scam Channel
      {
        id: `demo-yt-channel-${cleanBrand}`,
        platform: 'youtube',
        candidateId: `demo_yt_channel_889`,
        username: `@${cleanBrand}CustomerCareLive`,
        displayName: `[DEMO DATA] ${brand} Customer Helpline & Offers`,
        profileUrl: `https://youtube.com/@${cleanBrand}CustomerCareLive`,
        profileImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        description: `Get instant cashback vouchers, loans, and technical help directly from ${brand} officers. Contact our toll-free WhatsApp helpline: +91 98765 43210.`,
        externalUrls: [`https://${cleanBrand}rewards-claim.xyz`],
        followers: 8900,
        verificationStatus: 'unverified',
        discoveredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
        rawMetadata: {
          note: 'Synthetic impersonation pattern: fake promotional offers + WhatsApp helpline + lookalike URL',
          searchQuery: `${brand} Helpline`,
        },
      },

      // 4. Medium Risk: Unofficial LinkedIn Corporate Page
      {
        id: `demo-li-careers-${cleanBrand}`,
        platform: 'linkedin',
        candidateId: `demo_li_org_7761`,
        username: `${cleanBrand}-hiring-desk`,
        displayName: `[DEMO DATA] ${brand} Talent & Operations Hub`,
        profileUrl: `https://linkedin.com/company/${cleanBrand}-hiring-desk`,
        description: `Independent recruiter and workforce affiliate representing ${brand} career drives and contract recruitment. Unofficial affiliate portal.`,
        externalUrls: [`https://careers-${cleanBrand}-workforce.com`],
        followers: 240,
        verificationStatus: 'unverified',
        discoveredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
        rawMetadata: {
          note: 'Synthetic impersonation pattern: recruitment/employment affiliation + non-official domain',
          searchQuery: `${brand} Careers`,
        },
      },

      // 5. Low Risk: Official Brand Handle (matches registered official handle)
      {
        id: `demo-x-official-${cleanBrand}`,
        platform: 'twitter',
        candidateId: `demo_x_official_1`,
        username: brandProfile.officialSocialHandles?.twitter
          ? brandProfile.officialSocialHandles.twitter
          : `@${cleanBrand}`,
        displayName: `[DEMO DATA] ${brand}`,
        profileUrl: `https://x.com/${(brandProfile.officialSocialHandles?.twitter || cleanBrand).replace(/^@/, '')}`,
        description: `The official X account of ${brand}. Welcome to our official feed. Visit ${cleanDomain} for verified services and inquiries.`,
        externalUrls: [`https://${cleanDomain}`],
        followers: 1850000,
        verificationStatus: 'verified',
        discoveredAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
        rawMetadata: {
          note: 'Synthetic official baseline: matches registered official handles & official domain',
          searchQuery: brand,
        },
      },
    ];

    return {
      platform: this.platform,
      provider: this.name,
      status: 'connected',
      candidates,
      queryCount: searchQueries.length,
      executionMs: Date.now() - start,
    };
  }
}
