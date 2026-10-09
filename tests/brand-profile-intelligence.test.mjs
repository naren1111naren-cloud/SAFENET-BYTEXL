import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateSafeTarget } from '../src/lib/intelligence/safe-target.ts';
import { normalizeUrlInput } from '../src/lib/intelligence/url-normalizer.ts';
import { analyzeWebsiteIdentity } from '../src/lib/analyzers/website-identity-analyzer.ts';

describe('SAFENET Feature 1: Real-Time Brand Profile Intelligence Suite', () => {

  describe('1. SSRF and Destination Safety Validation', () => {
    test('blocks loopback IP 127.0.0.1', async () => {
      const res = await validateSafeTarget('127.0.0.1');
      assert.strictEqual(res.isSafe, false);
      assert.match(res.blockedReason || '', /SSRF protection/i);
    });

    test('blocks localhost hostname', async () => {
      const res = await validateSafeTarget('localhost');
      assert.strictEqual(res.isSafe, false);
      assert.match(res.blockedReason || '', /reserved or internal/i);
    });

    test('blocks AWS / Cloud metadata address 169.254.169.254', async () => {
      const res = await validateSafeTarget('169.254.169.254');
      assert.strictEqual(res.isSafe, false);
      assert.match(res.blockedReason || '', /link-local/i);
    });

    test('blocks RFC 1918 private subnets (10.0.0.1, 192.168.1.1, 172.16.0.1)', async () => {
      const check10 = await validateSafeTarget('10.0.0.1');
      assert.strictEqual(check10.isSafe, false);

      const check192 = await validateSafeTarget('192.168.1.1');
      assert.strictEqual(check192.isSafe, false);

      const check172 = await validateSafeTarget('172.16.0.1');
      assert.strictEqual(check172.isSafe, false);
    });

    test('blocks internal domain suffixes (.local, .internal, .lan)', async () => {
      const res = await validateSafeTarget('admin-portal.internal');
      assert.strictEqual(res.isSafe, false);
      assert.match(res.blockedReason || '', /internal suffix/i);
    });
  });

  describe('2. URL Input Normalization', () => {
    test('normalizes bare domain to https protocol', () => {
      const res = normalizeUrlInput('example.com');
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.data?.normalizedUrl, 'https://example.com/');
      assert.strictEqual(res.data?.hostname, 'example.com');
      assert.strictEqual(res.data?.registrableDomain, 'example.com');
    });

    test('handles multi-level public suffixes like co.in and co.uk', () => {
      const resIn = normalizeUrlInput('paytm.co.in');
      assert.strictEqual(resIn.isValid, true);
      assert.strictEqual(resIn.data?.registrableDomain, 'paytm.co.in');
      assert.strictEqual(resIn.data?.publicSuffix, 'co.in');

      const resUk = normalizeUrlInput('https://shop.brand.co.uk/store');
      assert.strictEqual(resUk.isValid, true);
      assert.strictEqual(resUk.data?.registrableDomain, 'brand.co.uk');
      assert.strictEqual(resUk.data?.subdomain, 'shop');
    });

    test('rejects unsupported protocols and embedded credentials', () => {
      const resFile = normalizeUrlInput('file:///etc/passwd');
      assert.strictEqual(resFile.isValid, false);

      const resCreds = normalizeUrlInput('https://admin:secret@malicious.com');
      assert.strictEqual(resCreds.isValid, false);
    });
  });

  describe('3. Website Identity Analyzer - JSON-LD Organization & Branding', () => {
    const sampleHtmlWithJsonLd = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paytm: Secure UPI Payments, Recharge & Money Transfer</title>
        <meta name="description" content="India's leading financial services company offering UPI, wallet, payments and banking." />
        <link rel="canonical" href="https://paytm.com/" />
        <meta property="og:title" content="Paytm - Payment for Everyone" />
        <meta property="og:image" content="https://paytm.com/static/og-banner.png" />
        <link rel="apple-touch-icon" href="/static/apple-icon.png" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Paytm",
          "legalName": "One97 Communications Limited",
          "url": "https://paytm.com",
          "logo": "https://paytm.com/static/brand-logo.png",
          "alternateName": ["Paytm Wallet", "One97"],
          "sameAs": [
            "https://twitter.com/Paytm",
            "https://www.instagram.com/paytm",
            "https://www.linkedin.com/company/paytm",
            "https://www.facebook.com/Paytm",
            "https://www.youtube.com/@paytm",
            "https://t.me/paytmofficial"
          ]
        }
        </script>
      </head>
      <body>
        <footer>
          <a href="https://play.google.com/store/apps/details?id=net.one97.paytm">Get on Google Play</a>
          <a href="https://apps.apple.com/in/app/paytm-payments-upi-money/id473941634">Download on App Store</a>
          <a href="https://twitter.com/share?url=https://paytm.com">Share on Twitter</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://paytm.com">Share on FB</a>
        </footer>
      </body>
      </html>
    `;

    test('extracts brand name, legal name, and aliases accurately', () => {
      const identity = analyzeWebsiteIdentity({
        html: sampleHtmlWithJsonLd,
        targetUrl: 'https://paytm.com',
        finalUrl: 'https://paytm.com/',
        brandNameInput: 'Paytm',
      });

      assert.strictEqual(identity.brandName, 'Paytm');
      assert.strictEqual(identity.legalName, 'One97 Communications Limited');
      assert.strictEqual(identity.canonicalDomain, 'paytm.com');
      assert.ok(identity.aliases.includes('One97 Communications Limited'));
      assert.ok(identity.aliases.includes('One97 Communications')); // Cleaned legal suffix
      assert.ok(identity.aliases.includes('Paytm Wallet'));
    });

    test('extracts logo from Organization schema with high confidence', () => {
      const identity = analyzeWebsiteIdentity({
        html: sampleHtmlWithJsonLd,
        targetUrl: 'https://paytm.com',
        finalUrl: 'https://paytm.com/',
        brandNameInput: 'Paytm',
      });

      assert.strictEqual(identity.logoUrl, 'https://paytm.com/static/brand-logo.png');
      assert.strictEqual(identity.logoSource, 'organization_schema');
      assert.strictEqual(identity.logoConfidence, 'high');
    });

    test('extracts all verified social profiles from JSON-LD sameAs and ignores share widgets', () => {
      const identity = analyzeWebsiteIdentity({
        html: sampleHtmlWithJsonLd,
        targetUrl: 'https://paytm.com',
        finalUrl: 'https://paytm.com/',
        brandNameInput: 'Paytm',
      });

      assert.strictEqual(identity.socialProfiles.length, 6);

      const twitter = identity.socialProfiles.find((s) => s.platform === 'twitter');
      assert.ok(twitter);
      assert.strictEqual(twitter.username, '@Paytm');
      assert.strictEqual(twitter.confidence, 'high');
      assert.strictEqual(twitter.source, 'organization_schema');

      const instagram = identity.socialProfiles.find((s) => s.platform === 'instagram');
      assert.ok(instagram);
      assert.strictEqual(instagram.username, '@paytm');

      const linkedin = identity.socialProfiles.find((s) => s.platform === 'linkedin');
      assert.ok(linkedin);
      assert.strictEqual(linkedin.username, 'paytm');

      const telegram = identity.socialProfiles.find((s) => s.platform === 'telegram');
      assert.ok(telegram);
      assert.strictEqual(telegram.username, '@paytmofficial');

      // Verify share widgets were NOT mistakenly added as official profiles
      const shareProfiles = identity.socialProfiles.filter((s) => s.username.toLowerCase().includes('share'));
      assert.strictEqual(shareProfiles.length, 0);
    });

    test('extracts official mobile application links for Google Play and Apple App Store', () => {
      const identity = analyzeWebsiteIdentity({
        html: sampleHtmlWithJsonLd,
        targetUrl: 'https://paytm.com',
        finalUrl: 'https://paytm.com/',
        brandNameInput: 'Paytm',
      });

      assert.strictEqual(identity.applications.length, 2);

      const playStore = identity.applications.find((a) => a.store === 'Google Play');
      assert.ok(playStore);
      assert.strictEqual(playStore.packageId, 'net.one97.paytm');
      assert.strictEqual(playStore.source, 'official_website');
      assert.strictEqual(playStore.confidence, 'high');

      const appStore = identity.applications.find((a) => a.store === 'Apple App Store');
      assert.ok(appStore);
      assert.strictEqual(appStore.packageId, 'id473941634');
      assert.strictEqual(appStore.source, 'official_website');
      assert.strictEqual(appStore.confidence, 'high');
    });

    test('verifies signals and evidence provenance', () => {
      const identity = analyzeWebsiteIdentity({
        html: sampleHtmlWithJsonLd,
        targetUrl: 'https://paytm.com',
        finalUrl: 'https://paytm.com/',
        brandNameInput: 'Paytm',
      });

      const schemaSignal = identity.signals.find((s) => s.name === 'Organization Schema');
      assert.strictEqual(schemaSignal?.status, 'verified');

      const domainSignal = identity.signals.find((s) => s.name === 'Canonical Domain');
      assert.strictEqual(domainSignal?.status, 'verified');

      const socialSignal = identity.signals.find((s) => s.name === 'Social Links Discovered');
      assert.strictEqual(socialSignal?.status, 'detected');

      assert.ok(identity.evidence.length >= 8);
      assert.ok(identity.evidence.some((e) => e.category === 'Identity Provenance'));
      assert.ok(identity.evidence.some((e) => e.category === 'Social Asset Baseline'));
      assert.ok(identity.evidence.some((e) => e.category === 'Application Asset Baseline'));
    });
  });

  describe('4. Website Identity Analyzer - Fallbacks for Non-Schema Webpages', () => {
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nike. Just Do It. Nike IN</title>
        <meta property="og:image" content="https://static.nike.com/logo.png" />
      </head>
      <body>
        <div>
          <a href="https://instagram.com/nike">Follow Nike on IG</a>
          <a href="https://x.com/Nike">X / Twitter</a>
        </div>
      </body>
      </html>
    `;

    test('falls back gracefully to OpenGraph image when JSON-LD is absent', () => {
      const identity = analyzeWebsiteIdentity({
        html: fallbackHtml,
        targetUrl: 'https://nike.com',
        finalUrl: 'https://nike.com/',
        brandNameInput: 'Nike',
      });

      assert.strictEqual(identity.brandName, 'Nike');
      assert.strictEqual(identity.logoUrl, 'https://static.nike.com/logo.png');
      assert.strictEqual(identity.logoSource, 'og_image');
      assert.strictEqual(identity.logoConfidence, 'medium');

      assert.strictEqual(identity.socialProfiles.length, 2);
      assert.ok(identity.socialProfiles.some((s) => s.platform === 'instagram' && s.username === '@nike'));
      assert.ok(identity.socialProfiles.some((s) => s.platform === 'twitter' && s.username === '@Nike'));
    });

    test('does not invent social accounts or mobile apps if not present in HTML', () => {
      const bareHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Minimal Website</title></head>
        <body><p>Welcome to our site.</p></body>
        </html>
      `;

      const identity = analyzeWebsiteIdentity({
        html: bareHtml,
        targetUrl: 'https://minimal.org',
        finalUrl: 'https://minimal.org/',
        brandNameInput: 'Minimal Org',
      });

      assert.strictEqual(identity.socialProfiles.length, 0);
      assert.strictEqual(identity.applications.length, 0);
      assert.strictEqual(identity.logoUrl, undefined);

      const socialSig = identity.signals.find((s) => s.name === 'Social Links Discovered');
      assert.strictEqual(socialSig?.status, 'not_found');

      const appSig = identity.signals.find((s) => s.name === 'Mobile App Store Links');
      assert.strictEqual(appSig?.status, 'not_found');
    });
  });

  describe('5. Official SAFENET Branding Asset & Provider Type Integrity', () => {
    test('official brand mark images and favicon assets exist on disk', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const requiredAssets = [
        'public/images/safenet-logo.png',
        'public/safenet-logo.png',
        'public/favicon.ico',
        'public/favicon-32x32.png',
        'public/favicon-16x16.png',
        'public/apple-touch-icon.png',
        'src/app/favicon.ico',
        'src/app/icon.png',
        'src/app/apple-icon.png',
      ];

      for (const relPath of requiredAssets) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const stat = await fs.stat(fullPath);
        assert.ok(stat.size > 0, `Asset ${relPath} must exist and be non-empty`);
      }
    });

    test('providers enforce literal type narrowing (as const)', async () => {
      const { ItunesAppStoreProvider } = await import('../src/lib/providers/apps/itunes-provider.ts');
      const { WebSearchProvider } = await import('../src/lib/providers/search/search-provider.ts');
      const { SocialMediaProvider } = await import('../src/lib/providers/social/social-provider.ts');

      const itunes = new ItunesAppStoreProvider();
      const search = new WebSearchProvider();
      const social = new SocialMediaProvider();

      assert.strictEqual(itunes.type, 'apps');
      assert.strictEqual(search.type, 'search');
      assert.strictEqual(social.type, 'social');
    });
  });
});

