/**
 * SAFENET Legitimate Brand Asset Registry and Allowlist Engine
 * Maintains authorized identities, domains, profiles, package IDs, and developers.
 * Provides dictionary protection to prevent false-positive alerts on ordinary words.
 */

import { BrandProfile } from '@/types/brand';

export interface AllowlistMatch {
  isAllowlisted: boolean;
  matchType?:
    | 'official_handle'
    | 'official_domain'
    | 'profile_url'
    | 'package_id'
    | 'developer_name'
    | 'official_alias'
    | 'user_allowlist'
    | 'common_dictionary_word';
  matchedValue?: string;
  reason: string;
}

// Common dictionary words frequently resembling short brand names (3-5 characters)
export const COMMON_DICTIONARY_WORDS = new Set<string>([
  // Resembling "Nike"
  'bike', 'mike', 'like', 'pike', 'hike', 'nine', 'nice', 'neck', 'node', 'lake', 'make', 'take', 'bake', 'wake', 'sake', 'rife', 'pipe',
  // Resembling "Citi" / "City"
  'city', 'cite', 'site', 'cute', 'cats', 'coats', 'coin', 'core', 'cost',
  // Resembling "Visa"
  'vista', 'viva', 'vase', 'view', 'via', 'vibe', 'vise', 'visit',
  // Resembling "Sony"
  'song', 'pony', 'bony', 'tone', 'sonic', 'tony', 'son', 'sons', 'soon',
  // Resembling "Uber"
  'user', 'upper', 'under', 'ember', 'uber',
  // General high-frequency ordinary terms
  'apple', 'orange', 'banana', 'pay', 'paid', 'payment', 'payments', 'money', 'bank', 'cash', 'card',
  'store', 'shop', 'market', 'mall', 'trade', 'buy', 'sell', 'deal', 'deals', 'club', 'hub',
  'digital', 'online', 'direct', 'express', 'global', 'prime', 'smart', 'super', 'tech', 'world',
  'fresh', 'fruit', 'green', 'blue', 'red', 'black', 'white', 'gold', 'silver', 'star', 'sun',
]);

export interface CustomAllowlistEntry {
  id: string;
  brandId: string;
  type: 'handle' | 'domain' | 'url' | 'package_id' | 'developer' | 'name';
  value: string;
  notes?: string;
  createdAt: string;
}

// In-memory user-defined allowlists
const _memoryAllowlists: CustomAllowlistEntry[] = [];

