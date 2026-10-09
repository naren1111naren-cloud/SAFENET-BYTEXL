/**
 * SAFENET Look-alike & Name Similarity Detection Engine
 * Advanced multi-metric similarity detection:
 * - Safe Unicode normalization & zero-width stripping
 * - Separator & punctuation standardization
 * - True Damerau-Levenshtein edit distance (insertions, deletions, substitutions, transpositions)
 * - Jaro-Winkler prefix-weighted string distance
 * - Token Jaccard similarity & word overlap
 * - Added-word & suspicious keyword analysis (Support, Official, Help, Security, Customer Care)
 * - Script-aware confusable / homoglyph detection
 * - Configurable length-dependent adaptive thresholds (short vs medium vs long brands)
 * - Dictionary protection and false-positive reduction
 */

import { calculateDamerauLevenshtein, getSimilarityScore, analyzePrefixSuffixAdditions } from './levenshtein';
import { analyzeHomoglyphs } from './homoglyphs';
import { calculateJaroWinkler } from './jaro-winkler';
import { normalizeCandidateText, toCompactStem } from './unicode-normalizer';
import { analyzeAddedKeywords } from './keywords';
import { COMMON_DICTIONARY_WORDS } from './legitimate-registry';

export type VariationType =
  | 'exact_match'
  | 'character_transposition'
  | 'character_substitution'
  | 'character_insertion'
  | 'character_deletion'
  | 'homoglyph_confusable'
  | 'added_keyword'
  | 'separator_variation'
  | 'repeated_character'
  | 'combosquatting'
  | 'low_similarity';

export interface LookalikeSignal {
  type:
    | 'exact_match'
    | 'high_similarity'
    | 'homoglyph_substitution'
    | 'repeated_characters'
    | 'delimiter_variation'
    | 'combosquatting_affix'
    | 'token_overlap'
    | 'character_transposition'
    | 'character_substitution'
    | 'omission_or_insertion'
    | 'added_suspicious_words';
  description: string;
  weight: number;
}

export interface LookalikeMetricBreakdown {
  damerauLevenshteinDistance: number;
  levenshteinSimilarity: number;       // 0.0 - 1.0
  jaroWinklerSimilarity: number;       // 0.0 - 1.0
  tokenJaccardSimilarity: number;      // 0.0 - 1.0
  compositeSimilarityPercent: number;  // 0 - 100
}

export interface LookalikeEvaluation {
  brandName: string;
  candidateName: string;
  normalizedBrand: string;
  normalizedCandidate: string;
  editDistance: number;
  similarityRatio: number; // 0.0 - 1.0
  tokenSimilarity: number;  // 0.0 - 1.0
  jaroWinklerSimilarity: number; // 0.0 - 1.0
  isLookalike: boolean;
  variationType: VariationType;
  metrics: LookalikeMetricBreakdown;
  signals: LookalikeSignal[];
  similarityScore0to20: number; // Normalized 0-20 score for risk engine compatibility
  lengthCategory: 'short' | 'medium' | 'long';
  isCommonWordSuppressed?: boolean;
}

/**
 * Calculates Token Jaccard Similarity between two strings
 */
export function calculateTokenSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
    );

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detects suspicious repeated characters (e.g. payttm, nikke)
 */
export function detectRepeatedCharacters(candidate: string, brand: string): boolean {
  const cleanCand = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanCand === cleanBrand) return false;

  // Collapse consecutive identical chars (e.g. "paytttm" -> "paytm")
  const collapsedCand = cleanCand.replace(/(.)\1+/g, '$1');
  const collapsedBrand = cleanBrand.replace(/(.)\1+/g, '$1');

  return collapsedCand === collapsedBrand && cleanCand.length > cleanBrand.length;
}

/**
 * Detects whether adjacent characters were transposed
 */
