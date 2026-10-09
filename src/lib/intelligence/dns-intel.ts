/**
 * SAFENET Internet Intelligence Platform - DNS Intelligence Engine
 * Queries A, AAAA, CNAME, MX, NS, and TXT records using node:dns/promises.
 * Distinguishes success, empty, NXDOMAIN, timeouts, and resolver errors with source attribution.
 */

import dns from 'node:dns/promises';

export type DnsLookupStatus =
  | 'success_with_records'
  | 'success_empty'
  | 'nxdomain'
  | 'timeout'
  | 'resolver_error'
  | 'blocked'
  | 'unsupported';

export interface DnsRecordEntry {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT';
  values: string[];
  status: DnsLookupStatus;
  queriedAt: string;
  durationMs: number;
  error?: string;
  source: string;
}

export interface DnsIntelligenceReport {
  hostname: string;
  queriedAt: string;
  isResolved: boolean;
  overallStatus: DnsLookupStatus;
  ipv4: string[];
  ipv6: string[];
  cname: string[];
  mx: string[];
  ns: string[];
  txt: string[];
  records: Record<string, DnsRecordEntry>;
  errorSummary?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, defaultValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(defaultValue), ms)),
  ]);
}

/**
 * Performs comprehensive DNS intelligence lookups across standard record types.
 */
export async function queryDnsIntelligence(
  hostname: string,
  timeoutMs: number = 3000
): Promise<DnsIntelligenceReport> {
  const cleanHost = hostname.toLowerCase().trim();
  const timestamp = new Date().toISOString();

  // If IP address was submitted directly
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    const entry: DnsRecordEntry = {
      type: 'A',
      values: [cleanHost],
      status: 'success_with_records',
      queriedAt: timestamp,
      durationMs: 0,
      source: 'Direct IP Literal',
    };
    return {
      hostname: cleanHost,
      queriedAt: timestamp,
      isResolved: true,
      overallStatus: 'success_with_records',
      ipv4: [cleanHost],
      ipv6: [],
      cname: [],
      mx: [],
      ns: [],
      txt: [],
      records: { A: entry },
    };
  }

  const recordEntries: Record<string, DnsRecordEntry> = {};

  async function queryType<T>(
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT',
    fn: () => Promise<T>,
    formatter: (res: T) => string[]
  ): Promise<string[]> {
    const start = Date.now();
    try {
      const res = await withTimeout(fn(), timeoutMs, null as T | null);
      const durationMs = Date.now() - start;

      if (res === null) {
        recordEntries[type] = {
          type,
          values: [],
          status: 'timeout',
          queriedAt: new Date().toISOString(),
          durationMs,
          error: `Query timed out after ${timeoutMs}ms`,
          source: 'Node.js DNS Resolver',
        };
        return [];
      }

      const values = formatter(res);
      recordEntries[type] = {
        type,
        values,
        status: values.length > 0 ? 'success_with_records' : 'success_empty',
        queriedAt: new Date().toISOString(),
        durationMs,
        source: 'Node.js DNS Resolver',
      };
      return values;
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isNxdomain = errorMsg.includes('ENOTFOUND') || errorMsg.includes('NXDOMAIN') || errorMsg.includes('NODATA');

      recordEntries[type] = {
        type,
        values: [],
        status: isNxdomain ? 'nxdomain' : 'resolver_error',
        queriedAt: new Date().toISOString(),
        durationMs,
        error: errorMsg,
        source: 'Node.js DNS Resolver',
      };
      return [];
    }
  }

  // Execute queries in parallel
  const [ipv4, ipv6, cname, mx, ns, txt] = await Promise.all([
    queryType('A', () => dns.resolve4(cleanHost), (arr) => arr || []),
    queryType('AAAA', () => dns.resolve6(cleanHost), (arr) => arr || []),
    queryType('CNAME', () => dns.resolveCname(cleanHost), (arr) => arr || []),
    queryType(
      'MX',
      () => dns.resolveMx(cleanHost),
      (arr) => (arr || []).sort((a, b) => a.priority - b.priority).map((m) => `${m.exchange} (pri: ${m.priority})`)
    ),
    queryType('NS', () => dns.resolveNs(cleanHost), (arr) => arr || []),
    queryType(
      'TXT',
      () => dns.resolveTxt(cleanHost),
      (arr) => (arr || []).map((chunks) => (Array.isArray(chunks) ? chunks.join('') : String(chunks)))
    ),
  ]);

  // Fallback to getaddrinfo (dns.lookup) if direct resolve4/6 produced no records
  const finalIpv4 = [...ipv4];
  const finalIpv6 = [...ipv6];

  if (finalIpv4.length === 0 && finalIpv6.length === 0) {
    try {
      const lookupAddresses = await withTimeout(
        dns.lookup(cleanHost, { all: true }),
        1500,
        [] as { address: string; family: number }[]
      );
      if (Array.isArray(lookupAddresses)) {
        lookupAddresses.forEach((addr) => {
          if (addr.family === 4 && !finalIpv4.includes(addr.address)) finalIpv4.push(addr.address);
          if (addr.family === 6 && !finalIpv6.includes(addr.address)) finalIpv6.push(addr.address);
        });
      }
      if (finalIpv4.length > 0) {
        recordEntries['A'] = {
          type: 'A',
          values: finalIpv4,
          status: 'success_with_records',
          queriedAt: new Date().toISOString(),
          durationMs: 0,
          source: 'System Resolver (getaddrinfo)',
        };
      }
    } catch {
      // Ignored fallback error
    }
  }

  const isResolved = finalIpv4.length > 0 || finalIpv6.length > 0 || cname.length > 0;

  let overallStatus: DnsLookupStatus = 'nxdomain';
  if (isResolved) {
    overallStatus = 'success_with_records';
  } else if (Object.values(recordEntries).some((e) => e.status === 'timeout')) {
    overallStatus = 'timeout';
  } else if (Object.values(recordEntries).some((e) => e.status === 'resolver_error')) {
    overallStatus = 'resolver_error';
  }

  return {
    hostname: cleanHost,
    queriedAt: timestamp,
    isResolved,
    overallStatus,
    ipv4: finalIpv4,
    ipv6: finalIpv6,
    cname,
    mx,
    ns,
    txt,
    records: recordEntries,
    errorSummary: !isResolved ? `No authoritative A/AAAA/CNAME records returned (${overallStatus})` : undefined,
  };
}
