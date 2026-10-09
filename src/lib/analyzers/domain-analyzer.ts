import { BrandProfile, ThreatEvidence, ThreatIOC, ThreatTimelineEvent } from '@/types/brand';
import { getSimilarityScore, analyzePrefixSuffixAdditions } from '@/lib/similarity/levenshtein';
import { analyzeHomoglyphs } from '@/lib/similarity/homoglyphs';
import { calculateRiskLevel, evaluateRiskScore, generateExplainableIndicators, generateThreatTimeline } from '@/lib/risk-engine/risk-calculator';
import { lookupDns, DnsRecordInfo } from '@/lib/dns-lookup';

export interface DomainAnalysisResult {
  targetInput: string;
  domain: string;
  hostname: string;
  registrableDomain: string;
  tld: string;
  subdomain: string;
  isOfficial: boolean;
  dns: DnsRecordInfo;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  summaryPhrase: string;
  reasons: string[];
  evidenceList: ThreatEvidence[];
  explainableIndicators: any[];
  riskBreakdown: any;
  extractedIocs: ThreatIOC[];
  timeline: ThreatTimelineEvent[];
}

const MULTI_PART_TLDS = [
  'co.in', 'com.au', 'co.uk', 'org.in', 'gov.in', 'net.in', 'ac.in', 'edu.in',
  'co.jp', 'com.sg', 'com.br', 'co.nz', 'co.za', 'com.mx', 'com.tr', 'org.uk'
];

const HIGH_RISK_TLDS = new Set([
  'xyz', 'top', 'vip', 'work', 'click', 'fit', 'loan', 'tk', 'ml', 'ga',
  'cf', 'gq', 'buzz', 'rest', 'icu', 'monster', 'online', 'site', 'cc', 'to'
]);

/**
 * Accurately parses an input string or URL into hostname, TLD, registrable domain (SLD), and subdomain.
 */
export function parseDomain(rawInput: string): {
  hostname: string;
  tld: string;
  registrableDomain: string;
  subdomain: string;
} {
  let cleaned = rawInput.trim().toLowerCase();

  // Remove protocol
  cleaned = cleaned.replace(/^[a-zA-Z]+:\/\//, '');

  // Remove path, query, hash
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Remove port
  cleaned = cleaned.split(':')[0];

  // Remove trailing dots
  cleaned = cleaned.replace(/\.+$/, '');

  const hostname = cleaned;

  // Determine TLD
  let matchedTld = '';
  for (const multi of MULTI_PART_TLDS) {
    if (hostname.endsWith('.' + multi)) {
      matchedTld = multi;
      break;
    }
  }

  if (!matchedTld) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      matchedTld = parts[parts.length - 1];
    } else {
      matchedTld = '';
    }
  }

  const withoutTld = matchedTld ? hostname.slice(0, -(matchedTld.length + 1)) : hostname;
  const domainParts = withoutTld.split('.');
  const registrableDomain = domainParts[domainParts.length - 1] || hostname;
  const subdomain = domainParts.length > 1 ? domainParts.slice(0, -1).join('.') : '';

  return {
    hostname,
    tld: matchedTld,
    registrableDomain,
    subdomain,
  };
}

/**
 * Comprehensive Domain Threat Analyzer
 */