export function isAdjacentTransposition(candidate: string, brand: string): boolean {
  const s1 = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = brand.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1.length !== s2.length || s1.length < 2) return false;

  let diffCount = 0;
  let firstDiff = -1;
  let secondDiff = -1;

  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) {
      diffCount++;
      if (firstDiff === -1) firstDiff = i;
      else if (secondDiff === -1) secondDiff = i;
    }
  }

  return (
    diffCount === 2 &&
    secondDiff === firstDiff + 1 &&
    s1[firstDiff] === s2[secondDiff] &&
    s1[secondDiff] === s2[firstDiff]
  );
}

/**
 * Evaluates candidate name against brand name with comprehensive deterministic signals,
 * length-adaptive thresholds, and false-positive minimization.
 */
export function evaluateLookalikeMatch(
  candidateString: string,
  brandName: string
): LookalikeEvaluation {
  const rawCand = (candidateString || '').trim();
  const rawBrand = (brandName || '').trim();

  // 1. Safe Unicode Normalization
  const normCand = normalizeCandidateText(rawCand);
  const normBrand = normalizeCandidateText(rawBrand);

  const cleanCandStem = normCand.compactStem;
  const cleanBrandStem = normBrand.compactStem;

  const brandLen = cleanBrandStem.length;
  const lengthCategory: 'short' | 'medium' | 'long' =
    brandLen <= 4 ? 'short' : brandLen <= 8 ? 'medium' : 'long';

  const signals: LookalikeSignal[] = [];

  // 2. Exact match check
  const isExactRaw = rawCand.toLowerCase() === rawBrand.toLowerCase();
  const isExactNormalized = normCand.safelyNormalized === normBrand.safelyNormalized;
  const isExactStem = cleanCandStem === cleanBrandStem && cleanBrandStem.length > 0;

  // 3. String Metrics
  const dLev = calculateDamerauLevenshtein(normCand.safelyNormalized, normBrand.safelyNormalized);
  const maxLen = Math.max(normCand.safelyNormalized.length, normBrand.safelyNormalized.length);
  const levSim = maxLen === 0 ? 1.0 : Math.max(0, 1 - dLev / maxLen);

  const jw = calculateJaroWinkler(normCand.safelyNormalized, normBrand.safelyNormalized);
  const tokenSim = calculateTokenSimilarity(normCand.cleanSeparators, normBrand.cleanSeparators);

  // 4. Homoglyphs & Confusables
  const homoglyphs = analyzeHomoglyphs(rawCand);

  // 5. Added keywords / combosquatting
  const addedWords = analyzeAddedKeywords(rawCand, rawBrand);
  const prefixCheck = analyzePrefixSuffixAdditions(rawCand, rawBrand);

  // 6. Repeated characters
  const hasRepeated = detectRepeatedCharacters(rawCand, rawBrand);

  // 7. Transposition check
  const hasTransposition = isAdjacentTransposition(cleanCandStem, cleanBrandStem);

  // 8. Delimiter / Spacing checks
  const hasDelimiterVariation =
    !isExactRaw &&
    cleanCandStem === cleanBrandStem &&
    (rawCand.includes('-') || rawCand.includes('_') || rawCand.includes(' ') || rawCand.includes('.') || rawCand.includes('+') || rawCand.includes('/'));

  // 9. Short brand dictionary suppression safeguard
  let isCommonWordSuppressed = false;
  if (lengthCategory === 'short' && COMMON_DICTIONARY_WORDS.has(cleanCandStem)) {
    // If it's a common word like "bike" or "like" and has NO homoglyph, NO added words ("support"),
    // then suppress classification as lookalike to eliminate false positives
    if (!homoglyphs.hasHomoglyphs && !addedWords.hasAddedWords && !hasDelimiterVariation) {
      isCommonWordSuppressed = true;
    }
  }

  // 10. Classify Variation Type
  let variationType: VariationType = 'low_similarity';

  if (homoglyphs.hasHomoglyphs && (levSim >= 0.7 || cleanCandStem.includes(cleanBrandStem) || cleanBrandStem.includes(cleanCandStem) || cleanCandStem === cleanBrandStem)) {
    variationType = 'homoglyph_confusable';
  } else if (hasDelimiterVariation) {
    variationType = 'separator_variation';
  } else if (isExactRaw || isExactNormalized) {
    variationType = 'exact_match';
  } else if (hasRepeated) {
    variationType = 'repeated_character';
  } else if (hasTransposition) {
    variationType = 'character_transposition';
  } else if (addedWords.hasAddedWords) {
    variationType = 'added_keyword';
  } else if (prefixCheck.isCombosquatting) {
    variationType = 'combosquatting';
  } else if (dLev === 1 && cleanCandStem.length === cleanBrandStem.length) {
    variationType = 'character_substitution';
  } else if (dLev === 1 && cleanCandStem.length > cleanBrandStem.length) {
    variationType = 'character_insertion';
  } else if (dLev === 1 && cleanCandStem.length < cleanBrandStem.length) {
    variationType = 'character_deletion';
  } else if (levSim >= 0.75 || jw.jaroWinklerSimilarity >= 0.85) {
    variationType = 'character_substitution';
  }

  // 11. Compile explainable signals
  if (isExactRaw || isExactNormalized) {
    signals.push({
      type: 'exact_match',
      description: `Exact name match with protected brand "${rawBrand}".`,
      weight: 20,
    });
  } else {
    // Similarity signals based on length adaptive thresholds
    const highThreshold = lengthCategory === 'short' ? 0.85 : 0.75;
    const modThreshold = lengthCategory === 'short' ? 0.75 : 0.60;

    if (levSim >= highThreshold && !isCommonWordSuppressed) {
      signals.push({
        type: 'high_similarity',
        description: `High lexical similarity (${Math.round(levSim * 100)}%, Damerau-Levenshtein distance: ${dLev}, Jaro-Winkler: ${Math.round(jw.jaroWinklerSimilarity * 100)}%).`,
        weight: 15,
      });
    } else if (levSim >= modThreshold && !isCommonWordSuppressed) {
      signals.push({
        type: 'high_similarity',
        description: `Moderate string similarity (${Math.round(levSim * 100)}%).`,
        weight: 8,
      });
    }

    if (hasTransposition && !isCommonWordSuppressed) {
      signals.push({
        type: 'character_transposition',
        description: `Adjacent character transposition detected targeting "${rawBrand}".`,
        weight: 15,
      });
    }

    if (homoglyphs.hasHomoglyphs) {
      signals.push({
        type: 'homoglyph_substitution',
        description: `Unicode confusable / homoglyph detected: ${homoglyphs.matches.map((m) => `${m.confusableChar}→${m.normalizedChar} (${m.charName})`).join(', ')}.`,
        weight: 18,
      });
    }

    if (addedWords.hasAddedWords) {
      signals.push({
        type: 'added_suspicious_words',
        description: addedWords.explanation,
        weight: addedWords.riskBoost >= 25 ? 18 : 14,
      });
    } else if (prefixCheck.isCombosquatting) {
      signals.push({
        type: 'combosquatting_affix',
        description: `Combosquatting keyword additions detected: [${prefixCheck.matchedAffixes.join(', ')}].`,
        weight: 14,
      });
    }

    if (hasRepeated) {
      signals.push({
        type: 'repeated_characters',
        description: `Repeated character variation targeting brand "${rawBrand}".`,
        weight: 12,
      });
    }

    if (hasDelimiterVariation) {
      signals.push({
        type: 'delimiter_variation',
        description: `Delimiter, hyphen, or spacing variation around brand stem "${rawBrand}".`,
        weight: 10,
      });
    }

    if (tokenSim >= 0.5 && !isCommonWordSuppressed) {
      signals.push({
        type: 'token_overlap',
        description: `Significant word token overlap (${Math.round(tokenSim * 100)}%).`,
        weight: 8,
      });
    }
  }

  // 12. Calculate Composite Similarity Percentage (0-100)
  // Combines Levenshtein + Jaro-Winkler + Token similarity
  let compositeSimilarityPercent = 0;
  if (isExactRaw || isExactNormalized) {
    compositeSimilarityPercent = 100;
  } else {
    const rawComposite =
      levSim * 0.45 +
      jw.jaroWinklerSimilarity * 0.40 +
      tokenSim * 0.15;
    compositeSimilarityPercent = Math.min(100, Math.max(0, Math.round(rawComposite * 100)));
  }

  // 13. Normalized 0-20 score for backward-compatible risk engine
  let score0to20 = 0;
  if (isExactRaw || isExactNormalized) {
    score0to20 = 20;
  } else if (signals.length > 0 && !isCommonWordSuppressed) {
    const rawSum = signals.reduce((acc, s) => acc + s.weight, 0);
    score0to20 = Math.min(20, Math.max(0, Math.round(rawSum * 0.7)));
  }

  // 14. Determine isLookalike flag
  let isLookalike = false;
  if (isExactRaw || isExactNormalized) {
    isLookalike = true;
  } else if (!isCommonWordSuppressed) {
    if (lengthCategory === 'short') {
      // Short names require higher string similarity (>= 0.85) OR specific deception signals
      isLookalike =
        (levSim >= 0.85 && dLev <= 1) ||
        homoglyphs.hasHomoglyphs ||
        addedWords.hasAddedWords ||
        hasDelimiterVariation ||
        hasRepeated ||
        hasTransposition ||
        prefixCheck.isCombosquatting;
    } else {
      isLookalike =
        score0to20 >= 10 ||
        levSim >= 0.75 ||
        jw.jaroWinklerSimilarity >= 0.82 ||
        prefixCheck.isCombosquatting ||
        addedWords.hasAddedWords ||
        homoglyphs.hasHomoglyphs ||
        hasDelimiterVariation ||
        hasRepeated;
    }
  }

  return {
    brandName: rawBrand,
    candidateName: rawCand,
    normalizedBrand: normBrand.safelyNormalized,
    normalizedCandidate: normCand.safelyNormalized,
    editDistance: dLev,
    similarityRatio: Number(levSim.toFixed(4)),
    tokenSimilarity: Number(tokenSim.toFixed(4)),
    jaroWinklerSimilarity: jw.jaroWinklerSimilarity,
    isLookalike,
    variationType,
    metrics: {
      damerauLevenshteinDistance: dLev,
      levenshteinSimilarity: Number(levSim.toFixed(4)),
      jaroWinklerSimilarity: jw.jaroWinklerSimilarity,
      tokenJaccardSimilarity: Number(tokenSim.toFixed(4)),
      compositeSimilarityPercent,
    },
    signals,
    similarityScore0to20: score0to20,
    lengthCategory,
    isCommonWordSuppressed,
  };
}

/**
 * Generates brand variants and look-alike queries for legitimate discovery
 */
export function generateBrandVariants(brandName: string): string[] {
  const clean = brandName.trim();
  const variants = new Set<string>();

  // Stems
  variants.add(clean);
  variants.add(`${clean} Official`);
  variants.add(`${clean} Support`);
  variants.add(`${clean} Customer Care`);
  variants.add(`${clean} Security`);
  variants.add(`${clean} Help`);
  variants.add(`${clean} India`);
  variants.add(`${clean} Rewards`);
  variants.add(`${clean} KYC`);

  // Combos
  variants.add(`${clean}-Support`);
  variants.add(`${clean}-Official`);
  variants.add(`${clean}Support`);
  variants.add(`${clean}Care`);

  // Common leetspeak substitutions
  if (clean.toLowerCase().includes('i')) {
    variants.add(clean.replace(/i/gi, '1'));
  }
  if (clean.toLowerCase().includes('o')) {
    variants.add(clean.replace(/o/gi, '0'));
  }
  if (clean.toLowerCase().includes('e')) {
    variants.add(clean.replace(/e/gi, '3'));
  }

  return Array.from(variants);
}
