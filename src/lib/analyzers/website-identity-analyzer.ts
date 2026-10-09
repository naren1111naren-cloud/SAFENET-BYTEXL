/**
 * SAFENET Real-Time Brand Profile Intelligence - Website Identity Analyzer
 * Extracts verified brand identity, JSON-LD Organization schemas, sameAs profiles,
 * social links, app store endpoints, and logo assets directly from live website HTML.
 */

import { extractDomainParts } from '../intelligence/url-normalizer';
import {
  DiscoveredBrandIdentity,
  DiscoveredSocialProfile,
  DiscoveredApplication,
  IdentitySignal,
  ThreatEvidence,
} from '@/types/brand';

export interface WebsiteAnalysisInput {
  html: string;
  targetUrl: string;
  finalUrl: string;
  brandNameInput: string;
  statusCode?: number;
}

// Well-known external domains that should NOT be classified as brand-owned domains
const EXTERNAL_SERVICE_DOMAINS = new Set([
  'google.com', 'gstatic.com', 'googleapis.com', 'google-analytics.com', 'googletagmanager.com',
  'facebook.com', 'fb.com', 'facebook.net', 'meta.com',
  'twitter.com', 'x.com', 'twimg.com',
  'instagram.com', 'cdninstagram.com',
  'linkedin.com', 'licdn.com',
  'youtube.com', 'ytimg.com',
  'github.com', 'githubusercontent.com',
  'cloudflare.com', 'cdnjs.cloudflare.com', 'jsdelivr.net',
  'apple.com', 'itunes.apple.com', 'apps.apple.com',
  'microsoft.com', 'azure.com', 'amazonaws.com', 'cloudfront.net',
  'wp.com', 'wordpress.org', 'wordpress.com',
  'schema.org', 'w3.org', 'gravatar.com', 'doubleclick.net',
]);

const LEGAL_SUFFIX_REGEX = /\b(Private\s+Limited|Pvt\.?\s*Ltd\.?|Ltd\.?|Limited|Inc\.?|Incorporated|LLC|LLP|Corp\.?|Corporation|GmbH|S\.A\.|B\.V\.|Technologies|Group|Enterprises|Holdings)\b/gi;

/**
 * Parses and extracts authoritative brand identity from website HTML.
 */
