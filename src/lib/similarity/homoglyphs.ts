/**
 * Homoglyph and Unicode Confusable Character Detection Engine
 * Detects IDN Homograph attacks (e.g. Cyrillic 'а' replacing Latin 'a', '0' for 'o', etc.)
 */

// Mapping of confusable Unicode characters to their standard Latin character
export const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic lookalikes
  'а': 'a', 'А': 'A',
  'с': 'c', 'С': 'C',
  'е': 'e', 'Е': 'E',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'х': 'x', 'Х': 'X',
  'у': 'y', 'У': 'Y',
  'і': 'i', 'І': 'I',
  'ј': 'j', 'Ј': 'J',
  'ѕ': 's', 'Ѕ': 'S',
  'т': 't', 'Т': 'T',
  'в': 'b', 'В': 'B',
  'м': 'm', 'М': 'M',
  'н': 'h', 'Н': 'H',
  'к': 'k', 'К': 'K',
  'ԁ': 'd', 'Ԃ': 'D',
  'ԛ': 'q', 'Ԛ': 'Q',

  // Greek lookalikes
  'α': 'a', 'Α': 'A',
  'β': 'b', 'Β': 'B',
  'γ': 'y', 'Γ': 'r',
  'ε': 'e', 'Ε': 'E',
  'η': 'n', 'Η': 'H',
  'ι': 'i', 'Ι': 'I',
  'κ': 'k', 'Κ': 'K',
  'ν': 'v', 'Ν': 'N',
  'ο': 'o', '\u039F': 'O',
  'ρ': 'p', 'Ρ': 'P',
  'τ': 't', 'Τ': 'T',
  'υ': 'u', 'Υ': 'Y',
  'χ': 'x', 'Χ': 'X',

  // Latin lookalikes / accented / extended (Unicode > 127)
  'ɡ': 'g',
  'ɩ': 'i',
  'ı': 'i',
  'ł': 'l',
  'ⅼ': 'l',
  '０': '0',
  '１': '1',
  '５': '5',
};

export interface HomoglyphMatch {
  position: number;
  confusableChar: string;
  normalizedChar: string;
  charName: string;
}

export interface HomoglyphAnalysis {
  hasHomoglyphs: boolean;
  hasMixedScript: boolean;
  isMixedScript: boolean;
  isPunycode: boolean;
  matches: HomoglyphMatch[];
  normalizedString: string;
  normalizedText: string;
  rawPunycode?: string;
  homoglyphRiskScore: number;
}

/**
 * Identify character script/type
 */
function getCharDescription(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0x0400 && code <= 0x04FF) return `Cyrillic (U+${code.toString(16).toUpperCase()})`;
  if (code >= 0x0370 && code <= 0x03FF) return `Greek (U+${code.toString(16).toUpperCase()})`;
  if (code >= 0xFF10 && code <= 0xFF19) return `Fullwidth Numeral (U+${code.toString(16).toUpperCase()})`;
  return `Unicode Confusable (U+${code.toString(16).toUpperCase()})`;
}

/**
 * Analyzes a string for confusable homoglyphs, mixed Unicode scripts, and Punycode
 */
export function analyzeHomoglyphs(input: string): HomoglyphAnalysis {
  let normalized = '';
  const matches: HomoglyphMatch[] = [];
  let isPunycode = false;
  let rawPunycode: string | undefined = undefined;

  const testStr = input.trim();

  // Check Punycode (e.g., xn--...)
  if (testStr.toLowerCase().startsWith('xn--') || testStr.toLowerCase().includes('.xn--')) {
    isPunycode = true;
    rawPunycode = testStr;
  }

  // Check character by character
  let hasNonAscii = false;
  let hasAscii = false;

  for (let i = 0; i < testStr.length; i++) {
    const char = testStr[i];
    const code = char.charCodeAt(0);

    if (code > 127) {
      hasNonAscii = true;
    } else if (/[a-zA-Z]/.test(char)) {
      hasAscii = true;
    }

    if (code > 127 && HOMOGLYPH_MAP[char]) {
      const mapped = HOMOGLYPH_MAP[char];
      normalized += mapped;
      matches.push({
        position: i,
        confusableChar: char,
        normalizedChar: mapped,
        charName: getCharDescription(char),
      });
    } else {
      normalized += char;
    }
  }

  const hasMixedScript = hasNonAscii && hasAscii;
  const hasHomoglyphs = matches.length > 0 || isPunycode;

  // Calculate homoglyph risk score (0-40)
  let homoglyphRiskScore = 0;
  if (isPunycode) homoglyphRiskScore += 35;
  if (hasMixedScript) homoglyphRiskScore += 30;
  if (matches.length > 0) {
    homoglyphRiskScore += Math.min(35, matches.length * 15);
  }

  return {
    hasHomoglyphs,
    hasMixedScript,
    isMixedScript: hasMixedScript,
    isPunycode,
    matches,
    normalizedString: normalized,
    normalizedText: normalized,
    rawPunycode,
    homoglyphRiskScore: Math.min(40, homoglyphRiskScore),
  };
}
