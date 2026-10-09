/**
 * SAFENET Brand Identity Fingerprint & Dynamic Lookalike Generator
 * Establishes the authoritative reference fingerprint against which impersonators are evaluated,
 * and generates exhaustive, controlled lookalike search variants.
 */

import {
  BrandIdentityFingerprint,
  BrandIdentityProfile,
  SocialPlatform,
  OfficialProfileCandidate,
  EvidenceItem,
} from './types';
import { BrandDiscoveryResult } from './brand-discovery';

/**
 * Builds a standardized Brand Identity Fingerprint from discovery results.
 * STRICT PRINCIPLE: Only creates fingerprint if identity is verified with sufficient evidence.
 */
export function buildBrandIdentityFingerprint(
  discovery: BrandDiscoveryResult
): BrandIdentityFingerprint | null {
  if (!discovery.isIdentityEstablished || !discovery.officialDomain || discovery.overallConfidence < 50) {
    return null;
  }

  if (discovery.fingerprint) {
    return discovery.fingerprint;
  }

  const verified = discovery.officialProfiles.filter(
    (p) => p.verificationStatus === 'VERIFIED' || p.verificationStatus === 'LIKELY'
  );

  const officialUsernames = verified
    .map((p) => p.username.replace(/^@/, '').toLowerCase())
    .filter((u) => u && !u.includes('not verified') && !u.includes('no verified match'));

  const officialAccounts: Partial<Record<SocialPlatform, string>> = {};
  for (const p of verified) {
    if (p.platform !== 'website') {
      officialAccounts[p.platform as SocialPlatform] = p.username;
    }
  }

  const knownDomains = [
    discovery.officialDomain,
    `www.${discovery.officialDomain}`,
    `*.${discovery.officialDomain}`,
  ];

  return {
    brandName: discovery.brandName,
    aliases: discovery.aliases,
    officialDomains: knownDomains,
    officialUsernames: Array.from(new Set(officialUsernames)),
    officialSocialAccounts: officialAccounts,
    knownKeywords: discovery.brandKeywords,
    knownExternalLinks: discovery.officialWebsite ? [discovery.officialWebsite] : [],
    visualIdentity: discovery.visualIdentity || undefined,
    officialProfiles: discovery.officialProfiles,
    verifiedProfiles: verified,
    confidence: discovery.overallConfidence,
    verificationStatus: discovery.identityStatus,
    evidence: discovery.discoveryEvidence,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates comprehensive lookalike variants across lexical, combosquatting,
 * delimiter, and typographic mutations.
 */
export function generateThreatLookalikeVariants(
  fingerprint: BrandIdentityFingerprint | null,
  maxVariants: number = 16
): {
  searchQueries: string[];
  syntheticLookalikes: string[];
} {
  if (!fingerprint) {
    return { searchQueries: [], syntheticLookalikes: [] };
  }
  const brand = fingerprint.brandName;
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '');

  const searchQueries = new Set<string>();
  const syntheticLookalikes = new Set<string>();

  // 1. Primary brand and aliases
  searchQueries.add(brand);
  for (const alias of fingerprint.aliases.slice(0, 3)) {
    if (alias.toLowerCase() !== brand.toLowerCase()) {
      searchQueries.add(alias);
    }
  }

  // 2. High-Risk Suffixes (Combosquatting Patterns)
  const supportSuffixes = [
    'Support',
    'Customer Care',
    'Official',
    'Helpdesk',
    'Helpline',
    'Store',
    'India',
    'Global',
  ];

  for (const suf of supportSuffixes) {
    searchQueries.add(`${brand} ${suf}`);
    syntheticLookalikes.add(`${cleanBrand}_${suf.toLowerCase().replace(/\s+/g, '_')}`);
    syntheticLookalikes.add(`${cleanBrand}-${suf.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // 3. Typo-squatting & Transposition Patterns
  // Omission
  if (cleanBrand.length > 4) {
    syntheticLookalikes.add(cleanBrand.slice(0, -1)); // omit last char
  }

  // Duplication (e.g. payttm, nikke)
  if (cleanBrand.length >= 3) {
    const midIdx = Math.floor(cleanBrand.length / 2);
    const dup = cleanBrand.slice(0, midIdx) + cleanBrand[midIdx] + cleanBrand.slice(midIdx);
    syntheticLookalikes.add(dup);
  }

  // Common homoglyphs / substitutions (0 for o, 1 for l/i)
  if (cleanBrand.includes('o')) {
    syntheticLookalikes.add(cleanBrand.replace(/o/g, '0'));
  }
  if (cleanBrand.includes('l')) {
    syntheticLookalikes.add(cleanBrand.replace(/l/g, '1'));
  }

  // 4. Prefix Additions
  const prefixes = ['official', 'my', 'get', 'the'];
  for (const pref of prefixes) {
    syntheticLookalikes.add(`${pref}_${cleanBrand}`);
    syntheticLookalikes.add(`${pref}${cleanBrand}`);
  }

  return {
    searchQueries: Array.from(searchQueries).slice(0, 8),
    syntheticLookalikes: Array.from(syntheticLookalikes).slice(0, maxVariants),
  };
}
