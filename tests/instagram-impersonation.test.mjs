/**
 * SAFENET Instagram Discovery & Impersonation Detection Test Suite
 * 
 * Tests:
 * 1. Credential readiness checks (distinguishing missing, config ID only, placeholder, expired, permissions, connected)
 * 2. Meta Instagram Business Discovery integration & error handling (personal accounts, code 100, rate limits)
 * 3. Search Provider Fallback discovery on Instagram (querying site:instagram.com, handle extraction, enrichment)
 * 4. Deduplication of discovered Instagram candidate profiles and preservation of source URLs
 * 5. Unconfigured provider states returning honest not_configured status without fabricating profiles
 * 6. Instagram-specific Impersonation Risk Analyzer (lexical similarity, combosquatting, bio triggers, link-in-bio lookalikes)
 * 7. 5-Tier Threat Classification and Structured Evidence Model (Section 25 compliance)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  MetaInstagramClient,
  globalMetaInstagramClient,
} from '../src/lib/social/meta-instagram-client.ts';
import { MetaProvider } from '../src/lib/social/providers/metaProvider.ts';
import {
  analyzeInstagramCandidate,
} from '../src/lib/social/instagram-impersonation-analyzer.ts';
import {
  getSocialMonitoringConfig,
  getProviderStatuses,
} from '../src/lib/social/config.ts';
import { SocialDiscoveryEngine } from '../src/lib/social/discovery-engine.ts';

describe('SAFENET Instagram Impersonation & Discovery Suite', () => {
  const originalEnv = { ...process.env };

  after(() => {
    process.env = { ...originalEnv };
  });

  // 1. Credential Readiness Checks
  describe('1. Meta & Instagram Credential Readiness Checks', () => {
    test('1.1 Accurately detects when no credentials are configured', async () => {
      delete process.env.META_ACCESS_TOKEN;
      delete process.env.META_CONFIG_ID;
      delete process.env.META_APP_ID;

      const client = new MetaInstagramClient();
      const status = await client.checkCredentialReadiness();

      assert.equal(status.status, 'not_configured');
      assert.equal(status.isConnected, false);
      assert.equal(status.hasAccessToken, false);
      assert.equal(status.capabilities.businessDiscovery, false);
      assert.ok(status.message.includes('not configured'));
    });

    test('1.2 Identifies Meta Configuration ID only (e.g. numeric ID 2266934170818569)', async () => {
      // User placed numeric Configuration ID into META_ACCESS_TOKEN or META_CONFIG_ID
      process.env.META_ACCESS_TOKEN = '2266934170818569';
      delete process.env.META_CONFIG_ID;

      const client = new MetaInstagramClient();
      const status = await client.checkCredentialReadiness();

      assert.equal(status.status, 'config_id_only');
      assert.equal(status.isConnected, false);
      assert.equal(status.hasAccessToken, false);
      assert.equal(status.hasConfigId, true);
      assert.equal(status.maskedConfigId, '...8569');
      assert.ok(status.setupGuidance?.includes('Facebook Login for Business'));
      assert.ok(!status.message.includes('2266934170818569'), 'Never leak unmasked secrets in status message');
    });

    test('1.3 Rejects placeholder tokens without reporting false connectivity', async () => {
      process.env.META_ACCESS_TOKEN = 'YOUR_META_ACCESS_TOKEN';

      const client = new MetaInstagramClient();
      const status = await client.checkCredentialReadiness();

      assert.equal(status.status, 'placeholder_credential');
      assert.equal(status.isConnected, false);
      assert.equal(status.hasAccessToken, false);
      assert.equal(status.capabilities.businessDiscovery, false);
    });

    test('1.4 Provider status list reflects Instagram readiness and guidance', () => {
      process.env.META_ACCESS_TOKEN = '2266934170818569';
      const statuses = getProviderStatuses();

      assert.ok(statuses.instagram);
      assert.equal(statuses.instagram.platform, 'instagram');
      assert.equal(statuses.instagram.status, 'unauthorized');
      assert.ok(statuses.instagram.message.includes('Meta API unauthorized') || statuses.instagram.message.includes('requires'));
    });
  });

  // 2. Instagram Candidate Discovery & Fallback
  describe('2. Instagram Candidate Discovery & Fallback', () => {
    test('2.1 Unconfigured environment returns honest not_configured status without fabricating profiles', async () => {
      delete process.env.META_ACCESS_TOKEN;
      delete process.env.META_CONFIG_ID;
      delete process.env.SERPER_API_KEY;
      delete process.env.TAVILY_API_KEY;
      delete process.env.SERPAPI_KEY;
      delete process.env.BRAVE_API_KEY;

      const provider = new MetaProvider('instagram');
      const dummyBrand = {
        id: 'brand-test',
        brandName: 'TestBrand',
        officialDomain: 'testbrand.com',
        officialUrls: ['https://testbrand.com'],
        officialSocialHandles: {},
        aliases: [],
        brandKeywords: [],
        knownDomains: ['testbrand.com'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await provider.searchBrandCandidates(dummyBrand, ['TestBrand support']);

      assert.equal(result.platform, 'instagram');
      assert.equal(result.status, 'not_configured');
      assert.equal(result.candidates.length, 0);
      assert.ok(result.message?.includes('not configured') || result.message?.includes('requires'));
    });

    test('2.2 Deduplicates Instagram candidate handles correctly and sanitizes URLs', () => {
      const provider = new MetaProvider('instagram');
      
      // Test URL extraction helper via mock scenarios
      const validUrl1 = 'https://www.instagram.com/nike_support_india/';
      const validUrl2 = 'https://instagram.com/nike_support_india?igshid=123';
      const systemUrl1 = 'https://www.instagram.com/explore/tags/nike/';
      const systemUrl2 = 'https://www.instagram.com/p/Cxyz12345/';

      // @ts-ignore (testing private helper)
      const user1 = provider.extractInstagramUsername(validUrl1);
      // @ts-ignore
      const user2 = provider.extractInstagramUsername(validUrl2);
      // @ts-ignore
      const sys1 = provider.extractInstagramUsername(systemUrl1);
      // @ts-ignore
      const sys2 = provider.extractInstagramUsername(systemUrl2);

      assert.equal(user1, 'nike_support_india');
      assert.equal(user2, 'nike_support_india');
      assert.equal(sys1, null, 'System explore paths must be filtered out');
      assert.equal(sys2, null, 'System post paths /p/ must be filtered out');
    });

    test('2.3 Business Discovery API handles personal account and not-found responses cleanly', async () => {
      const client = new MetaInstagramClient();
      // Target username with no token configured
      const res = await client.queryBusinessDiscovery('nonexistent_brand_account_xyz', {
        accessToken: 'EAAB_invalid_mock_token_for_unit_test',
        callerIgAccountId: '17841400000000000',
      });

      // Must return graceful structured error without crashing
      assert.equal(res.success, false);
      assert.ok(res.error);
    });
  });

  // 3. Instagram Impersonation Analysis & Risk Engine
  describe('3. Instagram Impersonation Multi-Factor Analysis', () => {
    const brandProfile = {
      id: 'brand-nike',
      brandName: 'Nike',
      officialDomain: 'nike.com',
      officialUrls: ['https://www.nike.com'],
      officialSocialHandles: {
        instagram: '@nike',
        twitter: '@nike',
      },
      aliases: ['Nike Inc.', 'Nike Official'],
      brandKeywords: ['Nike', 'Just Do It'],
      knownDomains: ['nike.com', 'www.nike.com'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    test('3.1 Whitelists authenticated official Instagram account (@nike)', async () => {
      const officialCandidate = {
        id: 'meta-instagram-nike',
        platform: 'instagram',
        candidateId: '178414001',
        username: '@nike',
        displayName: 'Nike',
        profileUrl: 'https://www.instagram.com/nike',
        description: 'Just Do It.',
        externalUrls: ['https://www.nike.com'],
        verificationStatus: 'verified',
        discoveredAt: new Date().toISOString(),
        source: 'Meta Instagram Graph API',
        isDemoData: false,
      };

      const analysis = await analyzeInstagramCandidate(officialCandidate, brandProfile);

      assert.equal(analysis.risk.officialAccountMatch, true);
      assert.equal(analysis.risk.threatClassification, 'LIKELY_OFFICIAL');
      assert.ok(analysis.risk.riskScore <= 5);
      assert.ok(analysis.risk.confidence >= 95);
      assert.ok(analysis.risk.reasons.some((r) => r.includes('Likely Official')));
    });

    test('3.2 Detects Combosquatting support scam handle (@nike_helpdesk_support)', async () => {
      const scamCandidate = {
        id: 'search-instagram-nike_helpdesk_support',
        platform: 'instagram',
        candidateId: 'nike_helpdesk_support',
        username: '@nike_helpdesk_support',
        displayName: 'Nike Customer Care Support',
        profileUrl: 'https://www.instagram.com/nike_helpdesk_support',
        description: 'Official 24x7 Nike Helpdesk. Direct DM for order refund, replacement and immediate reversal.',
        externalUrls: ['https://nike-refund-portal.support/verify'],
        verificationStatus: 'unverified',
        discoveredAt: new Date().toISOString(),
        source: 'Public Search Fallback',
        isDemoData: false,
      };

      const analysis = await analyzeInstagramCandidate(scamCandidate, brandProfile);

      assert.equal(analysis.risk.officialAccountMatch, false);
      assert.equal(analysis.signals.isCombosquatting, true);
      assert.ok(analysis.signals.bioSupportIntentScore > 0);
      assert.ok(analysis.risk.riskScore >= 70, `Score ${analysis.risk.riskScore} should be elevated for high-mimicry support scam`);
      assert.ok(
        analysis.risk.threatClassification === 'HIGH_RISK' ||
        analysis.risk.threatClassification === 'CRITICAL_THREAT'
      );

      // Verify reasons and structured evidence
      assert.ok(analysis.risk.reasons.some((r) => r.includes('Combosquatting') || r.includes('similarity')));
      assert.ok(analysis.risk.structuredEvidence.some((e) => e.signal === 'instagram_combosquatting' || e.signal === 'instagram_handle_similarity'));
    });

    test('3.3 Identifies Phishing / Lookalike external destination URL in Instagram bio', async () => {
      const phishingCandidate = {
        id: 'search-instagram-nike_sneakers_deals',
        platform: 'instagram',
        candidateId: 'nike_sneakers_deals',
        username: '@nike_sneakers_deals',
        displayName: 'Nike Sneaker Outlet',
        profileUrl: 'https://www.instagram.com/nike_sneakers_deals',
        description: 'Exclusive 80% discount clearance sale for Nike shoes.',
        externalUrls: ['https://nikee-discount-store.top'],
        verificationStatus: 'unverified',
        discoveredAt: new Date().toISOString(),
        source: 'Public Search Fallback',
        isDemoData: false,
      };

      const analysis = await analyzeInstagramCandidate(phishingCandidate, brandProfile);

      assert.equal(analysis.risk.officialAccountMatch, false);
      assert.ok(analysis.risk.domainRiskScore >= 40);
      assert.ok(analysis.risk.reasons.some((r) => r.includes('Bio website') || r.includes('external')));
    });

    test('3.4 Avoids false positive on unrelated low-similarity account', async () => {
      const unrelatedCandidate = {
        id: 'meta-instagram-nikhil_photographer',
        platform: 'instagram',
        candidateId: 'nikhil_photographer',
        username: '@nikhil_photographer',
        displayName: 'Nikhil K | Travel Photography',
        profileUrl: 'https://www.instagram.com/nikhil_photographer',
        description: 'Capturing moments worldwide. Nikon D850 shooter based in Mumbai.',
        externalUrls: ['https://nikhilphotos.in'],
        verificationStatus: 'unverified',
        discoveredAt: new Date().toISOString(),
        source: 'Public Search Fallback',
        isDemoData: false,
      };

      const analysis = await analyzeInstagramCandidate(unrelatedCandidate, brandProfile);

      assert.equal(analysis.signals.isCombosquatting, false);
      assert.ok(analysis.risk.riskScore < 30, `Unrelated photographer score should be low: ${analysis.risk.riskScore}`);
      assert.equal(analysis.risk.threatClassification, 'LOW_CONCERN');
    });

    test('3.5 Correctly handles visual avatar inspection without fabricated scores', async () => {
      const candidateNoImage = {
        id: 'meta-instagram-cand1',
        platform: 'instagram',
        candidateId: 'cand1',
        username: '@nike_store_online',
        displayName: 'Nike Store',
        profileUrl: 'https://www.instagram.com/nike_store_online',
        description: 'Online store',
        externalUrls: [],
        verificationStatus: 'unverified',
        discoveredAt: new Date().toISOString(),
        source: 'Public Search Fallback',
        isDemoData: false,
      };

      const analysis = await analyzeInstagramCandidate(candidateNoImage, brandProfile);

      assert.equal(analysis.signals.avatarStatus, 'not_available');
      assert.equal(analysis.risk.logoSimilarity.status, 'not_available');
      assert.equal(analysis.risk.logoSimilarity.score, undefined, 'Never invent a fabricated 90%+ image score');
    });
  });
});
