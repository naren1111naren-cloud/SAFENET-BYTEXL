/**
 * SAFENET Real Investigation Pipeline - Verification Test Suite
 * Validates real external providers, look-alike engine, candidate risk scoring,
 * provider health reporting, and honest empty/error states.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ItunesAppStoreProvider } from '../src/lib/providers/apps/itunes-provider.ts';
import { WebSearchProvider } from '../src/lib/providers/search/search-provider.ts';
import { SocialMediaProvider } from '../src/lib/providers/social/social-provider.ts';
import { globalProviderRegistry } from '../src/lib/providers/registry.ts';
import {
  evaluateLookalikeMatch,
  calculateTokenSimilarity,
  detectRepeatedCharacters,
  generateBrandVariants,
} from '../src/lib/similarity/lookalike-engine.ts';
import { assessCandidateRisk } from '../src/lib/risk-engine/candidate-risk-engine.ts';
const testPaytmBrand = {
  id: 'brand-paytm',
  name: 'Paytm',
  domain: 'paytm.com',
  officialDomains: ['paytm.com', 'paytmbank.com', 'paytmmoney.com'],
  handles: {
    twitter: '@Paytm',
    instagram: '@paytm',
    telegram: '@paytmofficial',
  },
  appPackageName: 'net.one97.paytm',
  authorizedAppIds: ['net.one97.paytm', 'com.paytmmoney'],
  officialDevelopers: ['One97 Communications Limited', 'Paytm'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('SAFENET Real Providers Test Suite', () => {
  // Test 1: Real Apple iTunes Search API Provider
  test('1. Apple iTunes App Store provider handles network honestly and normalizes candidates', async () => {
    const provider = new ItunesAppStoreProvider();
    assert.equal(provider.isConfigured(), true);

    const health = await provider.checkHealth();
    assert.ok(health.status === 'connected' || health.status === 'error', 'Must report honest connected or error status');
    if (health.status === 'error') {
      assert.ok(health.message, 'Must provide detailed failure reason when network or firewall blocks request');
    }

    const result = await provider.discover({
      brandName: 'Paytm',
      domain: 'paytm.com',
    });

    assert.ok(result.status === 'connected' || result.status === 'error');
    // If network was successful, verify normalization
    if (result.status === 'connected' && result.candidates.length > 0) {
      const first = result.candidates[0];
      assert.ok(first.id);
      assert.ok(first.title);
      assert.equal(first.source, 'apple_app_store');
      assert.equal(first.sourceType, 'app');
      assert.ok(first.url.includes('apple.com') || first.url.includes('itunes'));
      assert.ok(first.developer, 'Developer must be extracted');
      assert.ok(first.discoveredAt);
      assert.ok(first.evidence.length > 0);
    }
  });

  // Test 2: Search Provider unconfigured state
  test('2. Unconfigured search provider returns honest not_configured status without fake results', async () => {
    // Ensure search key is unset in this test process scope
    const originalKey = process.env.SERPER_API_KEY;
    delete process.env.SERPER_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.BRAVE_API_KEY;
    delete process.env.SEARCH_PROVIDER_API_KEY;

    const provider = new WebSearchProvider();
    const health = await provider.checkHealth();
    assert.equal(health.status, 'not_configured');
    assert.ok(health.message?.includes('not configured'));

    const result = await provider.discover({
      brandName: 'TestBrand',
      domain: 'testbrand.com',
    });

    assert.equal(result.status, 'not_configured');
    assert.equal(result.candidates.length, 0, 'Must NEVER return fake results when unconfigured');

    if (originalKey) process.env.SERPER_API_KEY = originalKey;
  });

  // Test 3: Social Media Provider unconfigured state
  test('3. Social media provider returns honest not_configured status when no search API is available', async () => {
    delete process.env.SERPER_API_KEY;
    delete process.env.TAVILY_API_KEY;

    const provider = new SocialMediaProvider();
    const health = await provider.checkHealth();
    assert.equal(health.status, 'not_configured');

    const result = await provider.discover({
      brandName: 'TestBrand',
      domain: 'testbrand.com',
    });

    assert.equal(result.status, 'not_configured');
    assert.equal(result.candidates.length, 0);
  });
});

describe('SAFENET Look-alike & Name Similarity Engine', () => {
  // Test 4: Token similarity
  test('4. Token similarity accurately calculates word token overlap', () => {
    const simHigh = calculateTokenSimilarity('Paytm Customer Care Support', 'Paytm Support');
    assert.ok(simHigh >= 0.5);

    const simZero = calculateTokenSimilarity('Apple Electronics', 'Paytm Payments');
    assert.equal(simZero, 0);
  });

  // Test 5: Repeated character detection
  test('5. Repeated character detection catches suspicious typosquats', () => {
    assert.equal(detectRepeatedCharacters('payttm', 'paytm'), true);
    assert.equal(detectRepeatedCharacters('paytttm', 'paytm'), true);
    assert.equal(detectRepeatedCharacters('examplle', 'example'), true);
    assert.equal(detectRepeatedCharacters('paytm', 'paytm'), false);
    assert.equal(detectRepeatedCharacters('google', 'paytm'), false);
  });

  // Test 6: Look-alike match evaluation
  test('6. evaluateLookalikeMatch produces deterministic signals and bounded scores', () => {
    const exact = evaluateLookalikeMatch('Paytm', 'Paytm');
    assert.equal(exact.similarityScore0to20, 20);
    assert.equal(exact.editDistance, 0);

    const typo = evaluateLookalikeMatch('Paytm Support & Care', 'Paytm');
    assert.ok(typo.isLookalike);
    assert.ok(typo.signals.length > 0);
    assert.ok(typo.similarityScore0to20 > 0);

    const unrelated = evaluateLookalikeMatch('Fresh Fruit Grocers', 'Paytm');
    assert.equal(unrelated.isLookalike, false);
    assert.equal(unrelated.similarityScore0to20, 0);
  });

  // Test 7: Variant generation
  test('7. generateBrandVariants generates legitimate search queries and look-alikes', () => {
    const variants = generateBrandVariants('Paytm');
    assert.ok(variants.includes('Paytm Official'));
    assert.ok(variants.includes('Paytm Support'));
    assert.ok(variants.includes('Paytm-Support'));
  });
});

describe('SAFENET Candidate Risk Engine & Evidence Audit', () => {
  // Test 8: Verified official asset receives zero risk
  test('8. Verified official application receives 0 risk score', () => {
    const officialCandidate = {
      id: 'app-official-paytm',
      source: 'apple_app_store',
      sourceType: 'app',
      title: 'Paytm: Secure UPI Payments',
      url: 'https://apps.apple.com/app/id12345',
      developer: 'One97 Communications Limited',
      discoveredAt: new Date().toISOString(),
      provider: 'itunes_search_api',
      appId: 'net.one97.paytm',
      evidence: [],
    };

    const assessment = assessCandidateRisk(officialCandidate, testPaytmBrand);
    assert.equal(assessment.riskScore, 0);
    assert.equal(assessment.riskLevel, 'LOW');
    assert.equal(assessment.isOfficialAsset, true);
  });

  // Test 9: Rogue developer mismatch produces high risk score
  test('9. App with brand title but unauthorized developer receives elevated risk score', () => {
    const rogueApp = {
      id: 'app-rogue-paytm',
      source: 'apple_app_store',
      sourceType: 'app',
      title: 'Paytm Fast Cash & Loan Helpline',
      url: 'https://apps.apple.com/app/id99999',
      developer: 'Freelance Quick Cash Apps LLC',
      description: 'Official customer support and instant refund KYC verify helpline.',
      discoveredAt: new Date().toISOString(),
      provider: 'itunes_search_api',
      appId: 'com.quickloan.paytmhelper',
      evidence: [],
    };

    const assessment = assessCandidateRisk(rogueApp, testPaytmBrand);
    assert.ok(assessment.riskScore >= 60, `Risk score must be >= 60, got ${assessment.riskScore}`);
    assert.ok(assessment.breakdown.developerMismatch > 0, 'Developer mismatch must contribute points');
    assert.ok(assessment.breakdown.brandClaim > 0, 'Brand claim must contribute points');
    assert.equal(assessment.isOfficialAsset, false);
  });

  // Test 10: Logo similarity honestly returns unavailable
  test('10. Logo similarity never returns fabricated 93% and reports insufficient evidence', () => {
    const candidate = {
      id: 'app-generic',
      source: 'apple_app_store',
      sourceType: 'app',
      title: 'Paytm Rewards',
      url: 'https://example.com/app',
      imageUrl: 'https://example.com/icon.png',
      discoveredAt: new Date().toISOString(),
      provider: 'itunes_search_api',
      evidence: [],
    };

    const assessment = assessCandidateRisk(candidate, testPaytmBrand);
    assert.equal(assessment.breakdown.brandingSimilarity, 0);

    const logoEv = assessment.evidence.find((e) => e.title.includes('Logo'));
    assert.ok(logoEv);
    assert.equal(logoEv?.status, 'unavailable');
    assert.ok(logoEv?.description.includes('insufficient image evidence'));
  });
});