export async function analyzeDomain(
  rawInput: string,
  brand: BrandProfile
): Promise<DomainAnalysisResult> {
  const { hostname, tld, registrableDomain, subdomain } = parseDomain(rawInput);

  const cleanBrandName = brand.name.trim().toLowerCase();
  const brandDomainParsed = parseDomain(brand.domain);
  const cleanBrandDomain = brandDomainParsed.hostname;
  const brandSLD = brandDomainParsed.registrableDomain;

  const officialDomains = [
    cleanBrandDomain,
    ...(brand.officialDomains || []).map((d) => parseDomain(d).hostname),
  ];

  // 1. Check if domain is an officially registered brand domain or subdomain
  const isExactOfficial = officialDomains.some(
    (off) => hostname === off || hostname.endsWith('.' + off)
  );

  console.log(`[SAFENET] Input: ${rawInput} -> Parsed Hostname: ${hostname}, SLD: ${registrableDomain}, TLD: ${tld}, Official: ${isExactOfficial}`);

  // 2. Perform real DNS lookup
  const dnsInfo = await lookupDns(hostname);

  // 3. Official Domain Path
  if (isExactOfficial) {
    const reasons = [`Verified official domain belonging to ${brand.name}.`];
    const evidenceList: ThreatEvidence[] = [
      {
        id: 'ev-official',
        category: 'Identity',
        title: 'Verified Official Brand Asset',
        description: `Host "${hostname}" matches the authenticated domain inventory for ${brand.name}.`,
        severity: 'low',
        value: hostname,
        status: 'available',
        source: 'Brand Registry',
      },
    ];

    if (dnsInfo.resolved && dnsInfo.ipv4.length > 0) {
      evidenceList.push({
        id: 'ev-dns-a',
        category: 'Infrastructure',
        title: 'Resolved IPv4 Address',
        description: `Authoritative IP address resolution: ${dnsInfo.ipv4.join(', ')}`,
        severity: 'low',
        value: dnsInfo.ipv4.join(', '),
        status: 'available',
        source: 'Live DNS Query',
      });
    }

    if (dnsInfo.mx.length > 0) {
      evidenceList.push({
        id: 'ev-dns-mx',
        category: 'Infrastructure',
        title: 'Mail Exchanger (MX) Records',
        description: `Valid enterprise mail records detected: ${dnsInfo.mx.slice(0, 2).join(', ')}`,
        severity: 'low',
        value: dnsInfo.mx.join(', '),
        status: 'available',
        source: 'Live DNS Query',
      });
    }

    const explainableIndicators = generateExplainableIndicators(
      {
        usernameSimilarityRatio: 0,
        hasSuspiciousUrl: false,
        isCombosquattingUrl: false,
        isUnregisteredAsset: false,
      },
      brand,
      hostname
    );

    const timeline = generateThreatTimeline(hostname, 0);

    return {
      targetInput: rawInput,
      domain: hostname,
      hostname,
      registrableDomain,
      tld,
      subdomain,
      isOfficial: true,
      dns: dnsInfo,
      riskScore: 0,
      riskLevel: 'LOW',
      confidence: 98,
      summaryPhrase: `Clean: ${hostname} is a verified official asset for ${brand.name}.`,
      reasons,
      evidenceList,
      explainableIndicators,
      riskBreakdown: {
        usernameSimilarity: 0,
        logoSimilarity: 0,
        bioContentSimilarity: 0,
        suspiciousUrl: 0,
        paymentScamIndicators: 0,
        accountAppBehavior: 0,
        totalScore: 0,
      },
      extractedIocs: dnsInfo.ipv4.map((ip) => ({ type: 'ip' as const, value: ip })),
      timeline,
    };
  }

  // 4. Non-Official Domain Heuristic Evaluation
  const homoglyphAnalysis = analyzeHomoglyphs(hostname);

  // Compare registrable domain against brand
  const nameDistance = getSimilarityScore(registrableDomain, cleanBrandName);
  const domainDistance = getSimilarityScore(registrableDomain, brandSLD);
  const prefixSuffixCheck = analyzePrefixSuffixAdditions(registrableDomain, cleanBrandName);

  const bestSimRatio = Math.max(nameDistance.similarityRatio, domainDistance.similarityRatio);
  const isHighRiskTld = HIGH_RISK_TLDS.has(tld);

  // Determine if there is actual brand targeting / mimicry
  const isMimickingBrand = prefixSuffixCheck.isCombosquatting || bestSimRatio >= 0.70 || homoglyphAnalysis.hasHomoglyphs;

  const reasons: string[] = [];
  const evidenceList: ThreatEvidence[] = [];
  const extractedIocs: ThreatIOC[] = [];

  // Populate DNS evidence
  if (dnsInfo.resolved && dnsInfo.ipv4.length > 0) {
    evidenceList.push({
      id: 'ev-dns-a',
      category: 'Infrastructure',
      title: 'Resolved IPv4 Address',
      description: `Active DNS resolution detected: ${dnsInfo.ipv4.join(', ')}`,
      severity: isMimickingBrand ? 'high' : 'low',
      value: dnsInfo.ipv4.join(', '),
      status: 'available',
      source: 'Live DNS Query',
    });
    dnsInfo.ipv4.forEach((ip) => extractedIocs.push({ type: 'ip', value: ip }));
  } else if (!dnsInfo.resolved) {
    evidenceList.push({
      id: 'ev-dns-a',
      category: 'Infrastructure',
      title: 'DNS Resolution Status',
      description: 'Domain does not resolve to active A/AAAA records.',
      severity: isMimickingBrand ? 'medium' : 'low',
      value: 'Unresolved / Inactive',
      status: 'unavailable',
      source: 'Live DNS Query',
    });
  }

  if (dnsInfo.mx.length > 0) {
    evidenceList.push({
      id: 'ev-dns-mx',
      category: 'Infrastructure',
      title: 'Mail Exchanger (MX) Records',
      description: `Active mail exchangers: ${dnsInfo.mx.slice(0, 2).join(', ')}`,
      severity: 'low',
      value: dnsInfo.mx.join(', '),
      status: 'available',
      source: 'Live DNS Query',
    });
  }

  // Evaluate heuristics
  if (prefixSuffixCheck.isCombosquatting) {
    const desc = `Combosquatting pattern detected: unauthorized affix added (${prefixSuffixCheck.matchedAffixes.join(', ')}).`;
    reasons.push(desc);
    evidenceList.push({
      id: 'ev-combosquat',
      category: 'Identity',
      title: 'Combosquatting Keyword Deception',
      description: desc,
      severity: 'critical',
      value: prefixSuffixCheck.matchedAffixes.join(', '),
      status: 'available',
      source: 'Lexical Heuristics',
    });
  }

  if (bestSimRatio >= 0.75 && !prefixSuffixCheck.isCombosquatting) {
    const desc = `High lexical similarity (${Math.round(bestSimRatio * 100)}%) with brand "${brand.name}".`;
    reasons.push(desc);
    evidenceList.push({
      id: 'ev-sim',
      category: 'Identity',
      title: 'High Brand Lexical Similarity',
      description: desc,
      severity: 'high',
      value: `${Math.round(bestSimRatio * 100)}% match`,
      status: 'available',
      source: 'String Metric Engine',
    });
  }

  if (homoglyphAnalysis.hasHomoglyphs) {
    const desc = `Detected Unicode homoglyphs / script obfuscation in domain name.`;
    reasons.push(desc);
    evidenceList.push({
      id: 'ev-homoglyph',
      category: 'Encoding',
      title: 'Homoglyph Obfuscation',
      description: desc,
      severity: 'critical',
      value: homoglyphAnalysis.matches.map((m) => `${m.confusableChar}→${m.normalizedChar}`).join(', '),
      status: 'available',
      source: 'Unicode Analyzer',
    });
  }

  if (isHighRiskTld && isMimickingBrand) {
    const desc = `High-risk / disposable TLD (.${tld}) paired with brand-targeting keywords.`;
    reasons.push(desc);
    evidenceList.push({
      id: 'ev-tld',
      category: 'Infrastructure',
      title: 'Suspicious Top-Level Domain',
      description: desc,
      severity: 'high',
      value: `.${tld}`,
      status: 'available',
      source: 'Domain Intelligence',
    });
  }

  // If completely unrelated benign domain
  if (!isMimickingBrand) {
    reasons.push(`No significant brand impersonation signals detected against ${brand.name}.`);
    evidenceList.push({
      id: 'ev-unrelated',
      category: 'Identity',
      title: 'Unrelated Third-Party Domain',
      description: `Domain "${hostname}" does not appear to target or mimic "${brand.name}".`,
      severity: 'low',
      value: 'Benign / Unrelated',
      status: 'available',
      source: 'Brand Registry Comparison',
    });
  }

  // Risk Score calculation
  let domainScore = 0;
  if (isMimickingBrand) {
    if (homoglyphAnalysis.hasHomoglyphs) {
      domainScore += 40;
    }
    if (prefixSuffixCheck.isCombosquatting) {
      domainScore += 35; // Unauthorized brand combosquatting
    } else if (bestSimRatio >= 0.75) {
      domainScore += 30; // High brand lexical similarity
    } else if (bestSimRatio >= 0.60) {
      domainScore += 15;
    }

    if (isHighRiskTld) {
      domainScore += 25; // High-risk disposable TLD pairing
    }

    if (!dnsInfo.resolved) {
      domainScore += 15; // Transient / unresolved domain targeting brand
    }
  }

  const finalScore = Math.min(100, domainScore);
  const riskLevel = calculateRiskLevel(finalScore);

  // Calculate dynamic confidence
  let confidence = 75;
  if (!isMimickingBrand && dnsInfo.resolved) {
    confidence = 92; // High confidence it's an unrelated, resolving legitimate domain
  } else if (prefixSuffixCheck.isCombosquatting && isHighRiskTld) {
    confidence = 94; // Multiple strong corroborating signals
  } else if (isMimickingBrand) {
    confidence = 86;
  } else {
    confidence = 72;
  }

  const timeline = generateThreatTimeline(hostname, finalScore);

  return {
    targetInput: rawInput,
    domain: hostname,
    hostname,
    registrableDomain,
    tld,
    subdomain,
    isOfficial: false,
    dns: dnsInfo,
    riskScore: finalScore,
    riskLevel,
    confidence,
    summaryPhrase: isMimickingBrand
      ? `Elevated risk: "${hostname}" exhibits brand mimicry characteristics targeting ${brand.name}.`
      : `Low risk: "${hostname}" exhibits no deceptive association with ${brand.name}.`,
    reasons,
    evidenceList,
    explainableIndicators: generateExplainableIndicators(
      {
        usernameSimilarityRatio: isMimickingBrand ? bestSimRatio : 0,
        hasSuspiciousUrl: isMimickingBrand,
        isCombosquattingUrl: prefixSuffixCheck.isCombosquatting,
        isUnregisteredAsset: isMimickingBrand,
      },
      brand,
      hostname
    ),
    riskBreakdown: {
      usernameSimilarity: isMimickingBrand ? Math.round(bestSimRatio * 25) : 0,
      logoSimilarity: 0,
      bioContentSimilarity: 0,
      suspiciousUrl: prefixSuffixCheck.isCombosquatting ? 20 : 0,
      paymentScamIndicators: 0,
      accountAppBehavior: isHighRiskTld ? 10 : 0,
      totalScore: finalScore,
    },
    extractedIocs,
    timeline,
  };
}
