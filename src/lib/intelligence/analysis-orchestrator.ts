/**
 * SAFENET Internet Intelligence Platform - Master Analysis Orchestrator
 * Coordinates safe, multi-source external intelligence pipelines,
 * risk evaluation, and evidence packaging with bounded execution budgets.
 */

import type { BrandProfile } from '@/types/brand';
import { normalizeUrlInput } from './url-normalizer';
import { validateSafeTarget } from './safe-target';
import { queryDnsIntelligence, DnsIntelligenceReport } from './dns-intel';
import { queryRdapIntelligence, RdapIntelligenceReport } from './rdap-intel';
import { inspectTlsCertificate, TlsCertificateReport } from './tls-intel';
import { inspectHttpEndpoint, HttpInspectionReport } from './http-inspector';
import { inspectHtmlContent, PageInspectionReport } from './page-inspector';
import { enrichIpIntelligence, IpIntelligenceReport } from './ip-intel';
import { queryThreatFeeds, ThreatFeedsReport } from './threat-feeds';
import { EvidenceBuilder, NormalizedEvidencePackage } from './evidence-builder';
import { evaluateExplainableRisk, RiskEvaluationResult } from '../risk-engine/explainable-risk-engine';
import { interpretEvidenceWithAi, AiInterpreterResult } from './ai-interpreter';
import { getSimilarityScore, analyzePrefixSuffixAdditions } from '../similarity/levenshtein';
import { analyzeHomoglyphs } from '../similarity/homoglyphs';

export interface FullIntelligenceScanResult {
  scanId: string;
  originalInput: string;
  normalizedTarget: string;
  detectedType: 'domain' | 'url' | 'message' | 'social_profile' | 'mobile_app';
  brand: BrandProfile;
  riskScore: number;
  riskLevel: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  confidence: number;
  isInconclusive: boolean;
  summaryPhrase: string;
  reasons: string[];
  contributions: RiskEvaluationResult['contributions'];
  dns: DnsIntelligenceReport;
  rdap: RdapIntelligenceReport;
  tls: TlsCertificateReport;
  http: HttpInspectionReport;
  page: PageInspectionReport;
  ipIntel?: IpIntelligenceReport;
  threatFeeds: ThreatFeedsReport;
  evidencePackage: NormalizedEvidencePackage;
  ai?: AiInterpreterResult;
  isLLMPowered: boolean;
  recommendedAction: {
    action: string;
    summary: string;
    urgency: 'immediate' | 'high' | 'medium' | 'low';
    steps: string[];
  };
}

const HIGH_RISK_TLDS = new Set([
  'xyz', 'top', 'win', 'bid', 'loan', 'club', 'work', 'date', 'faith',
  'click', 'link', 'buzz', 'live', 'stream', 'party', 'trade', 'racing',
  'accountant', 'download', 'review', 'men', 'vip', 'gq', 'cf', 'tk', 'ml', 'ga',
]);

/**
 * Executes the complete real internet intelligence scan pipeline on a target URL or domain.
 */