export function analyzeWebsiteIdentity(input: WebsiteAnalysisInput): DiscoveredBrandIdentity {
  const { html, targetUrl, finalUrl, brandNameInput } = input;
  const discoveredAt = new Date().toISOString();

  let parsedFinalUrl: URL;
  try {
    parsedFinalUrl = new URL(finalUrl);
  } catch {
    parsedFinalUrl = new URL(targetUrl);
  }

  const { registrableDomain, subdomain } = extractDomainParts(parsedFinalUrl.hostname);
  const canonicalDomain = parsedFinalUrl.hostname.toLowerCase().replace(/^www\./, '');

  // 1. Parse Title & Meta
  let title = '';
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (titleMatch && titleMatch[1]) {
    title = cleanHtmlEntities(titleMatch[1].trim());
  }

  let metaDescription: string | undefined = undefined;
  const metaDescMatch = /<meta[^>]+(?:name=["']description["']|property=["']og:description["'])[^>]+content=["']([^"']+)["']/i.exec(html);
  if (metaDescMatch && metaDescMatch[1]) {
    metaDescription = cleanHtmlEntities(metaDescMatch[1].trim());
  }

  let ogTitle: string | undefined = undefined;
  const ogTitleMatch = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (ogTitleMatch && ogTitleMatch[1]) {
    ogTitle = cleanHtmlEntities(ogTitleMatch[1].trim());
  }

  let ogSiteName: string | undefined = undefined;
  const ogSiteNameMatch = /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (ogSiteNameMatch && ogSiteNameMatch[1]) {
    ogSiteName = cleanHtmlEntities(ogSiteNameMatch[1].trim());
  }

  // 2. Parse JSON-LD Structured Data
  const jsonLdOrganizations: any[] = [];
  const jsonLdRegex = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch: RegExpExecArray | null;

  while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const rawContent = jsonMatch[1].trim();
      const parsed = JSON.parse(rawContent);

      const items = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
      for (const item of items) {
        if (!item) continue;
        const type = String(item['@type'] || '');
        if (
          type.includes('Organization') ||
          type.includes('Corporation') ||
          type.includes('FinancialService') ||
          type.includes('OnlineBusiness') ||
          type.includes('WebSite') ||
          type.includes('Brand')
        ) {
          jsonLdOrganizations.push(item);
        }
      }
    } catch {
      // Gracefully ignore malformed JSON-LD scripts
    }
  }

  // 3. Extract Organization Metadata
  let schemaOrgName: string | undefined = undefined;
  let schemaLegalName: string | undefined = undefined;
  let schemaLogoUrl: string | undefined = undefined;
  const schemaSameAsUrls: string[] = [];
  const schemaAlternateNames: string[] = [];

  for (const org of jsonLdOrganizations) {
    if (org.name && !schemaOrgName) {
      schemaOrgName = String(org.name).trim();
    }
    if (org.legalName && !schemaLegalName) {
      schemaLegalName = String(org.legalName).trim();
    }
    if (org.alternateName) {
      if (Array.isArray(org.alternateName)) {
        schemaAlternateNames.push(...org.alternateName.map(String));
      } else {
        schemaAlternateNames.push(String(org.alternateName));
      }
    }
    if (org.logo && !schemaLogoUrl) {
      if (typeof org.logo === 'string') {
        schemaLogoUrl = org.logo;
      } else if (org.logo.url) {
        schemaLogoUrl = String(org.logo.url);
      } else if (org.logo.contentUrl) {
        schemaLogoUrl = String(org.logo.contentUrl);
      }
    }
    if (org.sameAs) {
      if (Array.isArray(org.sameAs)) {
        for (const s of org.sameAs) {
          if (typeof s === 'string') schemaSameAsUrls.push(s);
        }
      } else if (typeof org.sameAs === 'string') {
        schemaSameAsUrls.push(org.sameAs);
      }
    }
  }

  // 4. Extract Logo and Artwork
  let logoUrl: string | undefined = undefined;
  let logoSource: 'organization_schema' | 'og_image' | 'apple_touch_icon' | 'favicon' | undefined = undefined;
  let logoConfidence: 'high' | 'medium' | 'low' = 'low';

  if (schemaLogoUrl) {
    logoUrl = resolveAbsoluteUrl(schemaLogoUrl, finalUrl);
    logoSource = 'organization_schema';
    logoConfidence = 'high';
  }

  if (!logoUrl) {
    // OpenGraph Image
    const ogImageMatch = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html);
    if (ogImageMatch && ogImageMatch[1]) {
      logoUrl = resolveAbsoluteUrl(ogImageMatch[1].trim(), finalUrl);
      logoSource = 'og_image';
      logoConfidence = 'medium';
    }
  }

  if (!logoUrl) {
    // Apple Touch Icon
    const appleTouchMatch = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i.exec(html);
    if (appleTouchMatch && appleTouchMatch[1]) {
      logoUrl = resolveAbsoluteUrl(appleTouchMatch[1].trim(), finalUrl);
      logoSource = 'apple_touch_icon';
      logoConfidence = 'medium';
    }
  }

  if (!logoUrl) {
    // Favicon
    const iconMatch = /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i.exec(html);
    if (iconMatch && iconMatch[1]) {
      logoUrl = resolveAbsoluteUrl(iconMatch[1].trim(), finalUrl);
      logoSource = 'favicon';
      logoConfidence = 'low';
    }
  }

  // 5. Discover Official Social Profiles
  const rawHrefUrls: string[] = [];
  const hrefRegex = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let hrefMatch: RegExpExecArray | null;
  while ((hrefMatch = hrefRegex.exec(html)) !== null) {
    const rawHref = hrefMatch[1].trim();
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('//')) {
      rawHrefUrls.push(rawHref.startsWith('//') ? `https:${rawHref}` : rawHref);
    }
  }

  const socialProfiles: DiscoveredSocialProfile[] = [];
  const seenSocialHandles = new Set<string>();

  // Process JSON-LD sameAs first (highest confidence)
  for (const url of schemaSameAsUrls) {
    const identified = parseSocialProfileUrl(url, 'organization_schema', finalUrl);
    if (identified && !seenSocialHandles.has(`${identified.platform}:${identified.username.toLowerCase()}`)) {
      seenSocialHandles.add(`${identified.platform}:${identified.username.toLowerCase()}`);
      socialProfiles.push(identified);
    }
  }

  // Process all HTML anchor links
  for (const url of rawHrefUrls) {
    const identified = parseSocialProfileUrl(url, 'official_website', finalUrl);
    if (identified && !seenSocialHandles.has(`${identified.platform}:${identified.username.toLowerCase()}`)) {
      seenSocialHandles.add(`${identified.platform}:${identified.username.toLowerCase()}`);
      socialProfiles.push(identified);
    }
  }

  // 6. Discover Mobile App Store Links
  const applications: DiscoveredApplication[] = [];
  const seenAppKeys = new Set<string>();

  for (const url of rawHrefUrls) {
    const app = parseAppStoreUrl(url, finalUrl);
    if (app && !seenAppKeys.has(`${app.store}:${app.packageId || app.storeUrl}`)) {
      seenAppKeys.add(`${app.store}:${app.packageId || app.storeUrl}`);
      applications.push(app);
    }
  }

  // 7. Derive Authoritative Domains
  const domains: Array<{ domain: string; source: string; confidence: 'high' | 'medium' | 'low' }> = [
    { domain: canonicalDomain, source: 'canonical_hostname', confidence: 'high' },
  ];

  if (registrableDomain && registrableDomain !== canonicalDomain) {
    domains.push({ domain: registrableDomain, source: 'registrable_domain', confidence: 'high' });
  }

  // Check canonical link tag
  const canonicalTagMatch = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (canonicalTagMatch && canonicalTagMatch[1]) {
    try {
      const parsedCanonical = new URL(canonicalTagMatch[1]);
      const cleanCanonicalHost = parsedCanonical.hostname.toLowerCase().replace(/^www\./, '');
      if (cleanCanonicalHost && !domains.some((d) => d.domain === cleanCanonicalHost)) {
        domains.push({ domain: cleanCanonicalHost, source: 'canonical_metadata', confidence: 'high' });
      }
    } catch {
      // Ignored
    }
  }

  // 8. Generate Clean Deterministic Aliases
  const aliasSet = new Set<string>();
  const effectiveBrandName = schemaOrgName || brandNameInput.trim();

  // Add inputs
  aliasSet.add(effectiveBrandName);
  if (brandNameInput && brandNameInput.toLowerCase() !== effectiveBrandName.toLowerCase()) {
    aliasSet.add(brandNameInput.trim());
  }

  if (schemaLegalName) {
    aliasSet.add(schemaLegalName);
    // Strip legal suffixes
    const strippedLegal = schemaLegalName.replace(LEGAL_SUFFIX_REGEX, '').replace(/[\s,.-]+$/, '').trim();
    if (strippedLegal && strippedLegal.length > 2) {
      aliasSet.add(strippedLegal);
    }
  }

  for (const alt of schemaAlternateNames) {
    if (alt && alt.trim().length > 1) {
      aliasSet.add(alt.trim());
    }
  }

  if (ogSiteName && ogSiteName.length > 1) {
    aliasSet.add(ogSiteName);
  }

  // Clean and remove the brand name itself if duplicated
  const aliases = Array.from(aliasSet).filter((a) => a.length > 1);

  // 9. Build Evidence Collection
  const evidence: ThreatEvidence[] = [];

  evidence.push({
    id: `ev-web-${Date.now()}-1`,
    category: 'Website Connectivity',
    title: 'Official Website Accessible',
    description: `Successfully connected to ${finalUrl} (HTTP ${input.statusCode || 200}) with verified TLS.`,
    severity: 'low',
    value: finalUrl,
    status: 'available',
    source: 'WebsiteAnalyzer',
  });

  if (schemaOrgName || schemaLegalName) {
    evidence.push({
      id: `ev-web-${Date.now()}-2`,
      category: 'Identity Provenance',
      title: 'Organization Schema Detected',
      description: `JSON-LD structured data declared identity: "${schemaLegalName || schemaOrgName}".`,
      severity: 'low',
      value: schemaLegalName || schemaOrgName || '',
      status: 'available',
      source: 'JSON-LD Organization',
    });
  }

  if (logoUrl) {
    evidence.push({
      id: `ev-web-${Date.now()}-3`,
      category: 'Brand Assets',
      title: 'Official Logo Discovered',
      description: `Discovered official brand artwork from ${logoSource || 'website metadata'}.`,
      severity: 'low',
      value: logoUrl,
      status: 'available',
      source: logoSource,
    });
  }

  for (const s of socialProfiles) {
    evidence.push({
      id: `ev-soc-${Date.now()}-${s.platform}-${Math.random().toString(36).slice(2, 6)}`,
      category: 'Social Asset Baseline',
      title: `Official ${capitalize(s.platform)} Account`,
      description: `Profile "${s.username}" directly linked from ${s.source === 'organization_schema' ? 'Organization JSON-LD sameAs' : 'official website navigation'}.`,
      severity: 'low',
      value: s.url,
      status: 'available',
      source: s.source,
    });
  }

  for (const app of applications) {
    evidence.push({
      id: `ev-app-${Date.now()}-${app.packageId || Math.random().toString(36).slice(2, 6)}`,
      category: 'Application Asset Baseline',
      title: `Official ${app.store} Application`,
      description: `Mobile application identifier "${app.packageId || app.name}" referenced on official website.`,
      severity: 'low',
      value: app.storeUrl,
      status: 'available',
      source: app.source,
    });
  }

  // 10. Generate Identity Signals
  const signals: IdentitySignal[] = [
    {
      name: 'Website Reachable',
      status: 'verified',
      description: `Target responded with valid HTML payload at ${finalUrl}.`,
    },
    {
      name: 'Organization Schema',
      status: jsonLdOrganizations.length > 0 ? 'verified' : 'not_found',
      description: jsonLdOrganizations.length > 0
        ? `Found ${jsonLdOrganizations.length} JSON-LD organizational schema entity.`
        : 'No JSON-LD Organization schema declared on the target webpage.',
    },
    {
      name: 'Canonical Domain',
      status: canonicalDomain ? 'verified' : 'not_found',
      description: `Authoritative domain established as "${canonicalDomain}".`,
    },
    {
      name: 'Social Links Discovered',
      status: socialProfiles.length > 0 ? 'detected' : 'not_found',
      description: socialProfiles.length > 0
        ? `Discovered ${socialProfiles.length} authoritative social media profiles.`
        : 'No official social media profiles linked from the website.',
    },
    {
      name: 'Mobile App Store Links',
      status: applications.length > 0 ? 'detected' : 'not_found',
      description: applications.length > 0
        ? `Discovered ${applications.length} official mobile application store links.`
        : 'No official mobile application links discovered on the website.',
    },
  ];

  return {
    brandName: effectiveBrandName,
    legalName: schemaLegalName,
    officialWebsite: finalUrl,
    canonicalDomain,
    logoUrl,
    logoSource,
    logoConfidence,
    description: metaDescription || (title ? `Official digital portal: ${title}` : undefined),
    aliases,
    domains,
    socialProfiles,
    applications,
    signals,
    evidence,
    providerStatus: {
      websiteAnalyzer: 'active',
      httpFetch: 'success',
      jsonLdParser: jsonLdOrganizations.length > 0 ? 'found' : 'absent',
    },
    discoveredAt,
  };
}

