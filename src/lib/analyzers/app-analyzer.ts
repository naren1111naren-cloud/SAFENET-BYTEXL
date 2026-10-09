import { BrandProfile, MobileAppEntity, ThreatEvidence, ThreatIOC } from '@/types/brand';
import { getSimilarityScore, analyzePrefixSuffixAdditions } from '@/lib/similarity/levenshtein';
import { analyzeScamSignals } from '@/lib/scam-detector/scam-signals';
import { evaluateRiskScore, generateExplainableIndicators, generateThreatTimeline } from '@/lib/risk-engine/risk-calculator';

export const HIGH_RISK_PERMISSIONS = [
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.REQUEST_INSTALL_PACKAGES',
  'android.permission.READ_PHONE_STATE',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_CONTACTS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.CAMERA',
];

export interface AppAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summaryPhrase: string;
  riskBreakdown: any;
  explainableIndicators: any[];
  evidenceList: ThreatEvidence[];
  extractedIocs: ThreatIOC[];
  timeline: any[];
  reasons: string[];
  flaggedPermissions: string[];
}

export function analyzeMobileApp(
  app: MobileAppEntity,
  brand: BrandProfile
): AppAnalysisResult {
  const brandName = (brand.name || 'Brand').trim();
  const cleanBrand = brandName.toLowerCase();
  const appName = (app.appName || '').trim();
  const cleanAppName = appName.toLowerCase();
  const packageName = (app.packageName || '').trim().toLowerCase();
  const developerName = (app.developerName || '').trim();
  const description = (app.description || '').trim();

  // 1. Check if this is the registered authorized app
  let isAuthorizedApp = false;
  if (brand.appPackageName && brand.appPackageName.toLowerCase() === packageName) {
    isAuthorizedApp = true;
  }
  if (brand.authorizedAppIds && brand.authorizedAppIds.map(a => a.toLowerCase()).includes(packageName)) {
    isAuthorizedApp = true;
  }

  // 2. Brand name resemblance in App Title
  const titleSimilarity = getSimilarityScore(cleanAppName, cleanBrand);
  const prefixCheck = analyzePrefixSuffixAdditions(cleanAppName, cleanBrand);
  let titleMatchRatio = titleSimilarity.similarityRatio;
  if (cleanAppName.includes(cleanBrand)) {
    titleMatchRatio = Math.max(titleMatchRatio, 0.9);
  }

  // 3. Package name spoofing
  const packageSimilarity = getSimilarityScore(packageName, brand.appPackageName || cleanBrand);
  const isPackageSpoofing = packageName.includes(cleanBrand) && !isAuthorizedApp;

  // 4. Developer check
  const isSuspiciousDeveloper =
    !isAuthorizedApp &&
    (developerName.toLowerCase() === 'unknown' ||
      developerName.toLowerCase().includes('freelance') ||
      developerName.toLowerCase().includes('apk') ||
      !developerName.toLowerCase().includes(cleanBrand));

  // 5. Suspicious permissions analysis
  const permissions = app.permissions || [];
  const flaggedPermissions = permissions.filter((perm) =>
    HIGH_RISK_PERMISSIONS.some((hr) => perm.toLowerCase().includes(hr.toLowerCase()) || hr.toLowerCase().includes(perm.toLowerCase()))
  );
  const hasDangerousPermissions = flaggedPermissions.length >= 2;

  // 6. Scam signals in description
  const scamSignals = analyzeScamSignals(description + ' ' + (app.appStoreUrl || ''));

  // 7. Evaluate composite risk
  const evaluated = evaluateRiskScore({
    usernameSimilarityRatio: isAuthorizedApp ? 0 : titleMatchRatio,
    logoSimilarityRatio: undefined,
    bioContentSimilarityRatio: description.toLowerCase().includes(cleanBrand) ? 0.75 : 0.0,
    hasSuspiciousUrl: isPackageSpoofing || Boolean(app.appStoreUrl && !app.appStoreUrl.includes('play.google.com') && !app.appStoreUrl.includes('apple.com')),
    isCombosquattingUrl: prefixCheck.isCombosquatting,
    hasPaymentRequest: scamSignals.hasUpiRequests || description.toLowerCase().includes('loan') || description.toLowerCase().includes('cashback'),
    hasUrgency: scamSignals.hasUrgency,
    hasFakeRefundOrPrize: scamSignals.hasFakeRefunds,
    hasSuspiciousPermissions: hasDangerousPermissions,
    isMismatchedDeveloper: isSuspiciousDeveloper,
    isUnregisteredAsset: !isAuthorizedApp,
  });

  if (isAuthorizedApp) {
    evaluated.score = 5;
    evaluated.riskLevel = 'LOW';
    evaluated.summaryPhrase = 'Risk Score: 5/100 (Verified Authorized Official App).';
  }

  // 8. Explainable Indicators
  const explainableIndicators = generateExplainableIndicators(
    {
      usernameSimilarityRatio: isAuthorizedApp ? 0 : titleMatchRatio,
      logoSimilarityRatio: undefined,
      hasSuspiciousUrl: isPackageSpoofing,
      isCombosquattingUrl: prefixCheck.isCombosquatting,
      hasPaymentRequest: scamSignals.hasUpiRequests,
      hasSuspiciousPermissions: hasDangerousPermissions,
      isMismatchedDeveloper: isSuspiciousDeveloper,
      isUnregisteredAsset: !isAuthorizedApp,
    },
    brand,
    appName
  );

  // 9. Evidence List
  const evidenceList: ThreatEvidence[] = [];
  const reasons: string[] = [];

  if (titleMatchRatio > 0.6 && !isAuthorizedApp) {
    const desc = `App title "${appName}" mimics official brand "${brandName}".`;
    evidenceList.push({
      id: 'ev-app-title',
      category: 'Identity',
      title: 'App Title Impersonation',
      description: desc,
      severity: titleMatchRatio > 0.8 ? 'critical' : 'high',
      value: appName,
    });
    reasons.push(desc);
  }

  if (isPackageSpoofing) {
    const desc = `Package ID "${packageName}" mimics official package namespace without authorization.`;
    evidenceList.push({
      id: 'ev-pkg-spoof',
      category: 'Technical',
      title: 'Rogue Package Namespace Spoofing',
      description: desc,
      severity: 'critical',
      value: packageName,
    });
    reasons.push(desc);
  }

  if (isSuspiciousDeveloper) {
    const desc = `Developer "${developerName || 'Unknown'}" is not authorized or verified by ${brandName}.`;
    evidenceList.push({
      id: 'ev-developer',
      category: 'Trust & Safety',
      title: 'Unverified Third-Party Developer',
      description: desc,
      severity: 'high',
      value: developerName || 'Unknown Developer',
    });
    reasons.push(desc);
  }

  if (flaggedPermissions.length > 0) {
    const desc = `Requests ${flaggedPermissions.length} high-risk permissions (${flaggedPermissions.slice(0, 3).join(', ')}${flaggedPermissions.length > 3 ? '...' : ''}) disproportionate to standard consumer app utility.`;
    evidenceList.push({
      id: 'ev-perms',
      category: 'Permissions',
      title: 'High-Risk Android Permissions',
      description: desc,
      severity: flaggedPermissions.length >= 3 ? 'critical' : 'high',
      value: flaggedPermissions.join(', '),
    });
    reasons.push(desc);
  }

  if (scamSignals.hasFakeRefunds || description.toLowerCase().includes('loan') || description.toLowerCase().includes('reward')) {
    const desc = `App description promises unearned financial rewards, predatory loans, or fast cashbacks under ${brandName}'s name.`;
    evidenceList.push({
      id: 'ev-app-lure',
      category: 'Fraud Scheme',
      title: 'Predatory Loan / Reward Scheme',
      description: desc,
      severity: 'critical',
    });
    reasons.push(desc);
  }

  const timeline = generateThreatTimeline(`${appName} (${packageName})`, evaluated.score);

  return {
    riskScore: evaluated.score,
    riskLevel: evaluated.riskLevel,
    summaryPhrase: evaluated.summaryPhrase,
    riskBreakdown: evaluated.breakdown,
    explainableIndicators,
    evidenceList,
    extractedIocs: scamSignals.extractedIocs,
    timeline,
    reasons: reasons.length > 0 ? reasons : ['Potentially malicious or counterfeit mobile application.'],
    flaggedPermissions,
  };
}