export const LegitimateAssetRegistry = {
  /**
   * Adds an item to the dynamic user allowlist
   */
  addAllowlistEntry(entry: Omit<CustomAllowlistEntry, 'id' | 'createdAt'>): CustomAllowlistEntry {
    const newEntry: CustomAllowlistEntry = {
      ...entry,
      id: `allow-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    _memoryAllowlists.push(newEntry);
    return newEntry;
  },

  /**
   * Retrieves all user allowlist entries for a specific brand
   */
  getAllowlistForBrand(brandId: string): CustomAllowlistEntry[] {
    return _memoryAllowlists.filter((e) => e.brandId.toLowerCase() === brandId.toLowerCase());
  },

  /**
   * Evaluates if a candidate is an authorized asset or an ordinary common word
   */
  evaluateCandidateLegitimacy(
    candidate: {
      name?: string;
      username?: string;
      url?: string;
      domain?: string;
      appId?: string;
      developer?: string;
    },
    brand: BrandProfile
  ): AllowlistMatch {
    const brandName = brand.name.trim();
    const cleanCandName = (candidate.name || '').trim().toLowerCase();
    const cleanCandUser = (candidate.username || '').replace(/^@/, '').trim().toLowerCase();
    const cleanCandDomain = (candidate.domain || '').trim().toLowerCase();
    const cleanCandUrl = (candidate.url || '').trim().toLowerCase();
    const cleanCandAppId = (candidate.appId || '').trim().toLowerCase();
    const cleanCandDev = (candidate.developer || '').trim().toLowerCase();

    // 1. Check Official Social Handles
    const officialHandles = Object.values(brand.handles || {})
      .filter(Boolean)
      .map((h) => h!.replace(/^@/, '').toLowerCase().trim());

    if (cleanCandUser && officialHandles.includes(cleanCandUser)) {
      return {
        isAllowlisted: true,
        matchType: 'official_handle',
        matchedValue: `@${cleanCandUser}`,
        reason: `Handle matches authorized official brand handle in SAFENET Registry for "${brandName}".`,
      };
    }

    // 2. Check Official Domains
    const officialDomains = [
      brand.domain,
      ...(brand.officialDomains || []),
    ].map((d) => d.toLowerCase().trim());

    if (cleanCandDomain && officialDomains.some((od) => cleanCandDomain === od || cleanCandDomain.endsWith(`.${od}`))) {
      return {
        isAllowlisted: true,
        matchType: 'official_domain',
        matchedValue: cleanCandDomain,
        reason: `Destination domain belongs to verified official domain registry for "${brandName}".`,
      };
    }

    if (cleanCandUrl) {
      try {
        const parsed = new URL(cleanCandUrl);
        const host = parsed.hostname.toLowerCase();
        if (officialDomains.some((od) => host === od || host.endsWith(`.${od}`))) {
          return {
            isAllowlisted: true,
            matchType: 'official_domain',
            matchedValue: host,
            reason: `URL destination is hosted on authenticated official infrastructure.`,
          };
        }
      } catch {
        // Continue
      }
    }

    // 3. Check Authorized Application Package Identifiers
    const authorizedAppIds = [
      brand.appPackageName || '',
      ...(brand.authorizedAppIds || []),
    ]
      .filter(Boolean)
      .map((id) => id.toLowerCase().trim());

    if (cleanCandAppId && authorizedAppIds.includes(cleanCandAppId)) {
      return {
        isAllowlisted: true,
        matchType: 'package_id',
        matchedValue: cleanCandAppId,
        reason: `Application package ID matches authorized official portfolio for "${brandName}".`,
      };
    }

    // 4. Check Authorized Developers
    const officialDevs = [
      brandName,
      ...(brand.officialDevelopers || []),
    ].map((d) => d.toLowerCase().trim());

    if (cleanCandDev && officialDevs.some((od) => cleanCandDev === od || cleanCandDev.includes(od))) {
      return {
        isAllowlisted: true,
        matchType: 'developer_name',
        matchedValue: cleanCandDev,
        reason: `Publisher/developer identity is registered as authorized developer for "${brandName}".`,
      };
    }

    // 5. Check Official Aliases
    const aliases = (brand.aliases || []).map((a) => a.toLowerCase().trim());
    if (cleanCandName && aliases.includes(cleanCandName)) {
      return {
        isAllowlisted: true,
        matchType: 'official_alias',
        matchedValue: cleanCandName,
        reason: `Entity matches registered official brand alias: "${cleanCandName}".`,
      };
    }

    // 6. Check Custom User-Allowlist entries
    const customEntries = this.getAllowlistForBrand(brand.id || brand.name);
    for (const entry of customEntries) {
      const val = entry.value.toLowerCase().trim();
      if (
        (entry.type === 'handle' && cleanCandUser === val.replace(/^@/, '')) ||
        (entry.type === 'domain' && cleanCandDomain === val) ||
        (entry.type === 'package_id' && cleanCandAppId === val) ||
        (entry.type === 'name' && cleanCandName === val)
      ) {
        return {
          isAllowlisted: true,
          matchType: 'user_allowlist',
          matchedValue: entry.value,
          reason: `Entity has been explicitly allowlisted by an analyst (${entry.notes || 'User allowlist'}).`,
        };
      }
    }

    // 7. Check Dictionary Protection for Short Brand Names
    // When a brand name is short (<= 4 chars like "Nike"), standard words ("bike", "mike") must NOT be treated as impersonation!
    const stemCandidate = cleanCandName.replace(/[^a-z]/g, '');
    if (brandName.length <= 4 && COMMON_DICTIONARY_WORDS.has(stemCandidate)) {
      return {
        isAllowlisted: false,
        matchType: 'common_dictionary_word',
        matchedValue: stemCandidate,
        reason: `Candidate is an ordinary common dictionary word ("${stemCandidate}"). Treated conservatively to prevent false positives.`,
      };
    }

    return {
      isAllowlisted: false,
      reason: `No allowlist matches found for candidate in "${brandName}" baseline registry.`,
    };
  },
};
