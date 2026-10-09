/**
 * SAFENET Internet Intelligence Platform - Safe Target & SSRF Protection
 * Blocks loopback, private ranges, link-local, cloud metadata, and internal infrastructure.
 */

import dns from 'node:dns/promises';

export interface TargetSafetyCheck {
  isSafe: boolean;
  blockedReason?: string;
  resolvedIps?: string[];
}

// Prohibited internal hostnames and domain patterns
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'instance-data',
  'metadata',
]);

const BLOCKED_SUFFIXES = [
  '.local',
  '.internal',
  '.lan',
  '.corp',
  '.home',
  '.arpa',
  '.intranet',
];

export function isBlockedHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTNAMES.has(clean)) return true;
  return BLOCKED_SUFFIXES.some((s) => clean.endsWith(s));
}
export function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP is treated as unsafe
  }

  const [a, b, c, d] = parts;

  // Loopback (127.0.0.0/8)
  if (a === 127) return true;

  // Unspecified / Current network (0.0.0.0/8)
  if (a === 0) return true;

  // Private RFC 1918: 10.0.0.0/8
  if (a === 10) return true;

  // Private RFC 1918: 172.16.0.0/12 (172.16 - 172.31)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // Private RFC 1918: 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // Link-Local RFC 3927: 169.254.0.0/16 (includes Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // Carrier-Grade NAT RFC 6598: 100.64.0.0/10 (100.64 - 100.127)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Multicast RFC 5771: 224.0.0.0/4 (224.0.0.0 - 239.255.255.255)
  if (a >= 224 && a <= 239) return true;

  // Reserved / Future Use RFC 1112: 240.0.0.0/4
  if (a >= 240) return true;

  // Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  // Documentation / Benchmark: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 198.18.0.0/15
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls into private, loopback, link-local, or unique-local ranges.
 */
export function isPrivateOrReservedIpv6(rawIp: string): boolean {
  // Strip brackets if present
  const ip = rawIp.replace(/^\[|\]$/g, '').toLowerCase().trim();

  // IPv4-mapped IPv6 (::ffff:192.0.2.1)
  if (ip.startsWith('::ffff:')) {
    const v4Part = ip.slice(7);
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v4Part)) {
      return isPrivateOrReservedIpv4(v4Part);
    }
  }

  // Loopback (::1)
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

  // Unspecified (::)
  if (ip === '::' || ip === '0:0:0:0:0:0:0:0') return true;

  // Unique Local Address (fc00::/7 -> fc.. or fd..)
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

  // Link-Local (fe80::/10 -> fe8., fe9., fea., feb.)
  if (/^fe[89ab]/i.test(ip)) return true;

  // Multicast (ff00::/8)
  if (ip.startsWith('ff')) return true;

  return false;
}

/**
 * Validates a target hostname/IP against SSRF rules before initiating outbound requests.
 */
export async function validateSafeTarget(hostname: string, timeoutMs: number = 2500): Promise<TargetSafetyCheck> {
  let cleanHost = hostname.toLowerCase().trim();

  // Strip scheme and path if full URL was provided
  try {
    if (cleanHost.includes('://')) {
      const parsed = new URL(cleanHost);
      cleanHost = parsed.hostname;
    }
  } catch {
    // If URL parsing fails, continue checking raw string
  }

  // Strip IPv6 brackets if present
  cleanHost = cleanHost.replace(/^\[|\]$/g, '');

  if (!cleanHost) {
    return { isSafe: false, blockedReason: 'Hostname cannot be empty.' };
  }

  // 1. Direct hostname blocklist
  if (BLOCKED_HOSTNAMES.has(cleanHost)) {
    return {
      isSafe: false,
      blockedReason: `Target hostname "${cleanHost}" is reserved or internal infrastructure. Access blocked.`,
    };
  }

  for (const suffix of BLOCKED_SUFFIXES) {
    if (cleanHost.endsWith(suffix)) {
      return {
        isSafe: false,
        blockedReason: `Target domain ends in internal suffix "${suffix}". Outbound scan prohibited.`,
      };
    }
  }

  // 2. Direct IPv4 literal check
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    if (isPrivateOrReservedIpv4(cleanHost)) {
      return {
        isSafe: false,
        blockedReason: `Target IP ${cleanHost} is a loopback, private, or link-local address. SSRF protection enforced.`,
        resolvedIps: [cleanHost],
      };
    }
    return { isSafe: true, resolvedIps: [cleanHost] };
  }

  // 3. Direct IPv6 literal check
  if (cleanHost.startsWith('[') || cleanHost.includes(':')) {
    if (isPrivateOrReservedIpv6(cleanHost)) {
      return {
        isSafe: false,
        blockedReason: `Target IPv6 ${cleanHost} is a private, loopback, or link-local address. SSRF protection enforced.`,
        resolvedIps: [cleanHost],
      };
    }
    return { isSafe: true, resolvedIps: [cleanHost] };
  }

  // 4. DNS resolution validation to catch DNS rebinding & private IP pointers
  try {
    const resolvePromise = Promise.race([
      dns.lookup(cleanHost, { all: true }),
      new Promise<{ address: string; family: number }[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS lookup timeout during target validation')), timeoutMs)
      ),
    ]);

    const addresses = await resolvePromise;
    const resolvedIps = addresses.map((a) => a.address);

    if (resolvedIps.length === 0) {
      // Domain does not resolve - safe from SSRF but will not connect
      return { isSafe: true, resolvedIps: [] };
    }

    for (const addr of addresses) {
      if (addr.family === 4 && isPrivateOrReservedIpv4(addr.address)) {
        return {
          isSafe: false,
          blockedReason: `Target "${cleanHost}" resolves to prohibited internal IPv4 ${addr.address}. SSRF blocked.`,
          resolvedIps,
        };
      }
      if (addr.family === 6 && isPrivateOrReservedIpv6(addr.address)) {
        return {
          isSafe: false,
          blockedReason: `Target "${cleanHost}" resolves to prohibited internal IPv6 ${addr.address}. SSRF blocked.`,
          resolvedIps,
        };
      }
    }

    return { isSafe: true, resolvedIps };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('NXDOMAIN')) {
      // NXDOMAIN is not an SSRF threat
      return { isSafe: true, resolvedIps: [] };
    }
    // For lookup timeouts or resolver failures on normal names, don't crash
    return { isSafe: true, resolvedIps: [] };
  }
}
