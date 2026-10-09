/**
 * SAFENET Added-Word and Suspicious Keyword Detection
 * Detects deceptive affixes, authority lures, support claims, and combosquatting keywords
 * appended or prepended to protected brand names.
 */

export interface KeywordMatch {
  keyword: string;
  category: 'authority' | 'support' | 'security' | 'financial' | 'operational';
  severity: 'high' | 'medium';
  position: 'prefix' | 'suffix' | 'infix' | 'token';
}

export interface AddedWordAnalysis {
  hasAddedWords: boolean;
  matches: KeywordMatch[];
  matchedKeywords: string[];
  matchedCategories: string[];
  affixText: string;
  riskBoost: number;
  explanation: string;
}

// Structured suspicious keyword catalogue
export const SUSPICIOUS_KEYWORDS: Array<{
  term: string;
  category: 'authority' | 'support' | 'security' | 'financial' | 'operational';
  severity: 'high' | 'medium';
}> = [
  // Authority & verification lures
  { term: 'official', category: 'authority', severity: 'high' as const },
  { term: 'verified', category: 'authority', severity: 'high' as const },
  { term: 'original', category: 'authority', severity: 'medium' as const },
  { term: 'authentic', category: 'authority', severity: 'medium' as const },
  { term: 'hq', category: 'authority', severity: 'medium' as const },
  { term: 'admin', category: 'authority', severity: 'high' as const },

  // Customer care & support lures
  { term: 'customer care', category: 'support', severity: 'high' as const },
  { term: 'customercare', category: 'support', severity: 'high' as const },
  { term: 'support', category: 'support', severity: 'high' as const },
  { term: 'help', category: 'support', severity: 'high' as const },
  { term: 'helpline', category: 'support', severity: 'high' as const },
  { term: 'helpdesk', category: 'support', severity: 'high' as const },
  { term: 'care', category: 'support', severity: 'high' as const },
  { term: 'desk', category: 'support', severity: 'medium' as const },
  { term: 'service', category: 'support', severity: 'medium' as const },
  { term: 'services', category: 'support', severity: 'medium' as const },
  { term: 'team', category: 'support', severity: 'medium' as const },
  { term: 'executive', category: 'support', severity: 'medium' as const },
  { term: 'agent', category: 'support', severity: 'medium' as const },

  // Security, KYC & account recovery
  { term: 'security', category: 'security', severity: 'high' as const },
  { term: 'secure', category: 'security', severity: 'medium' as const },
  { term: 'kyc', category: 'security', severity: 'high' as const },
  { term: 'verify', category: 'security', severity: 'high' as const },
  { term: 'verification', category: 'security', severity: 'high' as const },
  { term: 'update', category: 'security', severity: 'medium' as const },
  { term: 'login', category: 'security', severity: 'high' as const },
  { term: 'portal', category: 'security', severity: 'medium' as const },
  { term: 'recovery', category: 'security', severity: 'high' as const },
  { term: 'compliance', category: 'security', severity: 'medium' as const },
  { term: 'alert', category: 'security', severity: 'medium' as const },
  { term: 'fraud', category: 'security', severity: 'medium' as const },

  // Financial & incentives
  { term: 'refund', category: 'financial', severity: 'high' as const },
  { term: 'cashback', category: 'financial', severity: 'high' as const },
  { term: 'rewards', category: 'financial', severity: 'high' as const },
  { term: 'reward', category: 'financial', severity: 'medium' as const },
  { term: 'billing', category: 'financial', severity: 'medium' as const },
  { term: 'payment', category: 'financial', severity: 'medium' as const },
  { term: 'wallet', category: 'financial', severity: 'medium' as const },
  { term: 'claim', category: 'financial', severity: 'medium' as const },
];

/**
 * Analyzes string for suspicious keywords added alongside or around brand name
 */
export function analyzeAddedKeywords(candidate: string, brandName: string): AddedWordAnalysis {
  const cleanCand = candidate.toLowerCase().trim();
  const cleanBrand = brandName.toLowerCase().trim();

  const matches: KeywordMatch[] = [];
  const matchedKeywordsSet = new Set<string>();
  const categoriesSet = new Set<string>();

  // Determine affix parts if candidate contains the brand stem
  let affixText = '';
  const brandIndex = cleanCand.indexOf(cleanBrand);
  if (brandIndex >= 0) {
    const before = cleanCand.slice(0, brandIndex).trim();
    const after = cleanCand.slice(brandIndex + cleanBrand.length).trim();
    affixText = `${before} ${after}`.trim();
  } else {
    affixText = cleanCand;
  }

  // Tokenize candidate
  const words = cleanCand.split(/[-_.\s/\\+]+/).filter(Boolean);

  for (const entry of SUSPICIOUS_KEYWORDS) {
    const term = entry.term;

    // Check multi-word phrase in full string or single token in words
    const isMultiWord = term.includes(' ');
    let matched = false;
    let position: 'prefix' | 'suffix' | 'infix' | 'token' = 'token';

    if (isMultiWord) {
      if (cleanCand.includes(term)) {
        matched = true;
        const pos = cleanCand.indexOf(term);
        if (pos < brandIndex) position = 'prefix';
        else if (pos > brandIndex) position = 'suffix';
        else position = 'infix';
      }
    } else {
      if (words.includes(term)) {
        matched = true;
        const idx = words.indexOf(term);
        const brandWordIdx = words.indexOf(cleanBrand);
        if (brandWordIdx >= 0) {
          position = idx < brandWordIdx ? 'prefix' : 'suffix';
        } else {
          position = 'token';
        }
      } else if (affixText.replace(/[^a-z0-9]/g, '').includes(term)) {
        matched = true;
        position = 'infix';
      }
    }

    if (matched && !matchedKeywordsSet.has(term)) {
      matchedKeywordsSet.add(term);
      categoriesSet.add(entry.category);
      matches.push({
        keyword: term,
        category: entry.category,
        severity: entry.severity,
        position,
      });
    }
  }

  const hasAddedWords = matches.length > 0;
  const matchedKeywords = Array.from(matchedKeywordsSet);
  const matchedCategories = Array.from(categoriesSet);

  // Calculate risk contribution (0 to 35)
  let riskBoost = 0;
  if (hasAddedWords) {
    const highCount = matches.filter((m) => m.severity === 'high').length;
    riskBoost = Math.min(35, highCount * 18 + matches.length * 8);
  }

  const explanation = hasAddedWords
    ? `Deceptive added keyword(s) detected: [${matchedKeywords.join(', ')}] targeting brand "${brandName}".`
    : `No suspicious authority or support keywords detected.`;

  return {
    hasAddedWords,
    matches,
    matchedKeywords,
    matchedCategories,
    affixText,
    riskBoost,
    explanation,
  };
}
