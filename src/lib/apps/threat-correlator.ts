/**
 * SAFENET - APK Threat Correlator
 * Correlates static APK findings with Google Play store listings and SAFENET Domain Intelligence.
 */

import { ApkStaticAnalysisResult, ApkCorrelationReport } from './types';
import { appStoreService } from './app-store-service';
import { analyzeDomain } from '@/lib/analyzers/domain-analyzer';
import { BrandStore } from '@/lib/brand-store';

export async function correlateApkThreat(
  apk: ApkStaticAnalysisResult,
  targetBrandName: string = 'PayPal'
): Promise<ApkCorrelationReport> {
  const brand = BrandStore.getBrand() || {
    id: `brand-${targetBrandName.toLowerCase()}`,
    name: targetBrandName,
    domain: `${targetBrandName.toLowerCase()}.com`,
    handles: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Correlate with Google Play Store using SerpApi
  let storeMatchVerdict: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'UNKNOWN' = 'UNKNOWN';
  let matchedApp: any = undefined;
  let storeMatchDetails = 'Google Play comparison performed.';

  try {
    const searchRes = await appStoreService.searchGooglePlay(apk.application_label || targetBrandName, {
      country: 'in',
      brandContext: brand,
    });

    const candidateByPkg = searchRes.candidates.find(
      (c) => c.package_id.toLowerCase().trim() === apk.package_id.toLowerCase().trim()
    );

    const officialApp = searchRes.candidates.find((c) => c.is_verified_official);

    if (candidateByPkg) {
      matchedApp = candidateByPkg;
      if (candidateByPkg.is_verified_official) {
        storeMatchVerdict = 'MATCH';
        storeMatchDetails = `Exact match found on Google Play for verified package "${apk.package_id}".`;
      } else {
        storeMatchVerdict = 'MATCH';
        storeMatchDetails = `Listed on Google Play under package "${apk.package_id}" by publisher "${candidateByPkg.developer}".`;
      }
    } else if (officialApp) {
      matchedApp = officialApp;
      storeMatchVerdict = 'PARTIAL MATCH';
      storeMatchDetails = `Official Google Play app uses package "${officialApp.package_id}", but this APK is compiled under "${apk.package_id}" (Potential clone / repackage).`;
    } else if (searchRes.candidates.length > 0) {
      storeMatchVerdict = 'NO MATCH';
      storeMatchDetails = `No Google Play listing matching package "${apk.package_id}" was identified. Appears to be sideloaded or third-party distributed.`;
    } else {
      storeMatchVerdict = 'NO MATCH';
      storeMatchDetails = 'No matching Google Play listings identified.';
    }
  } catch (err) {
    storeMatchVerdict = 'UNKNOWN';
    storeMatchDetails = 'Google Play store lookup failed or was unavailable.';
  }

  // 2. Correlate extracted domains with existing SAFENET Domain Intelligence
  const highRiskDomains: { domain: string; risk_score: number; risk_level: string; reasons: string[] }[] = [];
  let maxDomainRisk = 0;

  for (const domainName of apk.extracted_domains.slice(0, 5)) {
    try {
      const domainResult = await analyzeDomain(domainName, brand);
      if (domainResult.riskScore >= 50) {
        highRiskDomains.push({
          domain: domainName,
          risk_score: domainResult.riskScore,
          risk_level: domainResult.riskLevel,
          reasons: domainResult.reasons.slice(0, 3),
        });
      }
      if (domainResult.riskScore > maxDomainRisk) {
        maxDomainRisk = domainResult.riskScore;
      }
    } catch {
      // Domain lookup skip
    }
  }

  // 3. Calculate Base APK Risk Score from permissions and signature
  let apkRiskScore = 0;

  // Sensitive permissions score (up to 40)
  const criticalPermCount = apk.permissions.sensitive.filter((p) => p.risk_level === 'CRITICAL').length;
  const highPermCount = apk.permissions.sensitive.filter((p) => p.risk_level === 'HIGH').length;

  apkRiskScore += Math.min(35, criticalPermCount * 12 + highPermCount * 6);

  // Missing v1 signature (sideloaded / unaligned APK)
  if (!apk.has_v1_signature) {
    apkRiskScore += 15;
  }

  // Suspicious store match status (Partial match = rogue clone)
  if (storeMatchVerdict === 'PARTIAL MATCH') {
    apkRiskScore += 25;
  } else if (storeMatchVerdict === 'NO MATCH') {
    apkRiskScore += 10;
  }

  apkRiskScore = Math.min(80, apkRiskScore);

  // 4. Combined Threat Score (APK Risk + Domain Threat Correlation)
  let combinedRiskScore = apkRiskScore;
  if (maxDomainRisk >= 70) {
    // Elevate significantly if APK calls known malicious domain
    combinedRiskScore = Math.max(combinedRiskScore, Math.round((apkRiskScore * 0.5) + (maxDomainRisk * 0.5) + 15));
  } else if (maxDomainRisk >= 40) {
    combinedRiskScore = Math.max(combinedRiskScore, Math.round((apkRiskScore * 0.7) + (maxDomainRisk * 0.3)));
  }

  combinedRiskScore = Math.min(100, Math.max(0, combinedRiskScore));

  let combinedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (combinedRiskScore >= 80) combinedRiskLevel = 'CRITICAL';
  else if (combinedRiskScore >= 60) combinedRiskLevel = 'HIGH';
  else if (combinedRiskScore >= 30) combinedRiskLevel = 'MEDIUM';
  else combinedRiskLevel = 'LOW';

  // 5. Generate Evidence Trail
  const evidence: string[] = [];

  if (storeMatchVerdict === 'PARTIAL MATCH') {
    evidence.push(`• Store Discrepancy: App name claims brand affinity, but package ID "${apk.package_id}" differs from official store listing.`);
  } else if (storeMatchVerdict === 'MATCH') {
    evidence.push(`• Store Listing: Package matches an indexed Google Play entry (${storeMatchDetails}).`);
  } else {
    evidence.push(`• Unlisted Application: Package "${apk.package_id}" is not indexed on the official Google Play store.`);
  }

  if (criticalPermCount > 0) {
    evidence.push(`• Critical Permissions: Declares ${criticalPermCount} critical permissions including SMS interception or overlay capabilities.`);
  }

  if (highRiskDomains.length > 0) {
    const domList = highRiskDomains.map((d) => `"${d.domain}" (Risk: ${d.risk_score})`).join(', ');
    evidence.push(`• Malicious C2 / Phishing Domains: Embedded code connects to high-risk external endpoints: ${domList}.`);
  }

  if (!apk.has_v1_signature) {
    evidence.push('• Integrity Alert: Lacks standard APK cryptographic manifest signature (META-INF).');
  }

  if (evidence.length === 0) {
    evidence.push('• Standard Android application package with minimal risk indicators.');
  }

  // 6. Assessment Verdict Summary
  let assessmentVerdict = '';
  if (combinedRiskLevel === 'CRITICAL') {
    assessmentVerdict = 'ROGUE TROJAN / CLONE APK DETECTED';
  } else if (combinedRiskLevel === 'HIGH') {
    assessmentVerdict = 'HIGH RISK UNVERIFIED APPLICATION';
  } else if (combinedRiskLevel === 'MEDIUM') {
    assessmentVerdict = 'ELEVATED RISK SIDELOADED APPLICATION';
  } else {
    assessmentVerdict = 'LOW RISK APPLICATION ARTIFACT';
  }

  return {
    apk,
    store_match: {
      verdict: storeMatchVerdict,
      matched_app: matchedApp,
      details: storeMatchDetails,
    },
    domain_intelligence: {
      total_domains_scanned: apk.extracted_domains.length,
      high_risk_domains: highRiskDomains,
      max_domain_risk: maxDomainRisk,
    },
    apk_risk_score: apkRiskScore,
    combined_risk_score: combinedRiskScore,
    combined_risk_level: combinedRiskLevel,
    assessment_verdict: assessmentVerdict,
    evidence,
  };
}
