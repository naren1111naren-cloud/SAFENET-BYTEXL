/**
 * SAFENET Internet Intelligence Platform - Real IP & Autonomous System Intelligence
 * Enriches verified public IP addresses with ASN, ISP, Organization, and Country attributes.
 * Falls back transparently to 'unavailable' without fabricating network identities.
 */

import { isPrivateOrReservedIpv4, isPrivateOrReservedIpv6 } from './safe-target';

export interface IpIntelligenceReport {
  ip: string;
  queriedAt: string;
  status: 'available' | 'unavailable' | 'private_ip' | 'error';
  asn?: string;
  asOrganization?: string;
  isp?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  provider: string;
  error?: string;
}

/**
 * Enriches a public IP address using open geolocation/ASN lookup services (ip-api.com).
 */
export async function enrichIpIntelligence(
  ip: string,
  timeoutMs: number = 3000
): Promise<IpIntelligenceReport> {
  const cleanIp = ip.trim();
  const timestamp = new Date().toISOString();

  // Validate that IP is public before querying external enrichment
  const isV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp);
  if (isV4 && isPrivateOrReservedIpv4(cleanIp)) {
    return {
      ip: cleanIp,
      queriedAt: timestamp,
      status: 'private_ip',
      provider: 'Internal RFC Filter',
      error: 'Private, loopback, or reserved IP addresses are not routed publicly.',
    };
  }

  if (!isV4 && isPrivateOrReservedIpv6(cleanIp)) {
    return {
      ip: cleanIp,
      queriedAt: timestamp,
      status: 'private_ip',
      provider: 'Internal RFC Filter',
      error: 'Private, unique-local, or link-local IPv6 addresses are not routed publicly.',
    };
  }

  // Open standard IP intelligence lookup
  const targetUrl = `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,message,country,countryCode,city,isp,org,as,query`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SAFENET-Security-Intel/2.0',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!response.ok) {
      return {
        ip: cleanIp,
        queriedAt: timestamp,
        status: 'unavailable',
        provider: 'ip-api.com',
        error: `Provider responded with HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.status !== 'success') {
      return {
        ip: cleanIp,
        queriedAt: timestamp,
        status: 'unavailable',
        provider: 'ip-api.com',
        error: data.message || 'IP intelligence lookup returned no record.',
      };
    }

    // Split AS string (e.g. "AS15169 Google LLC" -> ASN: "AS15169", Org: "Google LLC")
    let asn: string | undefined = undefined;
    let asOrg = data.org || undefined;

    if (data.as && typeof data.as === 'string') {
      const match = /^(AS\d+)\s*(.*)$/i.exec(data.as);
      if (match) {
        asn = match[1];
        if (!asOrg && match[2]) asOrg = match[2];
      } else {
        asn = data.as;
      }
    }

    return {
      ip: cleanIp,
      queriedAt: timestamp,
      status: 'available',
      asn,
      asOrganization: asOrg,
      isp: data.isp || undefined,
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      city: data.city || undefined,
      provider: 'ip-api.com',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isTimeout = errorMsg.includes('abort') || errorMsg.includes('timeout');

    return {
      ip: cleanIp,
      queriedAt: timestamp,
      status: isTimeout ? 'unavailable' : 'error',
      provider: 'ip-api.com',
      error: isTimeout ? `IP enrichment lookup timed out after ${timeoutMs}ms.` : `Enrichment failed: ${errorMsg}`,
    };
  }
}