export async function runFullIntelligenceScan(
  rawInput: string,
  brand: BrandProfile
): Promise<FullIntelligenceScanResult> {
  const normResult = normalizeUrlInput(rawInput);
  if (!normResult.isValid || !normResult.data) {
    throw new Error(normResult.error || 'Failed to normalize URL input.');
  }

  const norm = normResult.data;
  const builder = new EvidenceBuilder(rawInput, norm.normalizedUrl, norm.isBareDomain ? 'domain' : 'url');

  // Step 1: SSRF Pre-flight Validation
  const safety = await validateSafeTarget(norm.hostname);
  if (!safety.isSafe) {
    builder.addServiceStatus('SafeTarget', 'blocked', safety.blockedReason);
    builder.addEvidence({
      id: 'ev-ssrf-block',
      category: 'Network',
      findingName: 'Prohibited Target Network',
      observedValue: norm.hostname,
      humanExplanation: safety.blockedReason || 'Destination targets internal or loopback IP range.',
      source: 'SSRF Boundary Filter',
      status: 'blocked',
      severity: 'critical',
      riskContribution: 100,
    });
    builder.addLimitation('Outbound inspection was blocked by SAFENET security policies.');

    const emptyDns: DnsIntelligenceReport = {
      hostname: norm.hostname,
      queriedAt: new Date().toISOString(),
      isResolved: false,
      overallStatus: 'blocked',
      ipv4: [],
      ipv6: [],
      cname: [],
      mx: [],
      ns: [],
      txt: [],
      records: {},
      errorSummary: safety.blockedReason,
    };
    const emptyRdap: RdapIntelligenceReport = {
      domain: norm.registrableDomain,
      queriedAt: new Date().toISOString(),
      status: 'unavailable',
      isPrivacyRedacted: false,
      error: 'RDAP query aborted: Target is prohibited internal address.',
    };
    const emptyTls: TlsCertificateReport = {
      hostname: norm.hostname,
      port: 443,
      queriedAt: new Date().toISOString(),
      status: 'error',
      isExpired: false,
      isNotYetValid: false,
      isSelfSigned: false,
      hostnameMatches: false,
      authorized: false,
      error: 'TLS handshake blocked by SSRF filter.',
    };
    const emptyHttp: HttpInspectionReport = {
      initialUrl: norm.normalizedUrl,
      finalUrl: norm.normalizedUrl,
      isAccessible: false,
      redirectChain: [],
      redirectCount: 0,
      durationMs: 0,
      securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false },
      blockedReason: safety.blockedReason,
    };
    const emptyPage: PageInspectionReport = {
      inspected: false,
      formCount: 0,
      passwordInputCount: 0,
      otpInputCount: 0,
      paymentFieldCount: 0,
      forms: [],
      externalScriptHosts: [],
      hasCrossDomainFormSubmission: false,
      suspiciousKeywordsDetected: [],
      brandReferencesFound: [],
    };
    const emptyFeeds: ThreatFeedsReport = { providersChecked: 0, detectionsCount: 0, findings: [] };

    const evidencePackage = builder.build();
    return {
      scanId: evidencePackage.scanId,
      originalInput: rawInput,
      normalizedTarget: norm.normalizedUrl,
      detectedType: 'url',
      brand,
      riskScore: 100,
      riskLevel: 'CRITICAL',
      confidence: 100,
      isInconclusive: false,
      summaryPhrase: 'CRITICAL: Blocked target attempting unauthorized access to internal or loopback resources.',
      reasons: [safety.blockedReason || 'Target resolves to private/internal network.'],
      contributions: [
        {
          id: 'sig-ssrf',
          vector: 'Internal Network Access Attempt',
          points: 100,
          reason: safety.blockedReason || 'SSRF violation',
          supportingEvidenceIds: ['ev-ssrf-block'],
        },
      ],
      dns: emptyDns,
      rdap: emptyRdap,
      tls: emptyTls,
      http: emptyHttp,
      page: emptyPage,
      threatFeeds: emptyFeeds,
      evidencePackage,
      isLLMPowered: false,
      recommendedAction: {
        action: 'BLOCK_INTERNAL_TRAFFIC',
        summary: 'Target attempts internal network probing.',
        urgency: 'immediate',
        steps: [
          'Enforce perimeter firewall rules preventing outbound internal probes.',
          'Log security event for incident response audit.',
        ],
      },
    };
  }

  // Step 2: Check Brand Inventory Allowlist
  const cleanBrandDomain = brand.domain.toLowerCase().trim();
  const officialDomains = [
    cleanBrandDomain,
    ...(brand.officialDomains || []).map((d: string) => d.toLowerCase().trim()),
  ];
  const isOfficialBrandDomain = officialDomains.some(
    (off) => norm.hostname === off || norm.hostname.endsWith(`.${off}`)
  );

  if (isOfficialBrandDomain) {
    builder.addEvidence({
      id: 'ev-official',
      category: 'Identity',
      findingName: 'Authenticated Official Brand Asset',
      observedValue: norm.hostname,
      humanExplanation: `Host matches authenticated official domain inventory for ${brand.name}.`,
      source: 'Verified Brand Registry',
      status: 'observed',
      severity: 'low',
      riskContribution: 0,
    });
  }

  // Step 3: Execute Real Network Lookups in Parallel
  const dnsPromise = queryDnsIntelligence(norm.hostname);
  const rdapPromise = norm.registrableDomain ? queryRdapIntelligence(norm.registrableDomain) : Promise.resolve(null);
  const tlsPromise = norm.protocol === 'https:' ? inspectTlsCertificate(norm.hostname, norm.port || 443) : Promise.resolve(null);
  const httpPromise = inspectHttpEndpoint(norm.normalizedUrl);
  const threatFeedsPromise = queryThreatFeeds(norm.normalizedUrl);

  const [dnsResult, rdapResult, tlsResult, httpResult, threatFeedsResult] = await Promise.all([
    dnsPromise,
    rdapPromise,
    tlsPromise,
    httpPromise,
    threatFeedsPromise,
  ]);

  // Step 4: Record Service Statuses and Evidence
  // DNS
  builder.addServiceStatus('DNS', dnsResult.isResolved ? 'active' : 'unavailable', dnsResult.errorSummary);
  if (dnsResult.isResolved) {
    if (dnsResult.ipv4.length > 0) {
      builder.addEvidence({
        id: 'ev-dns-a',
        category: 'Infrastructure',
        findingName: 'Resolved IPv4 Address',
        observedValue: dnsResult.ipv4.join(', '),
        humanExplanation: `Authoritative DNS records resolve host to: ${dnsResult.ipv4.join(', ')}`,
        source: 'Live DNS Query (A Records)',
        status: 'observed',
        severity: 'informational',
      });
    }
    if (dnsResult.mx.length > 0) {
      builder.addEvidence({
        id: 'ev-dns-mx',
        category: 'Infrastructure',
        findingName: 'Mail Exchange (MX) Configuration',
        observedValue: dnsResult.mx.slice(0, 2).join(', '),
        humanExplanation: `Domain accepts routed email via: ${dnsResult.mx.slice(0, 2).join(', ')}`,
        source: 'Live DNS Query (MX Records)',
        status: 'observed',
        severity: 'informational',
      });
    }
  } else {
    builder.addEvidence({
      id: 'ev-dns-nxdomain',
      category: 'Infrastructure',
      findingName: 'DNS Resolution Failure',
      observedValue: dnsResult.overallStatus,
      humanExplanation: 'Target domain does not resolve to active A or AAAA records (NXDOMAIN or inactive).',
      source: 'Live DNS Query',
      status: 'not_found',
      severity: 'low',
    });
  }

  // RDAP
  const safeRdap = rdapResult || {
    domain: norm.registrableDomain,
    queriedAt: new Date().toISOString(),
    status: 'unavailable' as const,
    isPrivacyRedacted: false,
    error: 'No registrable domain found to query RDAP.',
  };
  builder.addServiceStatus('RDAP', safeRdap.status === 'available' ? 'active' : 'unavailable', safeRdap.error);
  if (safeRdap.status === 'available') {
    if (safeRdap.registrarName) {
      builder.addEvidence({
        id: 'ev-rdap-registrar',
        category: 'Registration',
        findingName: 'Domain Registrar',
        observedValue: `${safeRdap.registrarName}${safeRdap.registrarIanaId ? ` (IANA: ${safeRdap.registrarIanaId})` : ''}`,
        humanExplanation: `Officially registered through: ${safeRdap.registrarName}`,
        source: safeRdap.sourceUrl || 'ICANN RDAP Bootstrap',
        status: 'observed',
        severity: 'informational',
      });
    }
    if (safeRdap.registrationDateUtc) {
      builder.addEvidence({
        id: 'ev-rdap-age',
        category: 'Registration',
        findingName: 'Domain Age & Registration Date',
        observedValue: `${safeRdap.domainAgeFormatted || 'Unknown'} (Created: ${safeRdap.registrationDateUtc.split('T')[0]})`,
        humanExplanation: `Registration timestamp verified via registry RDAP records.`,
        source: safeRdap.sourceUrl || 'ICANN RDAP Bootstrap',
        status: 'observed',
        severity: safeRdap.domainAgeDays !== undefined && safeRdap.domainAgeDays < 30 ? 'medium' : 'informational',
        riskContribution: safeRdap.domainAgeDays !== undefined && safeRdap.domainAgeDays < 30 ? 20 : 0,
      });
    }
  } else {
    builder.addLimitation(`Domain RDAP details unavailable (${safeRdap.error || 'unsupported TLD or rate limit'}).`);
  }

  // TLS
  const safeTls: TlsCertificateReport = tlsResult || {
    hostname: norm.hostname,
    port: 443,
    queriedAt: new Date().toISOString(),
    status: 'no_tls',
    isExpired: false,
    isNotYetValid: false,
    isSelfSigned: false,
    hostnameMatches: false,
    authorized: false,
    error: 'HTTP scheme requested; TLS negotiation not conducted.',
  };
  builder.addServiceStatus('TLS', safeTls.status === 'valid' ? 'active' : safeTls.status === 'no_tls' ? 'unavailable' : 'error', safeTls.error);
  if (safeTls.status === 'valid') {
    builder.addEvidence({
      id: 'ev-tls-valid',
      category: 'Cryptography',
      findingName: 'Valid TLS Certificate Chain',
      observedValue: `${safeTls.issuer?.commonName || 'Trusted CA'} (${safeTls.daysRemaining} days remaining)`,
      humanExplanation: `Certificate matches hostname and is authenticated by root authority.`,
      source: 'TLS Handshake',
      status: 'observed',
      severity: 'low',
    });
  } else if (safeTls.status !== 'no_tls') {
    builder.addEvidence({
      id: 'ev-tls-err',
      category: 'Cryptography',
      findingName: 'TLS Certificate Anomaly',
      observedValue: safeTls.status,
      humanExplanation: safeTls.authorizationError || safeTls.error || 'Certificate validation failed.',
      source: 'TLS Handshake',
      status: 'error',
      severity: 'high',
      riskContribution: 20,
    });
  }

  // HTTP & Redirects
  builder.addServiceStatus('HTTP', httpResult.isAccessible ? 'active' : 'unavailable', httpResult.error);
  if (httpResult.isAccessible) {
    builder.addEvidence({
      id: 'ev-http-status',
      category: 'Network',
      findingName: 'HTTP Response Code',
      observedValue: `HTTP ${httpResult.statusCode} ${httpResult.statusText || 'OK'}`,
      humanExplanation: `Server reached in ${httpResult.durationMs}ms. Response type: ${httpResult.contentType || 'unknown'}`,
      source: 'HTTP Client',
      status: 'observed',
      severity: 'informational',
    });

    if (httpResult.redirectChain.length > 0) {
      const chainStr = httpResult.redirectChain.map((h) => `${h.fromUrl} -> ${h.toUrl} (${h.statusCode})`).join(' | ');
      builder.addEvidence({
        id: 'ev-http-redirects',
        category: 'Network',
        findingName: 'HTTP Redirect Chain',
        observedValue: `${httpResult.redirectCount} redirects: ${chainStr}`,
        humanExplanation: `Target performs automated redirect routing.`,
        source: 'HTTP Hop Inspection',
        status: 'observed',
        severity: httpResult.redirectCount > 3 ? 'medium' : 'informational',
      });
    }

    if (httpResult.securityHeaders.hasHsts) {
      builder.addEvidence({
        id: 'ev-sec-hsts',
        category: 'Cryptography',
        findingName: 'Strict-Transport-Security (HSTS)',
        observedValue: 'Active',
        humanExplanation: 'HSTS header enforced, instructing browsers to disallow unencrypted connections.',
        source: 'HTTP Headers',
        status: 'observed',
        severity: 'informational',
      });
    }
  } else {
    builder.addLimitation(`HTTP endpoint unreachable: ${httpResult.error || 'Connection failure'}`);
  }

  // HTML Content Inspection
  const pageResult = inspectHtmlContent(httpResult.rawBodySnippet, norm.hostname, [brand.name, ...(brand.brandKeywords || [])]);
  builder.addServiceStatus('HTML', pageResult.inspected ? 'active' : 'unavailable');
  if (pageResult.inspected) {
    if (pageResult.title) {
      builder.addEvidence({
        id: 'ev-html-title',
        category: 'Content',
        findingName: 'Webpage Document Title',
        observedValue: pageResult.title,
        humanExplanation: `Extracted <title> element from HTML payload.`,
        source: 'HTML Content Parser',
        status: 'observed',
        severity: 'informational',
      });
    }

    if (pageResult.hasCrossDomainFormSubmission) {
      builder.addEvidence({
        id: 'ev-html-form-cross',
        category: 'Content',
        findingName: 'Cross-Domain Form Submission Target',
        observedValue: pageResult.forms.find((f) => f.isCrossDomainAction)?.targetHostname || 'External Host',
        humanExplanation: 'Form submits user-entered credentials to a foreign third-party hostname.',
        source: 'HTML Content Parser',
        status: 'observed',
        severity: 'critical',
        riskContribution: 30,
      });
    }

    if (pageResult.passwordInputCount > 0 && !isOfficialBrandDomain) {
      builder.addEvidence({
        id: 'ev-html-password',
        category: 'Content',
        findingName: 'Password Authentication Form',
        observedValue: `${pageResult.passwordInputCount} password input field(s)`,
        humanExplanation: 'Password field detected on third-party destination.',
        source: 'HTML Content Parser',
        status: 'observed',
        severity: 'medium',
        riskContribution: 20,
      });
    }

    if (pageResult.suspiciousKeywordsDetected.length > 0) {
      builder.addEvidence({
        id: 'ev-html-keywords',
        category: 'Content',
        findingName: 'Urgency & Coercion Phrasing',
        observedValue: pageResult.suspiciousKeywordsDetected.join('; '),
        humanExplanation: 'Detected psychological urgency keywords typically paired with credential lures.',
        source: 'HTML Content Parser',
        status: 'observed',
        severity: 'medium',
        riskContribution: 15,
      });
    }
  }

  // IP Intelligence Enrichment
  let ipIntel: IpIntelligenceReport | undefined = undefined;
  if (dnsResult.ipv4.length > 0) {
    ipIntel = await enrichIpIntelligence(dnsResult.ipv4[0]);
    builder.addServiceStatus('IP_Intel', ipIntel.status === 'available' ? 'active' : 'unavailable', ipIntel.error);
    if (ipIntel.status === 'available') {
      builder.addEvidence({
        id: 'ev-ip-asn',
        category: 'Network',
        findingName: 'Autonomous System & Network Identity',
        observedValue: `${ipIntel.asn || 'Unknown ASN'} (${ipIntel.asOrganization || ipIntel.isp || 'Hosting Provider'})`,
        humanExplanation: `Located in ${ipIntel.city ? `${ipIntel.city}, ` : ''}${ipIntel.country || 'Unknown Region'}`,
        source: ipIntel.provider,
        status: 'observed',
        severity: 'informational',
      });
    }
  }

  // Threat Intelligence Feeds
  builder.addServiceStatus('ThreatFeeds', threatFeedsResult.providersChecked > 0 ? 'active' : 'unconfigured');
  threatFeedsResult.findings.forEach((feed, idx) => {
    if (feed.status === 'malicious') {
      builder.addEvidence({
        id: `ev-feed-${idx}`,
        category: 'ThreatFeeds',
        findingName: `${feed.provider} Malicious Detection`,
        observedValue: feed.details || 'Identified as known malicious indicator',
        humanExplanation: `Authoritative security threat intelligence feed flagged target.`,
        source: feed.provider,
        status: 'observed',
        severity: 'critical',
        riskContribution: 80,
      });
    }
  });

  // Step 5: Domain Similarity & Brand Comparison
  const cleanBrandName = brand.name.toLowerCase().trim();
  const brandSLD = brand.domain.split('.')[0].toLowerCase().trim();
  const homoglyphs = analyzeHomoglyphs(norm.hostname);
  const prefixSuffixCheck = analyzePrefixSuffixAdditions(norm.registrableDomain, cleanBrandName);
  const nameSim = getSimilarityScore(norm.registrableDomain.split('.')[0], cleanBrandName);
  const sldSim = getSimilarityScore(norm.registrableDomain.split('.')[0], brandSLD);
  const bestSimRatio = Math.max(nameSim.similarityRatio, sldSim.similarityRatio);

  const isHighRiskTld = HIGH_RISK_TLDS.has(norm.publicSuffix);
  const isMimickingBrand =
    !isOfficialBrandDomain &&
    (prefixSuffixCheck.isCombosquatting || bestSimRatio >= 0.70 || homoglyphs.hasHomoglyphs);

  if (homoglyphs.hasHomoglyphs) {
    builder.addEvidence({
      id: 'ev-homoglyph',
      category: 'Identity',
      findingName: 'Unicode Homoglyph Characters',
      observedValue: homoglyphs.matches.map((m) => `${m.confusableChar}→${m.normalizedChar}`).join(', '),
      humanExplanation: 'Target domain replaces Latin characters with visually similar non-ASCII Unicode codepoints.',
      source: 'Unicode Confusable Engine',
      status: 'observed',
      severity: 'critical',
      riskContribution: 40,
    });
  }

  if (prefixSuffixCheck.isCombosquatting) {
    builder.addEvidence({
      id: 'ev-combosquat',
      category: 'Identity',
      findingName: 'Brand Combosquatting Pattern',
      observedValue: `Affixes: ${prefixSuffixCheck.matchedAffixes.join(', ')}`,
      humanExplanation: `Combines brand name "${brand.name}" with suspicious keywords.`,
      source: 'Combosquatting Analyzer',
      status: 'observed',
      severity: 'high',
      riskContribution: 35,
    });
  }

  if (isHighRiskTld && isMimickingBrand) {
    builder.addEvidence({
      id: 'ev-tld',
      category: 'Infrastructure',
      findingName: 'Disposable Top-Level Domain',
      observedValue: `.${norm.publicSuffix}`,
      humanExplanation: `High-risk registry paired with brand identity keywords.`,
      source: 'Domain Intelligence',
      status: 'observed',
      severity: 'high',
      riskContribution: 20,
    });
  }

  if (!isMimickingBrand && !isOfficialBrandDomain) {
    builder.addEvidence({
      id: 'ev-unrelated',
      category: 'Identity',
      findingName: 'Unrelated Third-Party Identity',
      observedValue: norm.hostname,
      humanExplanation: `Target does not mimic or solicit identity credentials for ${brand.name}.`,
      source: 'Brand Registry Comparison',
      status: 'observed',
      severity: 'low',
    });
  }

  const evidencePackage = builder.build();

  // Step 6: Risk Calculation
  const threatFeedDetails = threatFeedsResult.findings
    .filter((f) => f.status === 'malicious')
    .map((f) => `${f.provider}: ${f.details || 'Malicious'}`);

  const riskResult = evaluateExplainableRisk({
    isOfficialBrandDomain,
    isMimickingBrand,
    brandName: brand.name,
    combosquattingMatched: prefixSuffixCheck.isCombosquatting,
    matchedAffixes: prefixSuffixCheck.matchedAffixes,
    homoglyphsDetected: homoglyphs.hasHomoglyphs,
    brandSimilarityRatio: bestSimRatio,
    isHighRiskTld,
    tld: norm.publicSuffix,
    domainAgeDays: safeRdap.domainAgeDays,
    dnsResolved: dnsResult.isResolved,
    tlsStatus: safeTls.status,
    hasCrossDomainFormSubmission: pageResult.hasCrossDomainFormSubmission,
    hasPasswordInputOnUnverifiedHost: pageResult.passwordInputCount > 0,
    hasOtpInput: pageResult.otpInputCount > 0,
    hasPaymentFields: pageResult.paymentFieldCount > 0,
    suspiciousKeywordsCount: pageResult.suspiciousKeywordsDetected.length,
    threatFeedDetectionsCount: threatFeedsResult.detectionsCount,
    threatFeedDetails,
    evidenceItems: evidencePackage.evidenceItems,
  });

  // Step 7: Optional AI Interpretation (Graceful fallback if unconfigured)
  const aiResult = await interpretEvidenceWithAi(evidencePackage, riskResult, brand.name);

  // Step 8: Recommended Actions
  const steps: string[] = [];
  let urgency: 'immediate' | 'high' | 'medium' | 'low' = 'low';
  let actionTitle = 'VERIFY_IDENTITY';

  if (isOfficialBrandDomain) {
    actionTitle = 'TRUSTED_OFFICIAL_ASSET';
    urgency = 'low';
    steps.push(
      `Authenticate directly: This asset is confirmed as an official ${brand.name} property.`,
      'Review digital certificates to verify standard HTTPS encryption.'
    );
  } else if (riskResult.score >= 70) {
    actionTitle = 'ISOLATE_AND_MITIGATE';
    urgency = 'immediate';
    steps.push(
      'Do not enter credentials, OTPs, or financial details at this destination.',
      'Enforce DNS sinkhole blocking across enterprise resolvers.',
      `File registrar abuse notice requesting suspension for impersonating ${brand.name}.`,
      'Notify brand security response team of active credential harvesting vector.'
    );
  } else if (riskResult.score >= 40) {
    actionTitle = 'EXERCISE_CAUTION';
    urgency = 'medium';
    steps.push(
      'Verify destination authenticity through secondary out-of-band channels.',
      'Reject unexpected login or payment verification requests.',
      'Monitor asset for structural DNS changes.'
    );
  } else {
    actionTitle = 'STANDARD_HYGIENE';
    urgency = 'low';
    steps.push(
      'Exercise standard web hygiene.',
      'Ensure connection uses verified HTTPS before transmitting data.'
    );
  }

  return {
    scanId: evidencePackage.scanId,
    originalInput: rawInput,
    normalizedTarget: norm.normalizedUrl,
    detectedType: norm.isBareDomain ? 'domain' : 'url',
    brand,
    riskScore: riskResult.score,
    riskLevel: riskResult.severity,
    confidence: riskResult.confidence,
    isInconclusive: riskResult.isInconclusive,
    summaryPhrase: riskResult.summaryPhrase,
    reasons: riskResult.primaryReasons,
    contributions: riskResult.contributions,
    dns: dnsResult,
    rdap: safeRdap,
    tls: safeTls,
    http: httpResult,
    page: pageResult,
    ipIntel,
    threatFeeds: threatFeedsResult,
    evidencePackage,
    ai: aiResult,
    isLLMPowered: aiResult.isLLMPowered,
    recommendedAction: {
      action: actionTitle,
      summary: riskResult.summaryPhrase,
      urgency,
      steps,
    },
  };
}
