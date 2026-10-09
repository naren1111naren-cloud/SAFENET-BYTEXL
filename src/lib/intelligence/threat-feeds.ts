/**
 * SAFENET Internet Intelligence Platform - External Threat Intelligence Providers
 * Adapters for Google Safe Browsing and VirusTotal APIs.
 * Distinguishes verified detections, clean lookups, and unconfigured states.
 */

export interface ThreatFeedFinding {
  provider: 'Google Safe Browsing' | 'VirusTotal';
  status: 'malicious' | 'clean' | 'not_configured' | 'unavailable' | 'error';
  threatTypes?: string[];
  positives?: number;
  totalEngines?: number;
  details?: string;
  queriedAt: string;
}

export interface ThreatFeedsReport {
  providersChecked: number;
  detectionsCount: number;
  findings: ThreatFeedFinding[];
}

/**
 * Checks a URL against Google Safe Browsing API v4.
 */
export async function checkGoogleSafeBrowsing(url: string, timeoutMs: number = 3000): Promise<ThreatFeedFinding> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const timestamp = new Date().toISOString();

  if (!apiKey) {
    return {
      provider: 'Google Safe Browsing',
      status: 'not_configured',
      details: 'Google Safe Browsing API key is not configured in server environment.',
      queriedAt: timestamp,
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const body = {
      client: {
        clientId: 'safenet-intel',
        clientVersion: '2.0.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return {
        provider: 'Google Safe Browsing',
        status: 'unavailable',
        details: `API responded with HTTP status ${res.status}`,
        queriedAt: timestamp,
      };
    }

    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      const threatTypes = data.matches
        .map((m: { threatType?: string }) => m.threatType)
        .filter(Boolean) as string[];
      return {
        provider: 'Google Safe Browsing',
        status: 'malicious',
        threatTypes,
        details: `Flagged as malicious threat: ${threatTypes.join(', ')}`,
        queriedAt: timestamp,
      };
    }

    return {
      provider: 'Google Safe Browsing',
      status: 'clean',
      details: 'No threat matches found in Google Safe Browsing list.',
      queriedAt: timestamp,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      provider: 'Google Safe Browsing',
      status: 'error',
      details: `Lookup failed: ${errorMsg}`,
      queriedAt: timestamp,
    };
  }
}

/**
 * Checks a domain or URL against VirusTotal v3 API.
 */
export async function checkVirusTotal(domainOrUrl: string, timeoutMs: number = 3000): Promise<ThreatFeedFinding> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const timestamp = new Date().toISOString();

  if (!apiKey) {
    return {
      provider: 'VirusTotal',
      status: 'not_configured',
      details: 'VirusTotal API key is not configured in server environment.',
      queriedAt: timestamp,
    };
  }

  // Use domain endpoint if domain, or URL id if URL
  const cleanTarget = domainOrUrl.replace(/^https?:\/\//i, '').split('/')[0];
  const endpoint = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(cleanTarget)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.status === 404) {
      return {
        provider: 'VirusTotal',
        status: 'clean',
        details: 'Domain not previously seen or analyzed in VirusTotal database.',
        queriedAt: timestamp,
      };
    }

    if (!res.ok) {
      return {
        provider: 'VirusTotal',
        status: 'unavailable',
        details: `VirusTotal responded with HTTP status ${res.status}`,
        queriedAt: timestamp,
      };
    }

    const json = await res.json();
    const stats = json?.data?.attributes?.last_analysis_stats;

    if (stats) {
      const maliciousCount = (stats.malicious || 0) + (stats.suspicious || 0);
      const totalEngines =
        (stats.malicious || 0) +
        (stats.suspicious || 0) +
        (stats.harmless || 0) +
        (stats.undetected || 0);

      if (maliciousCount > 0) {
        return {
          provider: 'VirusTotal',
          status: 'malicious',
          positives: maliciousCount,
          totalEngines,
          details: `${maliciousCount} of ${totalEngines} security vendors flagged this domain as malicious/suspicious.`,
          queriedAt: timestamp,
        };
      }

      return {
        provider: 'VirusTotal',
        status: 'clean',
        positives: 0,
        totalEngines,
        details: `0 of ${totalEngines} security vendors flagged this domain.`,
        queriedAt: timestamp,
      };
    }

    return {
      provider: 'VirusTotal',
      status: 'unavailable',
      details: 'No analysis stats available in response.',
      queriedAt: timestamp,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      provider: 'VirusTotal',
      status: 'error',
      details: `Lookup failed: ${errorMsg}`,
      queriedAt: timestamp,
    };
  }
}

/**
 * Aggregates all external threat-intelligence providers.
 */
export async function queryThreatFeeds(targetUrl: string): Promise<ThreatFeedsReport> {
  const [safeBrowsing, virusTotal] = await Promise.all([
    checkGoogleSafeBrowsing(targetUrl),
    checkVirusTotal(targetUrl),
  ]);

  const findings = [safeBrowsing, virusTotal];
  const activeProviders = findings.filter((f) => f.status !== 'not_configured');
  const detectionsCount = findings.filter((f) => f.status === 'malicious').length;

  return {
    providersChecked: activeProviders.length,
    detectionsCount,
    findings,
  };
}
