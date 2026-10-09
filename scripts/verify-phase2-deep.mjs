import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function check(input, brandName = 'Paytm', brandDomain = 'paytm.com') {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, brandName, brandDomain }),
  });
  const duration = Date.now() - start;
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { rawText: await res.text() };
  }
  return { status: res.status, data, duration };
}

async function runAll() {
  console.log('=== STARTING DEEP VERIFICATION OF SAFENET PHASE 2 ===\n');

  // Scenario 1: google.com
  console.log('--- 1. Testing google.com ---');
  const resGoogle = await check('https://google.com');
  console.log('Google Status:', resGoogle.status);
  console.log('Google Target:', resGoogle.data.normalizedTarget);
  console.log('Google Risk Score:', resGoogle.data.riskScore, resGoogle.data.riskLevel);
  console.log('Google DNS Status:', resGoogle.data.dns?.overallStatus);
  console.log('Google DNS A:', resGoogle.data.dns?.records?.A?.values);
  console.log('Google DNS AAAA:', resGoogle.data.dns?.records?.AAAA?.values);
  console.log('Google DNS MX:', resGoogle.data.dns?.records?.MX?.values);
  console.log('Google DNS NS:', resGoogle.data.dns?.records?.NS?.values);
  console.log('Google RDAP Registrar:', resGoogle.data.rdap?.registrarName);
  console.log('Google RDAP Created:', resGoogle.data.rdap?.registrationDateUtc);
  console.log('Google RDAP Age:', resGoogle.data.rdap?.domainAgeFormatted);
  console.log('Google TLS Status:', resGoogle.data.tls?.status);
  console.log('Google TLS Issuer:', resGoogle.data.tls?.issuer?.commonName);
  console.log('Google TLS Valid To:', resGoogle.data.tls?.validToUtc);
  console.log('Google HTTP Code:', resGoogle.data.http?.statusCode);
  console.log('Google HTTP Headers:', Object.keys(resGoogle.data.http?.securityHeaders || {}));
  console.log('Google Page Title:', resGoogle.data.page?.title);
  console.log('Google IP:', resGoogle.data.ipIntel?.ip);
  console.log('Google ASN:', resGoogle.data.ipIntel?.asn);
  console.log('Google Org:', resGoogle.data.ipIntel?.organization);
  console.log('Google AI Status:', resGoogle.data.aiStatus);
  console.log('Google Threat Feeds Status:', resGoogle.data.threatFeeds?.findings?.map(f => `${f.provider}:${f.status}`));
  console.log('Google Reasons:', resGoogle.data.reasons);
  console.log('Google Duration:', resGoogle.duration, 'ms\n');

  // Scenario 2: wikipedia.org
  console.log('--- 2. Testing wikipedia.org ---');
  const resWiki = await check('https://wikipedia.org');
  console.log('Wiki Status:', resWiki.status);
  console.log('Wiki Risk Score:', resWiki.data.riskScore, resWiki.data.riskLevel);
  console.log('Wiki DNS A:', resWiki.data.dns?.records?.A?.values);
  console.log('Wiki RDAP Registrar:', resWiki.data.rdap?.registrarName);
  console.log('Wiki RDAP Created:', resWiki.data.rdap?.registrationDateUtc);
  console.log('Wiki TLS Status:', resWiki.data.tls?.status);
  console.log('Wiki TLS Issuer:', resWiki.data.tls?.issuer?.commonName);
  console.log('Wiki HTTP Status:', resWiki.data.http?.statusCode);
  console.log('Wiki Title:', resWiki.data.page?.title);
  console.log('Wiki Forms Count:', resWiki.data.page?.formCount);
  console.log('Wiki Password Input Count:', resWiki.data.page?.passwordInputCount);
  console.log('Wiki Duration:', resWiki.duration, 'ms\n');

  // Scenario 3: Nonexistent domain
  console.log('--- 3. Testing nonexistent-random-domain-safenet-998877.org ---');
  const resNonexistent = await check('https://nonexistent-random-domain-safenet-998877.org');
  console.log('Nonexistent Status:', resNonexistent.status);
  console.log('Nonexistent Risk Score:', resNonexistent.data.riskScore, resNonexistent.data.riskLevel);
  console.log('Nonexistent DNS Status:', resNonexistent.data.dns?.overallStatus);
  console.log('Nonexistent RDAP Status:', resNonexistent.data.rdap?.status);
  console.log('Nonexistent TLS Status:', resNonexistent.data.tls?.status);
  console.log('Nonexistent HTTP Status:', resNonexistent.data.http?.statusCode);
  console.log('Nonexistent Inconclusive:', resNonexistent.data.isInconclusive);
  console.log('Nonexistent Limitations:', resNonexistent.data.limitations);
  console.log('Nonexistent Duration:', resNonexistent.duration, 'ms\n');

  // Scenario 4: Controlled suspicious domain
  console.log('--- 4. Testing http://paytm-support-verify.xyz ---');
  const resSuspicious = await check('http://paytm-support-verify.xyz');
  console.log('Suspicious Status:', resSuspicious.status);
  console.log('Suspicious Risk Score:', resSuspicious.data.riskScore, resSuspicious.data.riskLevel);
  console.log('Suspicious Reasons:', resSuspicious.data.reasons);
  console.log('Suspicious Contributions:', resSuspicious.data.contributions?.map(c => `${c.vector}: ${c.points}pts`));
  console.log('Suspicious Duration:', resSuspicious.duration, 'ms\n');

  // Scenario 5: Normal HTTPS website (cloudflare.com)
  console.log('--- 5. Testing https://cloudflare.com ---');
  const resCf = await check('https://cloudflare.com');
  console.log('CF Status:', resCf.status);
  console.log('CF Risk Score:', resCf.data.riskScore, resCf.data.riskLevel);
  console.log('CF DNS A:', resCf.data.dns?.records?.A?.values);
  console.log('CF RDAP Registrar:', resCf.data.rdap?.registrarName);
  console.log('CF TLS Issuer:', resCf.data.tls?.issuer?.commonName);
  console.log('CF HTTP Status:', resCf.data.http?.statusCode);
  console.log('CF Redirect hops:', resCf.data.http?.redirectCount);
  console.log('CF Duration:', resCf.duration, 'ms\n');

  // Scenario 6: Message containing suspicious URL
  console.log('--- 6. Testing Message containing suspicious URL ---');
  const resMsg = await check('URGENT: Your Paytm Wallet is blocked. Re-verify KYC now at http://paytm-kyc-update.xyz or account will be closed in 24 hours.');
  console.log('Message Status:', resMsg.status);
  console.log('Message Detected Type:', resMsg.data.detectedType);
  console.log('Message Risk Score:', resMsg.data.riskScore, resMsg.data.riskLevel);
  console.log('Message Reasons:', resMsg.data.reasons);
  console.log('Message Extracted IOCs:', resMsg.data.extractedIocs);
  console.log('Message Duration:', resMsg.duration, 'ms\n');

  // Scenario 7: Malformed Inputs
  console.log('--- 7. Testing Malformed inputs ---');
  const resEmpty = await check('');
  console.log('Empty Input Status:', resEmpty.status, resEmpty.data);

  const resMalformedUrl = await check('http://');
  console.log('http:// Status:', resMalformedUrl.status, resMalformedUrl.data?.error || resMalformedUrl.data?.riskScore);

  const resInvalidScheme = await check('ftp://my-storage.server.net/file.iso');
  console.log('ftp:// Status:', resInvalidScheme.status, resInvalidScheme.data?.error || resInvalidScheme.data?.riskScore);

  // Scenario 8: Security & SSRF Protections
  console.log('\n--- 8. Testing Security & SSRF Protections ---');
  const resLoopback = await check('http://127.0.0.1:8080/internal-status');
  console.log('Loopback 127.0.0.1 Risk:', resLoopback.data.riskScore, resLoopback.data.riskLevel);
  console.log('Loopback Reasons:', resLoopback.data.reasons);

  const resLocalhost = await check('http://localhost:3000/api/check');
  console.log('Localhost Risk:', resLocalhost.data.riskScore, resLocalhost.data.riskLevel);
  console.log('Localhost Reasons:', resLocalhost.data.reasons);

  const resMetadata = await check('http://169.254.169.254/latest/meta-data/');
  console.log('Cloud Metadata Risk:', resMetadata.data.riskScore, resMetadata.data.riskLevel);
  console.log('Cloud Metadata Reasons:', resMetadata.data.reasons);

  const resPrivateRange = await check('http://192.168.1.1/router-login');
  console.log('Private 192.168.1.1 Risk:', resPrivateRange.data.riskScore, resPrivateRange.data.riskLevel);
  console.log('Private Reasons:', resPrivateRange.data.reasons);

  console.log('\n=== DEEP VERIFICATION EXECUTION COMPLETE ===');
}

runAll().catch(console.error);
