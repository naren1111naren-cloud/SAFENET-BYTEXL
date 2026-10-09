/**
 * SAFENET Social Media & Brand Impersonation Monitoring - Test Suite
 * Validates brand identity profiles, controlled variant generation,
 * name/username similarity, candidate normalization, deduplication,
 * explainable risk scoring, missing API key handling, provider failure isolation,
 * URL intelligence integration, demo mode tagging, and store persistence.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Pre-load .env.local if present so API integrations and keys are available in standalone test runners
try {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore
}

import {
  generateBrandSearchVariants,
  SocialDiscoveryEngine,
} from '../src/lib/social/discovery-engine.ts';
import {
  analyzeCandidateIdentity,
  normalizeHandle,
} from '../src/lib/social/identity-analyzer.ts';
import { analyzeCandidateExternalUrls } from '../src/lib/social/url-analyzer.ts';
import { analyzeLogoSimilarity } from '../src/lib/social/logo-analyzer.ts';
import { evaluateSocialCandidateRisk } from '../src/lib/social/risk-engine.ts';
import { YouTubeProvider } from '../src/lib/social/providers/youtubeProvider.ts';
import { XProvider } from '../src/lib/social/providers/xProvider.ts';
import { DemoSocialProvider } from '../src/lib/social/providers/demoProvider.ts';
import { SocialStore } from '../src/lib/social/social-store.ts';
import { getProviderStatuses, getSocialMonitoringConfig } from '../src/lib/social/config.ts';
import { BrandDiscoveryService } from '../src/lib/social/brand-discovery.ts';
import {
  buildBrandIdentityFingerprint,
  generateThreatLookalikeVariants,
} from '../src/lib/social/identity-fingerprint.ts';

const testBrandHdfc = {
  id: 'brand-hdfc-test',
  brandName: 'HDFC Bank',
  officialDomain: 'hdfcbank.com',
  officialUrls: ['https://www.hdfcbank.com'],
  officialSocialHandles: {
    twitter: '@HDFCBank',
    instagram: '@hdfcbank',
    youtube: 'hdfcbank',
    linkedin: 'company/hdfc-bank',
    facebook: 'HDFCBank',
  },
  aliases: ['HDFC', 'HDFC Bank India', 'HDFC Banking'],
  logo: null,
  brandKeywords: ['NetBanking', 'HDFC Loans', 'Credit Card'],
  knownDomains: ['hdfcbank.com', 'hdfc.com'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('SAFENET Social Monitoring Test Suite', () => {
  // Test 1: Brand Creation & Profile Normalization
  test('1. Brand profile stores normalized reference identity', () => {
    const saved = SocialStore.saveBrand(testBrandHdfc);
    assert.equal(saved.brandName, 'HDFC Bank');
    assert.equal(saved.officialDomain, 'hdfcbank.com');
    assert.equal(saved.officialSocialHandles.twitter, '@HDFCBank');

    const retrieved = SocialStore.getBrandById(saved.id);
    assert.ok(retrieved);
    assert.equal(retrieved.brandName, 'HDFC Bank');
  });

  // Test 2: Controlled Search Variant Generation
  test('2. Variant generation creates controlled, bounded queries without combinatorial explosion', () => {
    const variants = generateBrandSearchVariants(testBrandHdfc);
    assert.ok(variants.length >= 3 && variants.length <= 8, `Expected 3-8 variants, got ${variants.length}`);
    assert.ok(variants.includes('HDFC Bank'));
    assert.ok(variants.includes('HDFC Bank Support') || variants.includes('HDFC Support'));
    assert.ok(variants.includes('HDFC Bank Customer Care') || variants.includes('HDFC Bank Official'));
  });

  // Test 3: Username Normalization & Handle Matching
  test('3. Handle normalization strips punctuation, @ prefix, and case variation', () => {
    assert.equal(normalizeHandle('@HDFCBank'), 'hdfcbank');
    assert.equal(normalizeHandle('hdfc_bank'), 'hdfcbank');
    assert.equal(normalizeHandle('hdfc.bank-'), 'hdfcbank');
    assert.equal(normalizeHandle('   @HDFC_Bank   '), 'hdfcbank');
  });

  // Test 4: Name Similarity & Combosquatting Analysis
  test('4. Identity analyzer detects username mimicry and combosquatting', () => {
    const candidate = {
      id: 'test-cand-1',
      platform: 'twitter',
      candidateId: 'c1',
      username: '@hdfc_bank_support_desk',
      displayName: 'HDFC Customer Care & Help',
      profileUrl: 'https://x.com/hdfc_bank_support_desk',
      description: 'Official 24/7 customer care and refund grievance helpline.',
      externalUrls: [],
      verificationStatus: 'unverified',
      discoveredAt: new Date().toISOString(),
      source: 'X API v2',
      isDemoData: false,
    };

    const identity = analyzeCandidateIdentity(candidate, testBrandHdfc);
    assert.equal(identity.officialAccountMatch, false);
    assert.ok(identity.usernameSimilarity >= 75, `Expected high username similarity, got ${identity.usernameSimilarity}`);
    assert.equal(identity.isCombosquatting, true);
    assert.ok(identity.brandingSimilarity > 0, 'Expected branding similarity from support/helpline keywords');
    assert.ok(identity.reasons.length > 0);
  });

  // Test 5: Official Handle Whitelist Match
  test('5. Exact match with registered official handle is recognized and whitelisted', () => {
    const candidate = {
      id: 'test-official',
      platform: 'twitter',
      candidateId: 'official-1',
      username: '@HDFCBank',
      displayName: 'HDFC Bank',
      profileUrl: 'https://x.com/HDFCBank',
      description: 'Official account of HDFC Bank.',
      externalUrls: ['https://www.hdfcbank.com'],
      verificationStatus: 'verified',
      discoveredAt: new Date().toISOString(),
      source: 'X API v2',
      isDemoData: false,
    };

    const identity = analyzeCandidateIdentity(candidate, testBrandHdfc);
    assert.equal(identity.officialAccountMatch, true);
    assert.equal(identity.isCombosquatting, false);

    const risk = evaluateSocialCandidateRisk({
      candidate,
      brandProfile: testBrandHdfc,
      identity,
      urlAnalysis: {
        signals: [],
        hasExternalUrls: false,
        hasOfficialMatch: true,
        hasMismatch: false,
        hasLookalike: false,
        domainRiskScore: 0,
        reasons: [],
      },
      logoSignal: { status: 'not_available' },
    });

    assert.equal(risk.riskScore, 3);
    assert.equal(risk.threatClassification, 'LIKELY_OFFICIAL');
    assert.equal(risk.riskLevel, 'LOW');
    assert.equal(risk.officialAccountMatch, true);
  });

  // Test 6: Missing API Key Handling (Honest Not Configured Status)
  test('6. Unconfigured YouTube and X providers return honest not_configured status without throwing', async () => {
    const origYtKey = process.env.YOUTUBE_API_KEY;
    const origXToken = process.env.X_BEARER_TOKEN;
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.X_BEARER_TOKEN;

    try {
      const yt = new YouTubeProvider();
      assert.equal(yt.isConfigured(), false);
      const ytResult = await yt.searchBrandCandidates(testBrandHdfc, ['HDFC Bank']);
      assert.equal(ytResult.status, 'not_configured');
      assert.equal(ytResult.candidates.length, 0);
      assert.ok(ytResult.message?.includes('not configured'));

      const x = new XProvider();
      assert.equal(x.isConfigured(), false);
      const xResult = await x.searchBrandCandidates(testBrandHdfc, ['HDFC Bank']);
      assert.equal(xResult.status, 'not_configured');
      assert.equal(xResult.candidates.length, 0);
    } finally {
      if (origYtKey) process.env.YOUTUBE_API_KEY = origYtKey;
      if (origXToken) process.env.X_BEARER_TOKEN = origXToken;
    }
  });

  // Test 7: Pluggable Logo Analyzer Integrity
  test('7. Logo analyzer returns not_available without inventing a fabricated score', async () => {
    const res = await analyzeLogoSimilarity({
      officialLogoUrl: 'https://example.com/logo.png',
      candidateImageUrl: 'https://example.com/cand.png',
    });

    assert.equal(res.status, 'not_available');
    assert.equal(res.score, undefined);
    assert.ok(res.notes?.includes('not configured'));
  });

  // Test 8: External URL & Domain Intelligence Integration
  test('8. Reuses SAFENET domain intelligence on candidate external links', async () => {
    // Official domain match
    const officialReport = await analyzeCandidateExternalUrls(
      ['https://www.hdfcbank.com/personal'],
      testBrandHdfc
    );
    assert.equal(officialReport.hasOfficialMatch, true);
    assert.equal(officialReport.hasMismatch, false);
    assert.equal(officialReport.domainRiskScore, 0);

    // Lookalike unauthorized domain
    const lookalikeReport = await analyzeCandidateExternalUrls(
      ['https://hdfcbank-helpdesk-login.top/verify'],
      testBrandHdfc
    );
    assert.equal(lookalikeReport.hasMismatch, true);
    assert.ok(lookalikeReport.domainRiskScore >= 40, `Expected elevated domain risk, got ${lookalikeReport.domainRiskScore}`);
    assert.ok(lookalikeReport.signals.length > 0);
  });

  // Test 9: Explainable Risk Engine Scoring & Evidence
  test('9. Explainable risk engine generates high score with concrete evidence for impersonation', () => {
    const candidate = {
      id: 'test-cand-scam',
      platform: 'twitter',
      candidateId: 'scam1',
      username: '@hdfc_bank_support_24x7',
      displayName: 'HDFC Bank Helpline',
      profileUrl: 'https://x.com/hdfc_bank_support_24x7',
      description: 'Official 24/7 complaint resolution desk. Send UPI transaction ID for instant refund.',
      externalUrls: ['https://hdfc-grievance-refund.online'],
      verificationStatus: 'unverified',
      discoveredAt: new Date().toISOString(),
      source: 'X API v2',
      isDemoData: false,
    };

    const identity = analyzeCandidateIdentity(candidate, testBrandHdfc);
    const risk = evaluateSocialCandidateRisk({
      candidate,
      brandProfile: testBrandHdfc,
      identity,
      urlAnalysis: {
        signals: [
          {
            url: 'https://hdfc-grievance-refund.online',
            hostname: 'hdfc-grievance-refund.online',
            isOfficialDomain: false,
            isLookalike: true,
            similarityScore: 85,
            hasSuspiciousKeywords: true,
            isHighRiskTld: true,
            riskContribution: 85,
            details: ['Unauthorized domain mimicry detected.'],
          },
        ],
        hasExternalUrls: true,
        hasOfficialMatch: false,
        hasMismatch: true,
        hasLookalike: true,
        domainRiskScore: 85,
        reasons: ['External link points to unauthorized domain.'],
      },
      logoSignal: { status: 'not_available' },
    });

    assert.ok(risk.riskScore >= 75, `Expected High/Critical risk, got ${risk.riskScore}`);
    assert.ok(risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL');
    assert.ok(risk.evidenceList.length >= 3, 'Must contain multiple concrete evidence entries');
    assert.ok(risk.reasons.some((r) => r.includes('resembles') || r.includes('Combosquatting')));
  });

  // Test 10: Demo Provider Separation & Synthetic Data Flag
  test('10. Demo provider returns synthetic candidates strictly marked with isDemoData and source tag', async () => {
    const origDemo = process.env.SOCIAL_MONITORING_DEMO_MODE;
    process.env.SOCIAL_MONITORING_DEMO_MODE = 'true';
    try {
      const demo = new DemoSocialProvider();
      assert.equal(demo.isConfigured(), true);

      const result = await demo.searchBrandCandidates(testBrandHdfc, ['HDFC Bank', 'HDFC Bank Support']);
      assert.equal(result.status, 'connected');
      assert.ok(result.candidates.length >= 3);

      for (const cand of result.candidates) {
        assert.equal(cand.isDemoData, true, 'Every demo candidate must have isDemoData: true');
        assert.equal(cand.source, 'SAFENET DEMO DATA');
        assert.ok(cand.displayName.includes('[DEMO DATA]'), 'Display name must visually contain [DEMO DATA]');
      }
    } finally {
      if (origDemo !== undefined) {
        process.env.SOCIAL_MONITORING_DEMO_MODE = origDemo;
      } else {
        delete process.env.SOCIAL_MONITORING_DEMO_MODE;
      }
    }
  });

  // Test 11: Deduplication across Discovery Engine
  test('11. Discovery engine deduplicates repeated candidate handles across multiple queries', async () => {
    const origDemo = process.env.SOCIAL_MONITORING_DEMO_MODE;
    process.env.SOCIAL_MONITORING_DEMO_MODE = 'true';
    try {
      const engine = new SocialDiscoveryEngine();
      const runResult = await engine.runDiscovery(testBrandHdfc, { includeDemoData: true });

      assert.ok(runResult.totalCandidates > 0);

      const seenHandles = new Set();
      for (const cand of runResult.candidates) {
        const key = `${cand.platform}:${cand.username.toLowerCase()}`;
        assert.equal(seenHandles.has(key), false, `Duplicate candidate discovered: ${key}`);
        seenHandles.add(key);
      }
    } finally {
      if (origDemo !== undefined) {
        process.env.SOCIAL_MONITORING_DEMO_MODE = origDemo;
      } else {
        delete process.env.SOCIAL_MONITORING_DEMO_MODE;
      }
    }
  });

  // Test 12: Store State & Status Transitions
  test('12. SocialStore saves candidate analyses and manages watchlist / reviewed status transitions', () => {
    const candidateAnalysis = {
      candidate: {
        id: 'test-cand-state',
        platform: 'instagram',
        candidateId: 'state_1',
        username: '@fake_hdfc_care',
        displayName: 'HDFC Care Desk',
        profileUrl: 'https://instagram.com/fake_hdfc_care',
        description: 'Unofficial account.',
        externalUrls: [],
        verificationStatus: 'unverified',
        discoveredAt: new Date().toISOString(),
        source: 'SAFENET DEMO DATA',
        isDemoData: true,
      },
      matchedBrand: testBrandHdfc,
      risk: {
        riskScore: 78,
        riskLevel: 'HIGH',
        confidence: 85,
        identityScore: 78,
        domainRiskScore: 0,
        nameSimilarity: 80,
        usernameSimilarity: 85,
        brandingSimilarity: 60,
        logoSimilarity: { status: 'not_available' },
        domainAnalysis: [],
        officialAccountMatch: false,
        isCombosquatting: true,
        reasons: ['Username combosquatting detected.'],
        evidenceList: [],
      },
      status: 'new',
    };

    SocialStore.saveCandidateAnalyses([candidateAnalysis]);

    const retrieved = SocialStore.getCandidateById('test-cand-state');
    assert.ok(retrieved);
    assert.equal(retrieved.status, 'new');

    // Transition to watchlist
    const updatedWatchlist = SocialStore.updateCandidateStatus('test-cand-state', 'watchlist');
    assert.equal(updatedWatchlist, true);
    assert.equal(SocialStore.getCandidateById('test-cand-state').status, 'watchlist');

    // Filter by watchlist
    const watchlist = SocialStore.getCandidates({ status: 'watchlist' });
    assert.ok(watchlist.some((c) => c.candidate.id === 'test-cand-state'));
  });

  // Test 13: Brand Discovery Service autonomously discovers official identity
  test('13. BrandDiscoveryService discovers Nike official identity with multi-signal confidence scoring', async () => {
    const discoveryService = new BrandDiscoveryService();
    const result = await discoveryService.discoverBrandIdentity('Nike');

    assert.equal(result.brandName, 'Nike');
    assert.equal(result.officialDomain, 'nike.com');
    assert.ok(result.overallConfidence >= 70, `Expected >= 70% confidence, got ${result.overallConfidence}%`);
    assert.equal(result.isIdentityEstablished, true);
    assert.ok(result.officialProfiles.length >= 5, 'Must discover at least 5 primary platforms');

    const yt = result.officialProfiles.find((p) => p.platform === 'youtube');
    assert.ok(yt);
    if (process.env.YOUTUBE_API_KEY) {
      assert.ok(yt.confidence >= 70, `Expected high confidence for verified YouTube, got ${yt.confidence}`);
      assert.ok(yt.verificationReason && (yt.verificationReason.toLowerCase().includes('authenticated') || yt.verificationReason.toLowerCase().includes('verified')));
    } else {
      assert.ok(yt.verificationStatus === 'UNAVAILABLE' || yt.verificationStatus === 'UNVERIFIED');
    }

    const x = result.officialProfiles.find((p) => p.platform === 'twitter');
    assert.ok(x);
    assert.ok(x.username.includes('nike'));

    assert.ok(result.discoveryEvidence.length > 0);
    assert.ok(result.discoveryEvidence.some((e) => e.signal.includes('official')));
  });

  // Test 14: Brand Identity Fingerprint Normalization
  test('14. buildBrandIdentityFingerprint generates normalized authoritative fingerprint', async () => {
    const discoveryService = new BrandDiscoveryService();
    const result = await discoveryService.discoverBrandIdentity('Nike');
    const fingerprint = buildBrandIdentityFingerprint(result);

    assert.ok(fingerprint, 'Fingerprint must be built for verified Nike identity');
    assert.equal(fingerprint.brandName, 'Nike');
    assert.ok(fingerprint.officialDomains.includes('nike.com'));
    assert.ok(fingerprint.officialDomains.includes('*.nike.com'));
    assert.ok(fingerprint.officialUsernames.includes('nike'));
    assert.ok(fingerprint.knownKeywords.includes('Just Do It'));
    assert.ok(fingerprint.knownKeywords.includes('Nike'));
    assert.ok(fingerprint.confidence >= 70);
    assert.ok(fingerprint.evidence.length >= 2);
  });

  // Test 15: Lookalike Threat Variant Generation
  test('15. generateThreatLookalikeVariants produces mutations without combinatorial explosion', async () => {
    const discoveryService = new BrandDiscoveryService();
    const result = await discoveryService.discoverBrandIdentity('Nike');
    const fingerprint = buildBrandIdentityFingerprint(result);

    const variants = generateThreatLookalikeVariants(fingerprint, 20);

    assert.ok(variants.searchQueries.length >= 3 && variants.searchQueries.length <= 8);
    assert.ok(variants.syntheticLookalikes.length >= 5 && variants.syntheticLookalikes.length <= 20);

    // Combosquatting
    assert.ok(
      variants.syntheticLookalikes.some((v) => v.includes('support') || v.includes('official') || v.includes('store')),
      'Must contain combosquatting variants'
    );

    // Duplication / Typo-squatting
    assert.ok(
      variants.syntheticLookalikes.some((v) => v.startsWith('nik') || v.includes('nike')),
      'Must contain lexical/affix mutations'
    );
  });

  // Test 16: 5-Tier Threat Classification
  test('16. Risk Engine assigns explainable 5-Tier Threat Classification', () => {
    // 1. Whitelisted official -> LIKELY_OFFICIAL (3/100)
    const officialCand = {
      id: 'c-official',
      platform: 'youtube',
      candidateId: 'yt-1',
      username: '@nike',
      displayName: 'Nike',
      profileUrl: 'https://youtube.com/@nike',
      description: 'Official Nike channel.',
      externalUrls: ['https://nike.com'],
      verificationStatus: 'verified',
      discoveredAt: new Date().toISOString(),
      source: 'YouTube Data API v3',
      isDemoData: false,
    };
    const officialIdentity = analyzeCandidateIdentity(officialCand, {
      ...testBrandHdfc,
      brandName: 'Nike',
      officialSocialHandles: { youtube: 'nike' },
    });
    const officialRisk = evaluateSocialCandidateRisk({
      candidate: officialCand,
      brandProfile: { ...testBrandHdfc, brandName: 'Nike', officialSocialHandles: { youtube: 'nike' } },
      identity: officialIdentity,
      urlAnalysis: { signals: [], hasExternalUrls: false, hasOfficialMatch: true, hasMismatch: false, hasLookalike: false, domainRiskScore: 0, reasons: [] },
      logoSignal: { status: 'not_available' },
    });
    assert.equal(officialRisk.threatClassification, 'LIKELY_OFFICIAL');
    assert.equal(officialRisk.riskScore, 3);

    // 2. High Mimicry + Unofficial -> HIGH_RISK or CRITICAL_THREAT
    const impersonatorCand = {
      id: 'c-impersonator',
      platform: 'twitter',
      candidateId: 'x-imp',
      username: '@nike_support_refund',
      displayName: 'Nike Support Desk',
      profileUrl: 'https://x.com/nike_support_refund',
      description: 'Official urgent refund customer support.',
      externalUrls: [],
      verificationStatus: 'unverified',
      discoveredAt: new Date().toISOString(),
      source: 'X API v2',
      isDemoData: false,
    };
    const impIdentity = analyzeCandidateIdentity(impersonatorCand, {
      ...testBrandHdfc,
      brandName: 'Nike',
      officialSocialHandles: { twitter: '@nike' },
    });
    const impRisk = evaluateSocialCandidateRisk({
      candidate: impersonatorCand,
      brandProfile: { ...testBrandHdfc, brandName: 'Nike', officialSocialHandles: { twitter: '@nike' } },
      identity: impIdentity,
      urlAnalysis: { signals: [], hasExternalUrls: false, hasOfficialMatch: false, hasMismatch: false, hasLookalike: false, domainRiskScore: 0, reasons: [] },
      logoSignal: { status: 'not_available' },
    });
    assert.ok(
      impRisk.threatClassification === 'HIGH_RISK' || impRisk.threatClassification === 'CRITICAL_THREAT',
      `Expected HIGH_RISK or CRITICAL_THREAT, got ${impRisk.threatClassification}`
    );
    assert.ok(impRisk.riskScore >= 60);
  });

  // Test 17: Section 25 Structured Evidence Model Output
  test('17. Risk assessment returns Section 25 structured evidence model items', () => {
    const cand = {
      id: 'c-ev-test',
      platform: 'twitter',
      candidateId: 'ev-1',
      username: '@nike_store_deals',
      displayName: 'Nike Sneaker Store',
      profileUrl: 'https://x.com/nike_store_deals',
      description: 'Unofficial sneaker store discount.',
      externalUrls: [],
      verificationStatus: 'unverified',
      discoveredAt: new Date().toISOString(),
      source: 'X API v2',
      isDemoData: false,
    };
    const identity = analyzeCandidateIdentity(cand, {
      ...testBrandHdfc,
      brandName: 'Nike',
      officialSocialHandles: { twitter: '@nike' },
    });
    const risk = evaluateSocialCandidateRisk({
      candidate: cand,
      brandProfile: { ...testBrandHdfc, brandName: 'Nike', officialSocialHandles: { twitter: '@nike' } },
      identity,
      urlAnalysis: { signals: [], hasExternalUrls: false, hasOfficialMatch: false, hasMismatch: false, hasLookalike: false, domainRiskScore: 0, reasons: [] },
      logoSignal: { status: 'not_available' },
    });

    assert.ok(risk.structuredEvidence, 'Must have structuredEvidence field');
    assert.ok(risk.structuredEvidence.length >= 2, 'Must contain multiple structured evidence items');

    for (const item of risk.structuredEvidence) {
      assert.ok(typeof item.signal === 'string', 'Evidence must have signal string');
      assert.ok(item.value !== undefined, 'Evidence must have value');
      assert.ok(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(item.severity), `Invalid severity: ${item.severity}`);
      assert.ok(typeof item.source === 'string', 'Evidence must have source string');
      assert.ok(typeof item.explanation === 'string', 'Evidence must have explanation string');
    }
  });

  // Test 18: Random/Arbitrary Input Rejection (nceck)
  test('18. Arbitrary unverified input ("nceck") yields UNVERIFIED, 0 confidence, and no identity fingerprint', async () => {
    const discoveryService = new BrandDiscoveryService();
    const result = await discoveryService.discoverBrandIdentity('nceck');

    assert.equal(result.isIdentityEstablished, false);
    assert.equal(result.identityStatus, 'UNVERIFIED');
    assert.equal(result.overallConfidence, 0);
    assert.equal(result.officialDomain, null);
    assert.equal(result.aliases.length, 0);
    assert.equal(result.brandKeywords.length, 0);
    assert.equal(result.visualIdentity, null);
    assert.ok(result.statusMessage.includes('could not establish a trusted digital identity'));

    // Fingerprint must be null
    const fp = buildBrandIdentityFingerprint(result);
    assert.equal(fp, null);

    // Lookalike variants must be empty
    const variants = generateThreatLookalikeVariants(fp);
    assert.equal(variants.searchQueries.length, 0);
    assert.equal(variants.syntheticLookalikes.length, 0);
  });

  // Test 19: Provider Failure Honesty & Absence of Synthetic Fabrication
  test('19. Provider failures return honest unavailable statuses without fabricating accounts', async () => {
    const origDemo = process.env.SOCIAL_MONITORING_DEMO_MODE;
    delete process.env.SOCIAL_MONITORING_DEMO_MODE;
    try {
      const engine = new SocialDiscoveryEngine();
      // Run discovery without demo mode
      const brandObj = {
        id: 'brand-test-honest',
        brandName: 'ArbitraryTestBrand',
        officialDomain: 'arbitrary-test-brand-404.com',
        officialSocialHandles: {},
        threatLevel: 'low',
        createdAt: new Date().toISOString(),
      };
      const runResult = await engine.runDiscovery(brandObj, { includeDemoData: false });

      // No fake candidates may be created
      for (const cand of runResult.candidates) {
        assert.equal(cand.isDemoData, false);
        assert.notEqual(cand.source, 'SAFENET DEMO DATA');
      }

      // Check provider statuses reflect true connectivity without fabricated accounts
      const statuses = Object.values(getProviderStatuses());
      assert.ok(statuses.some(s => s.platform === 'facebook' || s.platform === 'instagram'));
      assert.ok(statuses.some(s => s.platform === 'linkedin'));
    } finally {
      if (origDemo !== undefined) process.env.SOCIAL_MONITORING_DEMO_MODE = origDemo;
    }
  });
});

