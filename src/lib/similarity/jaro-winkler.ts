/**
 * SAFENET Jaro and Jaro-Winkler String Distance Engine
 * Implements deterministic string similarity scoring for typo-squatting,
 * phonetic prefix matching, and brand candidate comparisons.
 */

export interface JaroWinklerResult {
  jaroSimilarity: number;       // 0.0 to 1.0
  jaroWinklerSimilarity: number;// 0.0 to 1.0
  prefixLength: number;         // 0 to 4
  matchingCharacters: number;
  transpositions: number;
}

/**
 * Calculates Jaro Similarity between two strings
 */
export function calculateJaroSimilarity(s1: string, s2: string): {
  similarity: number;
  matches: number;
  transpositions: number;
} {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();

  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0 && len2 === 0) return { similarity: 1.0, matches: 0, transpositions: 0 };
  if (len1 === 0 || len2 === 0) return { similarity: 0.0, matches: 0, transpositions: 0 };
  if (str1 === str2) return { similarity: 1.0, matches: len1, transpositions: 0 };

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;

      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) {
    return { similarity: 0.0, matches: 0, transpositions: 0 };
  }

  // Count transpositions
  let k = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) {
      k++;
    }
    if (str1[i] !== str2[k]) {
      transpositions++;
    }
    k++;
  }

  const halfTranspositions = transpositions / 2;
  const similarity =
    (matches / len1 + matches / len2 + (matches - halfTranspositions) / matches) / 3.0;

  return {
    similarity: Math.min(1.0, Math.max(0.0, similarity)),
    matches,
    transpositions: halfTranspositions,
  };
}

/**
 * Calculates Jaro-Winkler Similarity with standard prefix boost (p = 0.1, max prefix 4)
 */
export function calculateJaroWinkler(
  s1: string,
  s2: string,
  prefixScalingFactor = 0.1,
  boostThreshold = 0.7
): JaroWinklerResult {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();

  const jaro = calculateJaroSimilarity(str1, str2);

  // Common prefix length up to 4 characters
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  let jwSimilarity = jaro.similarity;
  if (jaro.similarity >= boostThreshold) {
    jwSimilarity = jaro.similarity + prefix * prefixScalingFactor * (1.0 - jaro.similarity);
  }

  return {
    jaroSimilarity: Number(jaro.similarity.toFixed(4)),
    jaroWinklerSimilarity: Number(Math.min(1.0, Math.max(0.0, jwSimilarity)).toFixed(4)),
    prefixLength: prefix,
    matchingCharacters: jaro.matches,
    transpositions: jaro.transpositions,
  };
}