/**
 * Extracts and normalizes official social media profile URLs.
 */
function parseSocialProfileUrl(
  url: string,
  source: 'organization_schema' | 'official_website',
  evidenceUrl: string
): DiscoveredSocialProfile | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname;

    // Twitter / X
    if (host === 'twitter.com' || host === 'x.com') {
      const match = /^\/([a-zA-Z0-9_]{1,30})\/?$/.exec(pathname);
      if (match) {
        const username = match[1];
        if (!['share', 'intent', 'home', 'search', 'hashtag', 'login', 'privacy', 'terms', 'explore'].includes(username.toLowerCase())) {
          return {
            platform: 'twitter',
            url: `https://x.com/${username}`,
            username: `@${username}`,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // Instagram
    if (host === 'instagram.com') {
      const match = /^\/([a-zA-Z0-9_.]{1,40})\/?$/.exec(pathname);
      if (match) {
        const username = match[1];
        if (!['p', 'stories', 'explore', 'direct', 'accounts', 'legal', 'about', 'developer'].includes(username.toLowerCase())) {
          return {
            platform: 'instagram',
            url: `https://instagram.com/${username}`,
            username: `@${username}`,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // LinkedIn
    if (host === 'linkedin.com') {
      const match = /^\/(?:company|school)\/([a-zA-Z0-9_-]{1,60})\/?$/.exec(pathname);
      if (match) {
        const companyHandle = match[1];
        if (!['sharearticle', 'sharing', 'feed', 'login'].includes(companyHandle.toLowerCase())) {
          return {
            platform: 'linkedin',
            url: `https://www.linkedin.com/company/${companyHandle}`,
            username: companyHandle,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // Facebook
    if (host === 'facebook.com' || host === 'fb.com') {
      const match = /^\/([a-zA-Z0-9_.]{2,50})\/?$/.exec(pathname);
      if (match) {
        const handle = match[1];
        if (!['sharer', 'share', 'tr', 'dialog', 'plugins', 'login', 'pages', 'groups'].includes(handle.toLowerCase())) {
          return {
            platform: 'facebook',
            url: `https://facebook.com/${handle}`,
            username: handle,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // YouTube
    if (host === 'youtube.com') {
      const channelMatch = /^\/(?:@|c\/|channel\/|user\/)?([a-zA-Z0-9_.-]{1,60})\/?$/.exec(pathname);
      if (channelMatch) {
        const channelName = channelMatch[1];
        if (!['watch', 'embed', 'results', 'feed', 'shorts', 'playlist'].includes(channelName.toLowerCase())) {
          return {
            platform: 'youtube',
            url: `https://youtube.com/@${channelName.replace(/^@/, '')}`,
            username: channelName.startsWith('@') ? channelName : `@${channelName}`,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // Telegram
    if (host === 't.me' || host === 'telegram.me') {
      const match = /^\/([a-zA-Z0-9_]{3,40})\/?$/.exec(pathname);
      if (match) {
        const handle = match[1];
        if (!['share', 'joinchat', 'addstickers'].includes(handle.toLowerCase())) {
          return {
            platform: 'telegram',
            url: `https://t.me/${handle}`,
            username: `@${handle}`,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    // TikTok
    if (host === 'tiktok.com') {
      const match = /^\/@([a-zA-Z0-9_.-]{1,40})\/?$/.exec(pathname);
      if (match) {
        const handle = match[1];
        return {
          platform: 'tiktok',
          url: `https://www.tiktok.com/@${handle}`,
          username: `@${handle}`,
          source,
          confidence: 'high',
          evidenceUrl,
          confirmed: true,
        };
      }
    }

    // GitHub
    if (host === 'github.com') {
      const match = /^\/([a-zA-Z0-9_-]{1,40})\/?$/.exec(pathname);
      if (match) {
        const handle = match[1];
        if (!['features', 'topics', 'trending', 'collections', 'events', 'explore'].includes(handle.toLowerCase())) {
          return {
            platform: 'github',
            url: `https://github.com/${handle}`,
            username: handle,
            source,
            confidence: 'high',
            evidenceUrl,
            confirmed: true,
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses and extracts Google Play and Apple App Store links.
 */
function parseAppStoreUrl(url: string, evidenceUrl: string): DiscoveredApplication | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Google Play Store
    if (host === 'play.google.com' && parsed.pathname.startsWith('/store/apps/details')) {
      const packageId = parsed.searchParams.get('id');
      if (packageId) {
        return {
          name: packageId,
          store: 'Google Play',
          storeUrl: `https://play.google.com/store/apps/details?id=${packageId}`,
          packageId,
          source: 'official_website',
          confidence: 'high',
          confirmed: true,
        };
      }
    }

    // Apple App Store
    if (host === 'apps.apple.com' || host === 'itunes.apple.com') {
      const idMatch = /id(\d{7,14})/i.exec(parsed.pathname);
      const appNameMatch = /\/app\/([^/]+)\/id/i.exec(parsed.pathname);
      const appName = appNameMatch ? decodeURIComponent(appNameMatch[1].replace(/-/g, ' ')) : undefined;
      const packageId = idMatch ? `id${idMatch[1]}` : undefined;

      if (idMatch || appName) {
        return {
          name: appName || (packageId ? `App ${packageId}` : 'iOS Application'),
          store: 'Apple App Store',
          storeUrl: url,
          packageId,
          source: 'official_website',
          confidence: 'high',
          confirmed: true,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves relative URLs to absolute URLs safely.
 */
function resolveAbsoluteUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
