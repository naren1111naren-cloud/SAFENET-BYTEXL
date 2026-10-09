/**
 * SAFENET Internet Intelligence Platform - URL Normalizer
 * Robust input normalization, parsing, validation, and Public Suffix List extraction.
 */

// Common multi-part public suffixes and standard TLDs
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'ac.in', 'edu.in', 'res.in', 'gov.in', 'mil.in',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz',
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp', 'ed.jp',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'co.za', 'org.za', 'gov.za', 'ac.za',
  'com.sg', 'net.sg', 'org.sg', 'gov.sg', 'edu.sg',
  'com.mx', 'net.mx', 'org.mx', 'gob.mx', 'edu.mx',
  'com.ar', 'net.ar', 'org.ar', 'gob.ar',
  'com.tr', 'net.tr', 'org.tr', 'gov.tr', 'edu.tr',
  'com.pk', 'net.pk', 'org.pk', 'gov.pk', 'edu.pk',
  'com.bd', 'net.bd', 'org.bd', 'gov.bd', 'edu.bd',
  'co.kr', 'ne.kr', 'or.kr', 'go.kr', 'ac.kr',
  'co.id', 'net.id', 'or.id', 'go.id', 'ac.id',
  'com.my', 'net.my', 'org.my', 'gov.my', 'edu.my',
  'com.ph', 'net.ph', 'org.ph', 'gov.ph', 'edu.ph',
  'com.tw', 'net.tw', 'org.tw', 'gov.tw', 'edu.tw',
  'com.hk', 'net.hk', 'org.hk', 'gov.hk', 'edu.hk',
  'com.ng', 'org.ng', 'gov.ng', 'edu.ng',
  'com.eg', 'org.eg', 'gov.eg', 'edu.eg',
  'co.il', 'org.il', 'gov.il', 'ac.il',
]);

export interface NormalizedUrl {
  originalInput: string;
  normalizedUrl: string;
  protocol: 'http:' | 'https:';
  hostname: string;
  port?: number;
  pathname: string;
  search: string;
  hash: string;
  registrableDomain: string;
  subdomain: string;
  publicSuffix: string;
  isBareDomain: boolean;
  isIpv4: boolean;
  isIpv6: boolean;
}

export interface NormalizationResult {
  isValid: boolean;
  error?: string;
  data?: NormalizedUrl;
}

/**
 * Extracts the registrable domain, subdomain, and public suffix from a hostname.
 */
export function extractDomainParts(hostname: string): {
  registrableDomain: string;
  subdomain: string;
  publicSuffix: string;
} {
  const cleanHost = hostname.trim().toLowerCase();

  // Handle IP addresses
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost) || cleanHost.startsWith('[') || cleanHost.includes(':')) {
    return {
      registrableDomain: cleanHost,
      subdomain: '',
      publicSuffix: '',
    };
  }

  const parts = cleanHost.split('.');
  if (parts.length <= 1) {
    return {
      registrableDomain: cleanHost,
      subdomain: '',
      publicSuffix: '',
    };
  }

  // Check 2-level suffix first (e.g., co.uk, gov.in)
  if (parts.length >= 3) {
    const candidate2Suffix = parts.slice(-2).join('.');
    if (MULTI_PART_SUFFIXES.has(candidate2Suffix)) {
      const publicSuffix = candidate2Suffix;
      const sld = parts[parts.length - 3];
      const registrableDomain = `${sld}.${publicSuffix}`;
      const subdomain = parts.slice(0, -3).join('.');
      return { registrableDomain, subdomain, publicSuffix };
    }
  }

  // Standard 1-level TLD (e.g., .com, .org, .xyz, .io)
  const publicSuffix = parts[parts.length - 1];
  const sld = parts[parts.length - 2];
  const registrableDomain = `${sld}.${publicSuffix}`;
  const subdomain = parts.slice(0, -2).join('.');

  return { registrableDomain, subdomain, publicSuffix };
}

/**
 * Normalizes and validates user-submitted input (URLs, bare domains, hostnames).
 */
export function normalizeUrlInput(rawInput: string): NormalizationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Empty or missing input provided.' };
  }

  let trimmed = rawInput.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'Input exceeds maximum allowed URL length (2048 characters).' };
  }

  // Check for embedded credentials in unparsed string (e.g., user:pass@)
  const credsMatch = /^[a-zA-Z]+:\/\/([^/@:]+:[^/@:]+)@/.exec(trimmed);
  if (credsMatch) {
    return { isValid: false, error: 'URLs with embedded user credentials are not supported for security reasons.' };
  }

  let isBareDomain = false;
  // If no scheme is provided, determine if it looks like a domain or URL
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
    // Unsupported protocol attempt like javascript: or data: or file:
    if (/^(javascript|data|file|vbscript|blob|about):/i.test(trimmed)) {
      return { isValid: false, error: 'Unsupported URL protocol scheme. Only HTTP and HTTPS are permitted.' };
    }
    // Prepend default https://
    trimmed = `https://${trimmed}`;
    isBareDomain = true;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL format could not be parsed.' };
  }

  // Validate protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Unsupported protocol "${parsed.protocol}". SAFENET only analyzes HTTP and HTTPS targets.`,
    };
  }

  // Reject embedded credentials via parsed URL
  if (parsed.username || parsed.password) {
    return { isValid: false, error: 'URLs with embedded credentials are prohibited.' };
  }

  let hostname = parsed.hostname.toLowerCase();
  // Strip trailing dot if present
  if (hostname.endsWith('.')) {
    hostname = hostname.slice(0, -1);
  }

  if (!hostname || hostname.length === 0) {
    return { isValid: false, error: 'URL hostname is empty or invalid.' };
  }

  // Hostname character validation (RFC 1123 & IPv4/IPv6)
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpv6 = hostname.startsWith('[') && hostname.endsWith(']');

  if (!isIpv4 && !isIpv6) {
    // Must contain valid characters: alphanumeric, hyphen, dot
    if (!/^[a-z0-9.-]+$/i.test(hostname)) {
      return { isValid: false, error: 'Hostname contains invalid characters.' };
    }
    if (hostname.includes('..')) {
      return { isValid: false, error: 'Hostname contains consecutive dots.' };
    }
    if (!hostname.includes('.')) {
      if (hostname !== 'localhost' && !hostname.endsWith('.local') && !hostname.endsWith('.internal')) {
        return { isValid: false, error: 'Single-label hostnames without a valid TLD are prohibited.' };
      }
    }
  }

  const { registrableDomain, subdomain, publicSuffix } = extractDomainParts(hostname);

  const port = parsed.port ? parseInt(parsed.port, 10) : undefined;
  if (port !== undefined && (isNaN(port) || port < 1 || port > 65535)) {
    return { isValid: false, error: 'Invalid port number specified.' };
  }

  const normalizedUrl = parsed.toString();

  return {
    isValid: true,
    data: {
      originalInput: rawInput,
      normalizedUrl,
      protocol: parsed.protocol as 'http:' | 'https:',
      hostname,
      port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      registrableDomain,
      subdomain,
      publicSuffix,
      isBareDomain,
      isIpv4,
      isIpv6,
    },
  };
}
