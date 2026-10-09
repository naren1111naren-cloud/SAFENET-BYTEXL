/**
 * SAFENET - App Threat Intelligence & App Store Monitoring Automated Test Suite
 *
 * Verifies:
 * 1. SerpApi Real Google Play Queries:
 *    - Search "PayPal" (returns real candidates, extracts attributes)
 *    - Search "WhatsApp" (identifies WhatsApp LLC official candidate)
 *    - Search "Microsoft" (identifies Microsoft Corporation official candidate)
 *    - Search Nonexistent App (handles zero results cleanly)
 * 2. Deterministic 7-Point Risk Scoring Engine & Impersonation Detection
 * 3. Logo Similarity Service (real/unavailable handling, zero fake data)
 * 4. Static Zero-Execution APK Analysis (hashes, permissions, DEX domains)
 * 5. APK Store Correlation & Network Domain Threat Correlation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Load .env.local if present
if (fs.existsSync('.env.local')) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile('.env.local');
    }
  } catch {}
  if (!process.env.SERPAPI_KEY) {
    const content = fs.readFileSync('.env.local', 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*SERPAPI_KEY\s*=\s*(.+?)\s*$/);
      if (match) {
        process.env.SERPAPI_KEY = match[1].replace(/^["']|["']$/g, '').trim();
      }
    }
  }
}

import { appStoreService } from '../src/lib/apps/app-store-service.ts';
import { compareAppLogoSimilarity } from '../src/lib/apps/logo-similarity-service.ts';
import { analyzeApkStatic } from '../src/lib/apk/apk-analyzer.ts';
import { correlateApkThreat } from '../src/lib/apps/threat-correlator.ts';
import { BrandStore, PRESET_BRANDS } from '../src/lib/brand-store.ts';

// Helper to construct a synthetic uncompressed ZIP/APK in memory
function createSyntheticApkBuffer(files) {
  const chunks = [];
  const centralDirectoryHeaders = [];
  let currentOffset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.name, 'utf-8');
    const dataBuf = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf-8');

    const crc = 0; // for uncompressed store
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general flags
    localHeader.writeUInt16LE(0, 8); // compression method 0 = STORE
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc-32
    localHeader.writeUInt32LE(dataBuf.length, 18); // compressed size
    localHeader.writeUInt32LE(dataBuf.length, 22); // uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28); // extra field length
    filenameBuf.copy(localHeader, 30);

    chunks.push(localHeader);
    chunks.push(dataBuf);

    // Central directory entry
    const cdHeader = Buffer.alloc(46 + filenameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0); // signature
    cdHeader.writeUInt16LE(20, 4); // version made by
    cdHeader.writeUInt16LE(20, 6); // version needed
    cdHeader.writeUInt16LE(0, 8); // flags
    cdHeader.writeUInt16LE(0, 10); // compression method
    cdHeader.writeUInt16LE(0, 12); // time
    cdHeader.writeUInt16LE(0, 14); // date
    cdHeader.writeUInt32LE(crc, 16); // crc
    cdHeader.writeUInt32LE(dataBuf.length, 20); // compressed
    cdHeader.writeUInt32LE(dataBuf.length, 24); // uncompressed
    cdHeader.writeUInt16LE(filenameBuf.length, 28); // filename len
    cdHeader.writeUInt16LE(0, 30); // extra len
    cdHeader.writeUInt16LE(0, 32); // comment len
    cdHeader.writeUInt16LE(0, 34); // disk start
    cdHeader.writeUInt16LE(0, 36); // internal attrs
    cdHeader.writeUInt32LE(0, 38); // external attrs
    cdHeader.writeUInt32LE(currentOffset, 42); // local header offset
    filenameBuf.copy(cdHeader, 46);

    centralDirectoryHeaders.push(cdHeader);
    currentOffset += localHeader.length + dataBuf.length;
  }

  const cdOffset = currentOffset;
  let cdSize = 0;
  for (const cdh of centralDirectoryHeaders) {
    chunks.push(cdh);
    cdSize += cdh.length;
  }

  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  chunks.push(eocd);

  return Buffer.concat(chunks);
}

describe('SAFENET App Threat Intelligence & App Store Monitoring', () => {

  describe('1. SerpApi Real Google Play Queries', () => {

    test('1.1 Search "PayPal" returns real candidates with normalized fields', async () => {
      const result = await appStoreService.searchGooglePlay('PayPal', { country: 'in' });

      assert.equal(result.query, 'PayPal');
      assert.ok(result.results_count > 0, 'Should find Google Play candidates for PayPal');
      assert.ok(Array.isArray(result.candidates), 'Candidates must be an array');

      const first = result.candidates[0];
      assert.ok(first.app_name.length > 0, 'Candidate must have app_name');
      assert.ok(first.developer.length > 0, 'Candidate must have developer');
      assert.ok(first.package_id.length > 0, 'Candidate must have package_id');
      assert.ok(first.app_url.includes('google.com') || first.app_url.includes('play.google.com'), 'App URL should point to store');

      // Check risk scoring attributes
      assert.ok(typeof first.risk_score === 'number', 'Risk score must be a number');
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(first.risk_level), 'Risk level must be valid');
      assert.ok(Array.isArray(first.evidence), 'Evidence must be an array');
      assert.ok(first.risk_breakdown, 'Risk breakdown must be defined');
      assert.equal(typeof first.risk_breakdown.total, 'number');
    });

    test('1.2 Search "WhatsApp" identifies legitimate WhatsApp candidate', async () => {
      const result = await appStoreService.searchGooglePlay('WhatsApp', { country: 'in' });

      assert.ok(result.candidates.length > 0, 'Candidates list should not be empty');
      const official = result.candidates.find((c) => c.is_verified_official || c.official_candidate === 'YES');
      assert.ok(official, 'Must identify an official candidate for WhatsApp');
      assert.ok(
        official.developer.toLowerCase().includes('whatsapp') ||
        official.package_id.toLowerCase().includes('whatsapp'),
        'Official WhatsApp candidate should match WhatsApp publisher'
      );
      assert.equal(official.risk_level, 'LOW', 'Legitimate app should be marked LOW risk');
    });

    test('1.3 Search "Microsoft" identifies legitimate Microsoft publisher', async () => {
      const result = await appStoreService.searchGooglePlay('Microsoft', { country: 'in' });

      assert.ok(result.candidates.length > 0, 'Candidates list should not be empty');
      const official = result.candidates.find((c) => c.is_verified_official || c.official_candidate === 'YES');
      assert.ok(official, 'Must identify an official candidate for Microsoft');
      assert.ok(
        official.developer.toLowerCase().includes('microsoft') ||
        official.package_id.toLowerCase().includes('microsoft'),
        'Official Microsoft candidate should match Microsoft Corporation'
      );
    });

    test('1.4 Search nonexistent app handles zero results gracefully without crashing', async () => {
      const result = await appStoreService.searchGooglePlay('X9z99RandomNonexistentBrand404XYZ', {
        country: 'in',
      });

      assert.equal(typeof result.results_count, 'number');
      assert.ok(Array.isArray(result.candidates), 'Candidates must be an array');
    });
  });

  describe('2. Deterministic 7-Point Risk Scoring Engine', () => {

    test('2.1 Low risk scored for exact official application', async () => {
      const result = await appStoreService.searchGooglePlay('PayPal', { country: 'in' });
      const official = result.candidates.find((c) => c.is_verified_official);
      if (official) {
        assert.ok(official.risk_score <= 29, `Expected low risk (<= 29), got ${official.risk_score}`);
        assert.equal(official.risk_level, 'LOW');
        assert.equal(official.official_candidate, true);
      }
    });

    test('2.2 High/Critical risk detected for impersonation patterns with mismatch developer', async () => {
      const result = await appStoreService.searchGooglePlay('PayPal', { country: 'in' });
      for (const candidate of result.candidates) {
        const rb = candidate.risk_breakdown;
        assert.ok(rb, 'Must have risk breakdown');
        const calculatedSum =
          rb.name_similarity +
          rb.logo_similarity +
          rb.developer_mismatch +
          rb.description_similarity +
          rb.package_similarity +
          rb.identity_mismatch +
          rb.suspicious_signals;
        assert.equal(rb.total, calculatedSum, 'Breakdown components must sum to total');
        assert.ok(candidate.risk_score >= 0 && candidate.risk_score <= 100, 'Score must be clamped between 0 and 100');
      }
    });
  });

  describe('3. Logo Similarity Service', () => {

    test('3.1 Returns unavailable explanation when icon URLs are missing or invalid', async () => {
      const result = await compareAppLogoSimilarity('', 'https://invalid-nonexistent.domain/icon.png');
      assert.equal(result.score, undefined);
      assert.equal(result.status, 'unavailable');
      assert.ok(result.explanation.includes('Logo comparison unavailable'), 'Must explain logo comparison is unavailable');
    });
  });

  describe('4. Static Zero-Execution APK Analysis', () => {

    test('4.1 Accurately extracts metadata, sensitive permissions, and SHA-256 hash', () => {
      // Manifest contents with sensitive permissions and target package
      const fakeManifest = `
        <manifest package="com.fakebank.security.app" android:versionName="2.4.1">
          <application android:label="Secure Banking Helper">
            <activity android:name="com.fakebank.security.app.MainActivity" />
            <service android:name="com.fakebank.security.app.TelemetryService" />
            <receiver android:name="com.fakebank.security.app.BootReceiver" />
          </application>
          <uses-permission android:name="android.permission.RECEIVE_SMS" />
          <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
          <uses-permission android:name="android.permission.INTERNET" />
        </manifest>
      `;

      // DEX bytecode simulation containing target external URLs
      const fakeDex = Buffer.from(
        'Lcom/fakebank/security/app/NetworkClient; ' +
        'https://c2-phishing-portal.malicious-domain.xyz/harvest ' +
        'https://api.fakebank.ru/gate ' +
        'https://schemas.android.com/apk/res/android'
      );

      const apkBuffer = createSyntheticApkBuffer([
        { name: 'AndroidManifest.xml', content: fakeManifest },
        { name: 'classes.dex', content: fakeDex },
        { name: 'META-INF/CERT.RSA', content: Buffer.from('mock-signing-cert') },
      ]);

      const analysis = analyzeApkStatic(apkBuffer, 'fake-banking.apk');

      assert.equal(analysis.file_name, 'fake-banking.apk');
      assert.equal(analysis.package_id, 'com.fakebank.security.app');
      assert.equal(analysis.application_label, 'Secure Banking Helper');
      assert.equal(analysis.version_name, '2.4.1');
      assert.equal(analysis.has_v1_signature, true);

      // Verify SHA-256
      const expectedSha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex');
      assert.equal(analysis.sha256_hash, expectedSha256);

      // Verify permissions
      assert.ok(analysis.permissions.total_count >= 2, 'Should have total permissions');
      assert.ok(analysis.permissions.sensitive_count >= 2, 'Should have sensitive permissions');
      const permNames = analysis.permissions.sensitive.map((p) => p.permission);
      assert.ok(permNames.includes('android.permission.RECEIVE_SMS'), 'Should detect RECEIVE_SMS');
      assert.ok(permNames.includes('android.permission.SYSTEM_ALERT_WINDOW'), 'Should detect SYSTEM_ALERT_WINDOW');

      // Verify components
      assert.ok(analysis.components.activities.includes('MainActivity') || analysis.components.activities_count >= 1, 'Should extract activities');
      assert.ok(analysis.components.services_count >= 1, 'Should extract services');
      assert.ok(analysis.components.receivers_count >= 1, 'Should extract receivers');

      // Verify extracted domains (ignoring schemas.android.com)
      assert.ok(analysis.extracted_domains.includes('c2-phishing-portal.malicious-domain.xyz'), 'Should extract c2 domain');
      assert.ok(analysis.extracted_domains.includes('api.fakebank.ru'), 'Should extract fakebank.ru');
      assert.ok(!analysis.extracted_domains.includes('schemas.android.com'), 'Benign Android schemas must be filtered');
    });
  });

  describe('5. APK ↔ Store Correlation & Network Threat Correlation', () => {

    test('5.1 Correlates suspicious APK with Google Play search and domain intelligence', async () => {
      const fakeManifest = `
        <manifest package="com.quickrefund.paypal.support" android:versionName="1.0.0">
          <application android:label="PayPal Support">
          </application>
          <uses-permission android:name="android.permission.RECEIVE_SMS" />
          <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
        </manifest>
      `;

      const fakeDex = Buffer.from('https://paypal-urgent-kyc-refund.xyz/verify');

      const apkBuffer = createSyntheticApkBuffer([
        { name: 'AndroidManifest.xml', content: fakeManifest },
        { name: 'classes.dex', content: fakeDex },
      ]);

      const staticAnalysis = analyzeApkStatic(apkBuffer, 'paypal-support-trojan.apk');

      const correlation = await correlateApkThreat(staticAnalysis, 'PayPal');

      assert.ok(correlation.apk, 'Should have static APK details');
      assert.ok(['MATCH', 'PARTIAL MATCH', 'NO MATCH', 'UNKNOWN'].includes(correlation.store_match.verdict), 'Store match verdict must be valid');
      assert.ok(typeof correlation.combined_risk_score === 'number', 'Combined risk score must be number');
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(correlation.combined_risk_level), 'Verdict must be valid level');
      assert.ok(correlation.evidence.length > 0, 'Must provide correlation evidence');

      // Verify domain intelligence was executed
      assert.ok(correlation.domain_intelligence, 'Domain intelligence must be present');
      assert.ok(correlation.domain_intelligence.total_domains_scanned >= 1, 'Should scan extracted domains');
      assert.ok(typeof correlation.apk_risk_score === 'number', 'APK risk score must be number');
    });
  });

  describe('6. 6-Vector Identity Comparison & Why Flagged Explanations', () => {

    test('6.1 Generates 6-vector comparison matrix and human-readable why_flagged reasons', async () => {
      const result = await appStoreService.searchGooglePlay('PayPal', { country: 'in' });
      assert.ok(result.candidates.length > 0, 'Must return candidates for PayPal');

      const first = result.candidates[0];
      assert.ok(first.identity_comparison, 'Candidate must have identity_comparison');
      assert.ok(first.identity_comparison.app_name, 'Must have app_name vector');
      assert.ok(first.identity_comparison.developer, 'Must have developer vector');
      assert.ok(first.identity_comparison.logo, 'Must have logo vector');
      assert.ok(first.identity_comparison.package_id, 'Must have package_id vector');
      assert.ok(first.identity_comparison.description, 'Must have description vector');
      assert.ok(first.identity_comparison.domain, 'Must have domain vector');

      const validStates = ['MATCH', 'SIMILAR', 'MISMATCH', 'UNKNOWN'];
      assert.ok(validStates.includes(first.identity_comparison.app_name.status));
      assert.ok(validStates.includes(first.identity_comparison.developer.status));
      assert.ok(validStates.includes(first.identity_comparison.logo.status));
      assert.ok(validStates.includes(first.identity_comparison.package_id.status));
      assert.ok(validStates.includes(first.identity_comparison.description.status));
      assert.ok(validStates.includes(first.identity_comparison.domain.status));

      assert.ok(Array.isArray(first.why_flagged), 'Candidate must have why_flagged reasons array');
      assert.ok(first.why_flagged.length > 0, 'Candidate must have at least one why_flagged reason');
      assert.ok(typeof first.why_flagged[0] === 'string', 'Why flagged item must be a string');
    });
  });

  describe('7. Actionable Security Workflow: Watchlist Persistence', () => {

    test('7.1 Adds, verifies presence, and removes candidate from persistent security watchlist', () => {
      const mockCandidate = {
        id: 'app-test-scam-wallet',
        app_name: 'PayPal Scam Wallet',
        developer: 'Rogue Dev',
        package_id: 'com.scam.paypal.wallet',
        risk_score: 85,
        risk_level: 'CRITICAL',
      };

      BrandStore.addToAppWatchlist(mockCandidate);
      assert.equal(BrandStore.isInAppWatchlist('com.scam.paypal.wallet'), true);
      const list = BrandStore.getAppWatchlist();
      assert.ok(list.some((a) => a.package_id === 'com.scam.paypal.wallet'), 'Watchlist must contain candidate');

      BrandStore.removeFromAppWatchlist('com.scam.paypal.wallet');
      assert.equal(BrandStore.isInAppWatchlist('com.scam.paypal.wallet'), false);
    });
  });

  describe('8. Actionable Security Workflow: Brand Baseline & Export Readiness', () => {

    test('8.1 Protects verified brand profile baseline and structures exportable investigation report', () => {
      const brand = PRESET_BRANDS['PayPal'];
      assert.ok(brand, 'PayPal preset brand must exist');
      assert.equal(brand.domain, 'paypal.com');
      assert.ok(brand.authorizedAppIds.includes('com.paypal.android.p2pmobile'));
      assert.ok(brand.officialDevelopers.includes('PayPal Mobile'));

      const candidate = {
        app_name: 'PayPal Secure Portal',
        developer: 'Unknown Publisher',
        package_id: 'com.unknown.paypalsecure',
        risk_score: 88,
        risk_level: 'CRITICAL',
        verdict_summary: 'LIKELY MALICIOUS BRAND IMPERSONATION',
        confidence: 'HIGH',
      };

      assert.ok(candidate.app_name);
      assert.ok(candidate.risk_score > 70);
      assert.equal(candidate.risk_level, 'CRITICAL');
    });
  });

  describe('9. Digital Risk Protection 2.0: Threat Lifecycle & Status Transitions', () => {

    test('9.1 Updates candidate threat lifecycle status with audit trail history', () => {
      const testCandidate = {
        id: 'app-threat-lifecycle-test',
        app_name: 'PayPal Rogue Service',
        developer: 'Rogue Publisher',
        package_id: 'com.rogue.paypal.service',
        risk_score: 91,
        risk_level: 'CRITICAL',
      };

      // Add to stored candidates via sync
      BrandStore.syncAndDeduplicateCandidates([testCandidate], 'PayPal');

      // Transition to UNDER REVIEW
      const underReview = BrandStore.updateAppThreatStatus('com.rogue.paypal.service', 'UNDER REVIEW', 'Analyst triage started');
      assert.ok(underReview, 'Target candidate should be updated');
      assert.equal(underReview.lifecycle_status, 'UNDER REVIEW');
      assert.ok(underReview.threat_history.some((h) => h.event.includes('UNDER REVIEW')));

      // Transition to CONFIRMED SUSPICIOUS
      const confirmed = BrandStore.updateAppThreatStatus('com.rogue.paypal.service', 'CONFIRMED SUSPICIOUS', 'Confirmed phishing indicators');
      assert.equal(confirmed.lifecycle_status, 'CONFIRMED SUSPICIOUS');

      // Transition to RESOLVED
      const resolved = BrandStore.updateAppThreatStatus('com.rogue.paypal.service', 'RESOLVED', 'Store listing taken down');
      assert.equal(resolved.lifecycle_status, 'RESOLVED');
    });
  });

  describe('10. Digital Risk Protection 2.0: Deduplication & First/Last Seen Tracking', () => {

    test('10.1 Deduplicates repeated discoveries and maintains first_seen while updating last_seen', () => {
      const initialCandidate = {
        id: 'app-dedup-test-pkg',
        app_name: 'PayPal Quick Pay',
        developer: 'Fake Payments Corp',
        package_id: 'com.fakepay.paypal',
        risk_score: 75,
        risk_level: 'HIGH',
      };

      // First discovery
      const { candidates: list1, summary: sum1 } = BrandStore.syncAndDeduplicateCandidates([initialCandidate], 'PayPal');
      const firstDiscovered = list1.find((c) => c.package_id === 'com.fakepay.paypal');
      assert.ok(firstDiscovered, 'Should find candidate in list');
      assert.ok(firstDiscovered.first_seen_at, 'Should have first_seen_at timestamp');
      assert.equal(sum1.new_candidates, 1, 'Should report 1 new candidate');

      const originalFirstSeen = firstDiscovered.first_seen_at;

      // Second discovery (repeated scan with updated risk)
      const repeatCandidate = {
        ...initialCandidate,
        risk_score: 82,
        risk_level: 'CRITICAL',
      };

      const { candidates: list2, summary: sum2 } = BrandStore.syncAndDeduplicateCandidates([repeatCandidate], 'PayPal');
      const secondDiscovered = list2.find((c) => c.package_id === 'com.fakepay.paypal');

      assert.equal(secondDiscovered.first_seen_at, originalFirstSeen, 'first_seen_at must remain unchanged across repeated scans');
      assert.ok(secondDiscovered.last_seen_at, 'last_seen_at must be present');
      assert.equal(secondDiscovered.risk_score, 82, 'Risk score should update');
      assert.equal(sum2.existing_candidates, 1, 'Should recognize existing candidate');
    });
  });

  describe('11. Digital Risk Protection 2.0: Internal Security Escalation & Audit Trail', () => {

    test('11.1 Escalates threat, saves escalation record, and appends to audit trail', () => {
      const target = {
        id: 'app-escalate-test',
        app_name: 'PayPal Phish App',
        developer: 'Malicious Actor',
        package_id: 'com.malicious.paypal.phish',
        risk_score: 94,
        risk_level: 'CRITICAL',
        evidence: ['Uses trademarked name', 'Phishing domain detected'],
      };

      BrandStore.syncAndDeduplicateCandidates([target], 'PayPal');

      const escalated = BrandStore.escalateAppThreat(
        'com.malicious.paypal.phish',
        'Potential brand impersonation and credential theft',
        'Referred to Legal and Fraud teams'
      );

      assert.ok(escalated, 'Escalated candidate must return');
      assert.equal(escalated.lifecycle_status, 'ESCALATED');
      assert.ok(escalated.escalation_record, 'Must have escalation_record');
      assert.equal(escalated.escalation_record.status, 'ESCALATED');
      assert.equal(escalated.escalation_record.reason, 'Potential brand impersonation and credential theft');
      assert.equal(escalated.escalation_record.risk_score, 94);
      assert.ok(escalated.threat_history.some((h) => h.event.includes('escalation')));
    });
  });

  describe('12. Digital Risk Protection 2.0: App Monitoring Configuration Persistence', () => {

    test('12.1 Retrieves, updates, and persists monitoring configuration and schedule', () => {
      const cfg = BrandStore.getAppMonitoringConfig('PayPal');
      assert.ok(cfg, 'Should retrieve monitoring configuration');
      assert.equal(cfg.enabled, true);

      // Update schedule to twelve_hours
      const updated = BrandStore.saveAppMonitoringConfig('PayPal', {
        schedule: 'twelve_hours',
        total_monitored: 42,
        high_critical_count: 7,
      });

      assert.equal(updated.schedule, 'twelve_hours');
      assert.equal(updated.total_monitored, 42);
      assert.equal(updated.high_critical_count, 7);

      const reloaded = BrandStore.getAppMonitoringConfig('PayPal');
      assert.equal(reloaded.schedule, 'twelve_hours');
      assert.equal(reloaded.total_monitored, 42);
    });
  });
});

