/**
 * SAFENET Internet Intelligence Platform - RDAP Domain Registration Intelligence
 * Queries authoritative ICANN/IANA RDAP bootstrap endpoints to retrieve genuine registration data.
 * Computes domain age from verified timestamps and explicitly reports unavailable/redacted states.
 */

export interface RdapIntelligenceReport {
  domain: string;
  queriedAt: string;
  status: 'available' | 'unavailable' | 'not_supported' | 'rate_limited' | 'error';
  sourceUrl?: string;
  registrarName?: string;
  registrarIanaId?: string;
  registrationDateUtc?: string;
  expirationDateUtc?: string;
  lastUpdatedDateUtc?: string;
  domainAgeDays?: number;
  domainAgeFormatted?: string;
  domainStatus?: string[];
  nameservers?: string[];
  isPrivacyRedacted: boolean;
  rawDetails?: string;
  error?: string;
}

/**
 * Calculates domain age in days from a UTC ISO date string.
 */
export function calculateDomainAge(registrationDateIso: string): { days: number; formatted: string } | null {
  try {
    const regTime = new Date(registrationDateIso).getTime();
    if (isNaN(regTime)) return null;

    const now = Date.now();
    const diffMs = now - regTime;
    if (diffMs < 0) return null; // Registration date in future

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let formatted = '';
    if (days < 30) {
      formatted = `${days} days`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      formatted = `${months} month${months > 1 ? 's' : ''} (${days} days)`;
    } else {
      const years = Math.floor(days / 365);
      const remDays = days % 365;
      formatted = `${years} year${years > 1 ? 's' : ''}${remDays > 0 ? `, ${remDays} days` : ''}`;
    }

    return { days, formatted };
  } catch {
    return null;
  }
}

/**
 * Queries the open RDAP bootstrap gateway (https://rdap.org/domain/{domain})
 */
export async function queryRdapIntelligence(
  registrableDomain: string,
  timeoutMs: number = 3500
): Promise<RdapIntelligenceReport> {
  const cleanDomain = registrableDomain.toLowerCase().trim();
  const timestamp = new Date().toISOString();

  if (!cleanDomain || !cleanDomain.includes('.')) {
    return {
      domain: cleanDomain,
      queriedAt: timestamp,
      status: 'not_supported',
      isPrivacyRedacted: false,
      error: 'Invalid registrable domain name format.',
    };
  }

  // rdap.org acts as an open standard redirector to authoritative registry RDAP servers
  const targetUrl = `https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': 'SAFENET-Security-Intel/2.0 (+https://github.com/safenet/safenet)',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (response.status === 429) {
      return {
        domain: cleanDomain,
        queriedAt: timestamp,
        status: 'rate_limited',
        sourceUrl: targetUrl,
        isPrivacyRedacted: false,
        error: 'Registry RDAP query rate limit exceeded. Registration details temporarily unavailable.',
      };
    }

    if (response.status === 404) {
      return {
        domain: cleanDomain,
        queriedAt: timestamp,
        status: 'unavailable',
        sourceUrl: targetUrl,
        isPrivacyRedacted: false,
        error: 'Domain not found in authoritative RDAP registry (potential unregistered or pending domain).',
      };
    }

    if (!response.ok) {
      return {
        domain: cleanDomain,
        queriedAt: timestamp,
        status: 'unavailable',
        sourceUrl: targetUrl,
        isPrivacyRedacted: false,
        error: `RDAP service responded with HTTP status ${response.status}`,
      };
    }

    const data = await response.json();

    // Extract Registrar Information
    let registrarName: string | undefined = undefined;
    let registrarIanaId: string | undefined = undefined;

    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (Array.isArray(entity.roles) && entity.roles.includes('registrar')) {
          if (entity.vcardArray && Array.isArray(entity.vcardArray[1])) {
            const fnRow = (entity.vcardArray[1] as unknown[][]).find((row) => Array.isArray(row) && row[0] === 'fn');
            if (fnRow && fnRow[3]) {
              registrarName = String(fnRow[3]);
            }
          }
          if (Array.isArray(entity.publicIds)) {
            const ianaId = (entity.publicIds as Record<string, unknown>[]).find((id) => id?.type === 'IANA Registrar ID');
            if (ianaId && ianaId.identifier) {
              registrarIanaId = String(ianaId.identifier);
            }
          }
          if (!registrarName && entity.handle) {
            registrarName = entity.handle;
          }
        }
      }
    }

    // Extract Registration, Expiration, and Last Changed Events
    let registrationDateUtc: string | undefined = undefined;
    let expirationDateUtc: string | undefined = undefined;
    let lastUpdatedDateUtc: string | undefined = undefined;

    if (Array.isArray(data.events)) {
      for (const ev of data.events) {
        if (ev.eventAction === 'registration' && ev.eventDate) {
          registrationDateUtc = new Date(ev.eventDate).toISOString();
        } else if (ev.eventAction === 'expiration' && ev.eventDate) {
          expirationDateUtc = new Date(ev.eventDate).toISOString();
        } else if (ev.eventAction === 'last changed' && ev.eventDate) {
          lastUpdatedDateUtc = new Date(ev.eventDate).toISOString();
        }
      }
    }

    // Compute verified domain age
    let domainAgeDays: number | undefined = undefined;
    let domainAgeFormatted: string | undefined = undefined;
    if (registrationDateUtc) {
      const ageInfo = calculateDomainAge(registrationDateUtc);
      if (ageInfo) {
        domainAgeDays = ageInfo.days;
        domainAgeFormatted = ageInfo.formatted;
      }
    }

    // Extract Domain Statuses
    const domainStatus: string[] = Array.isArray(data.status) ? data.status : [];

    // Extract Nameservers
    const nameservers: string[] = [];
    if (Array.isArray(data.nameservers)) {
      (data.nameservers as Record<string, unknown>[]).forEach((ns) => {
        if (typeof ns?.ldhName === 'string') nameservers.push(ns.ldhName.toLowerCase());
      });
    }

    // Check for privacy redaction notices
    const isPrivacyRedacted =
      Boolean((data.remarks as Record<string, unknown>[] | undefined)?.some((r) => {
        const title = typeof r?.title === 'string' ? r.title : '';
        const desc = Array.isArray(r?.description) ? r.description.join(' ') : '';
        return /redact|privacy|withheld|gdpr/i.test(`${title} ${desc}`);
      })) ||
      Boolean(registrarName && /privacy|whoisguard|withheld/i.test(registrarName));

    return {
      domain: cleanDomain,
      queriedAt: timestamp,
      status: 'available',
      sourceUrl: targetUrl,
      registrarName,
      registrarIanaId,
      registrationDateUtc,
      expirationDateUtc,
      lastUpdatedDateUtc,
      domainAgeDays,
      domainAgeFormatted,
      domainStatus,
      nameservers,
      isPrivacyRedacted,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isTimeout = errorMsg.includes('abort') || errorMsg.includes('timeout');
    return {
      domain: cleanDomain,
      queriedAt: timestamp,
      status: isTimeout ? 'unavailable' : 'error',
      sourceUrl: targetUrl,
      isPrivacyRedacted: false,
      error: isTimeout ? `RDAP query timed out after ${timeoutMs}ms` : `RDAP lookup failed: ${errorMsg}`,
    };
  }
}
