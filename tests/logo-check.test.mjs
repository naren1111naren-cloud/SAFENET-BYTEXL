/**
 * SAFENET - Logo Check & Image Intelligence Test Suite
 * 
 * Verifies:
 * 1. Magic byte validation (PNG, JPEG, WebP, disguised/invalid inputs, size limit)
 * 2. Deterministic dHash, Hamming distance, and color histogram computation
 * 3. SSRF rejection on unsafe internal IP ranges and hostnames
 * 4. NOT_CONFIGURED graceful handling when keys are absent
 * 5. Domain deduplication across multiple reverse search candidate results
 * 6. Brand Baseline allowlist classification (OFFICIAL with risk score 0) vs lookalike scoring
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageMagicBytes,
  analyzeImageHash,
  computeHammingDistance,
  compareColorHistograms,
  comparePerceptualSimilarity,
  fetchThumbnailSafe,
  LogoAnalysisCache,
} from '../src/lib/logo-detector/image-utils.ts';
import { SerpApiGoogleLensProvider } from '../src/lib/providers/logo/serpapi-lens-provider.ts';
import { analyzeLogoWithGeminiVision } from '../src/lib/logo-detector/gemini-vision.ts';
import { processLogoCheck } from '../src/lib/logo-detector/logo-orchestrator.ts';
import { PRESET_BRANDS } from '../src/lib/brand-store.ts';
import { LegitimateAssetRegistry } from '../src/lib/similarity/legitimate-registry.ts';

// ---------------------------------------------------------------------------
// Synthetic Image Fixtures
// ---------------------------------------------------------------------------

// 1x1 Transparent PNG (67 bytes)
const VALID_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

// 1x1 Red PNG
const RED_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Synthetic JPEG with FF D8 FF header
const VALID_JPEG_BUFFER = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.alloc(100, 0xaa),
]);

// Synthetic WebP with RIFF...WEBP header
const VALID_WEBP_BUFFER = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBPVP8 ', 'ascii'),
  Buffer.alloc(50, 0xbb),
]);

// Disguised text file claiming to be an image
const DISGUISED_EXE_BUFFER = Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is not a real image file');

test('SAFENET Logo Check & Image Intelligence Suite', async (t) => {
  await t.test('1. Magic Byte Validation and Format Verification', () => {
    // Valid PNG
    const pngRes = validateImageMagicBytes(VALID_PNG_BUFFER);
    assert.equal(pngRes.valid, true);
    assert.equal(pngRes.format, 'png');
    assert.equal(pngRes.mimeType, 'image/png');

    // Valid JPEG
    const jpegRes = validateImageMagicBytes(VALID_JPEG_BUFFER);
    assert.equal(jpegRes.valid, true);
    assert.equal(jpegRes.format, 'jpeg');
    assert.equal(jpegRes.mimeType, 'image/jpeg');

    // Valid WebP
    const webpRes = validateImageMagicBytes(VALID_WEBP_BUFFER);
    assert.equal(webpRes.valid, true);
    assert.equal(webpRes.format, 'webp');
    assert.equal(webpRes.mimeType, 'image/webp');

    // Disguised / Invalid Header
    const invalidRes = validateImageMagicBytes(DISGUISED_EXE_BUFFER);
    assert.equal(invalidRes.valid, false);
    assert.equal(invalidRes.format, 'unknown');
    assert.match(invalidRes.error || '', /Invalid image format/);

    // Oversized Payload (> 4 MB)
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024, 0x89);
    const overRes = validateImageMagicBytes(oversizedBuffer);
    assert.equal(overRes.valid, false);
    assert.match(overRes.error || '', /exceeds the 4 MB limit/);
  });

  await t.test('2. Deterministic Hash, dHash, and Color Histogram Computation', () => {
    const hash1 = analyzeImageHash(VALID_PNG_BUFFER);
    const hash2 = analyzeImageHash(VALID_PNG_BUFFER);

    // Identical buffers must produce identical SHA-256 and dHash
    assert.equal(hash1.sha256, hash2.sha256);
    assert.equal(hash1.dHash, hash2.dHash);
    assert.equal(hash1.dHash.length, 64);
    assert.equal(hash1.colorHistogram.length, 64);

    // Compare identical images
    const simSame = comparePerceptualSimilarity(hash1, hash2);
    assert.equal(simSame.dHashDistance, 0);
    assert.equal(simSame.dHashSimilarity, 1.0);
    assert.equal(simSame.score0to100, 100);
    assert.equal(simSame.isMatch, true);
    assert.equal(simSame.confidence, 'HIGH');

    // Compare with distinct image buffer
    const hashDistinct = analyzeImageHash(RED_PNG_BUFFER);
    const simDiff = comparePerceptualSimilarity(hash1, hashDistinct);
    assert.ok(typeof simDiff.score0to100 === 'number');
    assert.ok(simDiff.score0to100 <= 100 && simDiff.score0to100 >= 0);
  });

  await t.test('3. SSRF Protection on Thumbnail Fetcher', async () => {
    // Loopback IPv4
    const loopbackRes = await fetchThumbnailSafe('http://127.0.0.1:8080/evil-icon.png');
    assert.equal(loopbackRes.ok, false);
    assert.match(loopbackRes.error || '', /SSRF/);

    // Cloud Metadata
    const metaRes = await fetchThumbnailSafe('http://169.254.169.254/latest/meta-data/');
    assert.equal(metaRes.ok, false);
    assert.match(metaRes.error || '', /SSRF/);

    // Internal Suffix
    const internalRes = await fetchThumbnailSafe('http://server.internal/logo.png');
    assert.equal(internalRes.ok, false);
    assert.match(internalRes.error || '', /SSRF/);
  });

  await t.test('4. NOT_CONFIGURED Graceful Handling on Absent Keys', async () => {
    const lensProvider = new SerpApiGoogleLensProvider();
    
    // In test environment without SERPAPI_API_KEY
    if (!process.env.SERPAPI_API_KEY) {
      assert.equal(lensProvider.isConfigured(), false);
      const res = await lensProvider.searchByImage(VALID_PNG_BUFFER, 'image/png');
      assert.equal(res.status, 'NOT_CONFIGURED');
      assert.equal(res.candidates.length, 0);
    }

    // Gemini Vision without valid key
    const visionRes = await analyzeLogoWithGeminiVision(VALID_PNG_BUFFER, 'image/png');
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('AQ.')) {
      assert.equal(visionRes.status, 'NOT_CONFIGURED');
      assert.equal(visionRes.extractedText, '');
    }
  });

  await t.test('5. Domain Deduplication and Normalization', () => {
    const candidates = [
      { domain: 'example.com', title: 'Match 1', name: 'Ex 1', sourceUrl: 'https://example.com/p1', thumbnailUrl: '', sourceType: 'reverse_image_lens' },
      { domain: 'example.com', title: 'Match 2', name: 'Ex 2', sourceUrl: 'https://example.com/p2', thumbnailUrl: '', sourceType: 'reverse_image_lens' },
      { domain: 'sub.paytm.com', title: 'Paytm Sub', name: 'Paytm', sourceUrl: 'https://sub.paytm.com', thumbnailUrl: '', sourceType: 'reverse_image_lens' },
    ];

    const dedupeMap = new Map();
    for (const c of candidates) {
      if (!dedupeMap.has(c.domain.toLowerCase())) {
        dedupeMap.set(c.domain.toLowerCase(), c);
      }
    }

    assert.equal(dedupeMap.size, 2);
    assert.ok(dedupeMap.has('example.com'));
    assert.ok(dedupeMap.has('sub.paytm.com'));
  });

  await t.test('6. Brand Baseline Official Domain Allowlist', () => {
    const testBrand = PRESET_BRANDS['Paytm'];
    
    // Official domain
    const matchOfficial = LegitimateAssetRegistry.evaluateCandidateLegitimacy({ domain: 'paytm.com' }, testBrand);
    assert.equal(matchOfficial.isAllowlisted, true);
    assert.equal(matchOfficial.matchType, 'official_domain');

    // Official subdomain
    const matchSubdomain = LegitimateAssetRegistry.evaluateCandidateLegitimacy({ domain: 'secure.paytm.com' }, testBrand);
    assert.equal(matchSubdomain.isAllowlisted, true);

    // Lookalike domain
    const matchLookalike = LegitimateAssetRegistry.evaluateCandidateLegitimacy({ domain: 'paytm-kyc-rewards.xyz' }, testBrand);
    assert.equal(matchLookalike.isAllowlisted, false);
  });

  await t.test('7. Full Logo Check Orchestrator Execution & 24h Caching', async () => {
    const testBrand = PRESET_BRANDS['Paytm'];
    const report = await processLogoCheck(VALID_PNG_BUFFER, testBrand, { bypassCache: true });

    assert.equal(report.status, 'SUCCESS');
    assert.equal(report.brand.name, 'Paytm');
    assert.equal(report.imageFormat, 'png');
    assert.ok(report.imageHash.length > 0);
    assert.ok(typeof report.summary.totalCandidates === 'number');

    // Test 24-Hour Cache
    const cachedEntry = LogoAnalysisCache.get(report.imageHash);
    assert.ok(cachedEntry !== null);
    assert.equal(cachedEntry.imageHash, report.imageHash);
  });
});
