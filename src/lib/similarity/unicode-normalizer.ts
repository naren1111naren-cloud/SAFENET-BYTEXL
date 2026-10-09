/**
 * SAFENET Safe Unicode and Separator Normalizer
 * Implements deterministic text normalization, zero-width stripping,
 * separator standardization, and script-aware safeguards.
 */

import { HOMOGLYPH_MAP } from './homoglyphs';

export interface ConfusableDetail {
  index: number;
  originalChar: string;
  mappedChar: string;
  originalCodePoint: string;
  script: string;
}

export interface NormalizationResult {
  raw: string;
  nfkc: string;
  caseFolded: string;
  cleanSeparators: string;
  compactStem: string;
  hasZeroWidth: boolean;
  zeroWidthCount: number;
  hasMixedScript: boolean;
  detectedScripts: string[];
  confusables: ConfusableDetail[];
  safelyNormalized: string;
}

// Invisible and Zero-Width characters frequently used in obfuscation attacks
const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E]/g;

// Punctuation and separator characters
const SEPARATOR_REGEX = /[-_.\s/\\+~:;|#@!$%^&*()[\]{}'"`]+/g;

/**
 * Detects the Unicode script block of a given character
 */
export function getCharacterScript(char: string): string {
  const code = char.codePointAt(0) || 0;

  if (code >= 0x0041 && code <= 0x007A) return 'Latin';
  if (code >= 0x00C0 && code <= 0x024F) return 'Latin-Extended';
  if (code >= 0x0400 && code <= 0x04FF) return 'Cyrillic';
  if (code >= 0x0500 && code <= 0x052F) return 'Cyrillic-Supplement';
  if (code >= 0x0370 && code <= 0x03FF) return 'Greek';
  if (code >= 0xFF00 && code <= 0xFFEF) return 'Fullwidth';
  if (code >= 0x0030 && code <= 0x0039) return 'Digit';
  if (code >= 0x2000 && code <= 0x206F) return 'Punctuation';
  if (code <= 0x002F || (code >= 0x003A && code <= 0x0040)) return 'Common-Symbol';

  return 'Other';
}

/**
 * Strips zero-width characters and returns the clean string along with match count
 */
export function stripZeroWidth(input: string): { clean: string; count: number } {
  let count = 0;
  const clean = input.replace(ZERO_WIDTH_REGEX, () => {
    count++;
    return '';
  });
  return { clean, count };
}

/**
 * Normalizes separators, converting varied punctuation/delimiters to spaces or removing them
 */
export function normalizeSeparators(input: string, replaceWith = ' '): string {
  return input.replace(SEPARATOR_REGEX, replaceWith).trim();
}

/**
 * Creates compact alphanumeric stem for core brand comparison (e.g. "pay_tm" -> "paytm")
 */
export function toCompactStem(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes candidate text with comprehensive audit trail and confusable detection
 */
export function normalizeCandidateText(input: string): NormalizationResult {
  const raw = (input || '').trim();

  // 1. Strip zero-width and invisible formatting characters
  const zeroWidth = stripZeroWidth(raw);

  // 2. Standard Unicode NFKC Normalization
  const nfkc = zeroWidth.clean.normalize('NFKC');

  // 3. Safe Case Folding
  const caseFolded = nfkc.toLowerCase();

  // 4. Separator normalization (replaces hyphens, underscores, dots, etc. with single spaces)
  const cleanSeparators = normalizeSeparators(caseFolded, ' ').replace(/\s+/g, ' ');

  // 5. Compact alphanumeric stem
  const compactStem = toCompactStem(caseFolded);

  // 6. Script analysis and Confusable mapping (preserving original vs transformed)
  const scriptSet = new Set<string>();
  const confusables: ConfusableDetail[] = [];
  let safelyNormalized = '';

  for (let i = 0; i < zeroWidth.clean.length; i++) {
    const char = zeroWidth.clean[i];
    const script = getCharacterScript(char);

    if (script !== 'Common-Symbol' && script !== 'Punctuation' && script !== 'Digit') {
      scriptSet.add(script);
    }

    if (HOMOGLYPH_MAP[char]) {
      const mapped = HOMOGLYPH_MAP[char];
      confusables.push({
        index: i,
        originalChar: char,
        mappedChar: mapped,
        originalCodePoint: `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`,
        script,
      });
      safelyNormalized += mapped;
    } else {
      safelyNormalized += char;
    }
  }

  // Mixed-script occurs when Latin is blended with Cyrillic, Greek, or other scripts
  const detectedScripts = Array.from(scriptSet);
  const hasLatin = detectedScripts.some((s) => s.startsWith('Latin'));
  const hasNonLatinAlphas = detectedScripts.some((s) => s === 'Cyrillic' || s === 'Greek' || s === 'Cyrillic-Supplement');
  const hasMixedScript = hasLatin && hasNonLatinAlphas;

  return {
    raw,
    nfkc,
    caseFolded,
    cleanSeparators,
    compactStem,
    hasZeroWidth: zeroWidth.count > 0,
    zeroWidthCount: zeroWidth.count,
    hasMixedScript,
    detectedScripts,
    confusables,
    safelyNormalized: safelyNormalized.toLowerCase(),
  };
}
