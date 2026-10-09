/**
 * Levenshtein and Damerau-Levenshtein Edit Distance Algorithms
 * Used to detect typo-squatting, character transposition, insertion, and omission.
 */

export interface DistanceResult {
  distance: number;
  similarity: number; // 0.0 to 1.0
  similarityRatio: number; // 0.0 to 1.0 (alias)
  ratioPercent: number; // 0 to 100
  isExact: boolean;
}

/**
 * Standard Levenshtein distance calculation
 */
export function calculateLevenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Damerau-Levenshtein distance (accounts for adjacent character transpositions, e.g. "pyatm" -> "paytm")
 */
export function calculateDamerauLevenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Transposition check
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalized string similarity ratio (0 to 1) based on Damerau-Levenshtein
 */
export function getSimilarityScore(strA: string, strB: string): DistanceResult {
  const cleanA = strA.trim().toLowerCase();
  const cleanB = strB.trim().toLowerCase();

  if (cleanA === cleanB) {
    return { distance: 0, similarity: 1.0, similarityRatio: 1.0, ratioPercent: 100, isExact: true };
  }

  const maxLen = Math.max(cleanA.length, cleanB.length);
  if (maxLen === 0) {
    return { distance: 0, similarity: 1.0, similarityRatio: 1.0, ratioPercent: 100, isExact: true };
  }

  const distance = calculateDamerauLevenshtein(cleanA, cleanB);
  const similarity = Math.max(0, 1 - distance / maxLen);
  const ratioPercent = Math.round(similarity * 100);

  return {
    distance,
    similarity,
    similarityRatio: similarity,
    ratioPercent,
    isExact: distance === 0,
  };
}

/**
 * Checks if a suspect string contains a brand name with additions (e.g., "paytm-helpdesk", "login-hdfcbank")
 */
export function analyzePrefixSuffixAdditions(suspect: string, brand: string): {
  containsBrand: boolean;
  isCombosquatting: boolean;
  matchedAffixes: string[];
  prefix?: string;
  suffix?: string;
  riskBoost: number;
} {
  // Strip protocol and any path/query before cleaning
  let s = suspect.toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0];

  // Strip common multi-part or single-part TLD if suspect looks like a domain / hostname
  s = s.replace(/\.(co\.in|com\.au|co\.uk|org\.in|gov\.in|ac\.in|edu\.in|com|org|net|xyz|top|vip|info|biz|site|online|app|dev|io|ai|in|us|uk|ca|de|fr|ru|cn|jp|eu|pro|mobi|tech|space|icu)$/i, '');
  // Strip www. prefix if present
  s = s.replace(/^www\./i, '');

  // Strip TLD from brand if a domain was passed
  let b = brand.toLowerCase().trim().replace(/^https?:\/\//, '').split('/')[0];
  b = b.replace(/\.(co\.in|com\.au|co\.uk|org\.in|gov\.in|ac\.in|edu\.in|com|org|net|xyz|top|vip|info|biz|site|online|app|dev|io|ai|in|us|uk|ca|de|fr|ru|cn|jp|eu|pro|mobi|tech|space|icu)$/i, '');
  b = b.replace(/^www\./i, '');

  const cleanSuspect = s.replace(/[^a-z0-9]/g, '');
  const cleanBrand = b.replace(/[^a-z0-9]/g, '');

  // Exact match to the brand name is not combosquatting
  if (cleanSuspect === cleanBrand) {
    return { containsBrand: true, isCombosquatting: false, matchedAffixes: [], riskBoost: 0 };
  }

  if (cleanSuspect.includes(cleanBrand)) {
    const idx = cleanSuspect.indexOf(cleanBrand);
    const prefix = cleanSuspect.slice(0, idx);
    const suffix = cleanSuspect.slice(idx + cleanBrand.length);

    // High risk if keyword additions like "care", "refund", "login", "kyc", "support", "help"
    const scamKeywords = ['care', 'help', 'support', 'login', 'secure', 'kyc', 'refund', 'cashback', 'verify', 'update', 'portal', 'desk', 'service', 'official', 'rewards', 'grant', 'pay', 'wallet', 'bank', 'service'];
    const matchedAffixes = scamKeywords.filter(kw => (prefix && prefix.includes(kw)) || (suffix && suffix.includes(kw)));

    // Exclude empty or benign affixes
    const otherAffixes = [prefix, suffix].filter(Boolean).filter(aff => aff !== 'www' && aff !== 'm' && aff !== 'app');

    const isCombo = matchedAffixes.length > 0 || otherAffixes.length > 0;
    const finalAffixes = matchedAffixes.length > 0 ? matchedAffixes : otherAffixes;

    return {
      containsBrand: true,
      isCombosquatting: isCombo,
      matchedAffixes: finalAffixes,
      prefix: prefix || undefined,
      suffix: suffix || undefined,
      riskBoost: matchedAffixes.length > 0 ? 35 : (isCombo ? 20 : 0),
    };
  }

  return { containsBrand: false, isCombosquatting: false, matchedAffixes: [], riskBoost: 0 };
}
