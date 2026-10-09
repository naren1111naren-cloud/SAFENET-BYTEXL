import dns from 'node:dns/promises';

export interface DnsRecordInfo {
  resolved: boolean;
  status: 'available' | 'unavailable' | 'not_applicable';
  ipv4: string[];
  ipv6: string[];
  mx: string[];
  error?: string;
}

/**
 * Executes a promise with an enforced timeout in milliseconds
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Resolves DNS records (IPv4, IPv6, MX) for a given hostname using Node.js dns/promises.
 * Performs safe lookups with timeouts to prevent hanging.
 */
export async function lookupDns(hostname: string, timeoutMs: number = 2500): Promise<DnsRecordInfo> {
  const cleanHost = hostname.trim().toLowerCase();

  // Validate format
  if (!cleanHost || !cleanHost.includes('.') || cleanHost.length > 253) {
    return {
      resolved: false,
      status: 'not_applicable',
      ipv4: [],
      ipv6: [],
      mx: [],
      error: 'Invalid hostname format',
    };
  }

  // Check if it's already an IP address
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    return {
      resolved: true,
      status: 'available',
      ipv4: [cleanHost],
      ipv6: [],
      mx: [],
    };
  }

  try {
    const aPromise = withTimeout(
      dns.resolve4(cleanHost).catch(() => [] as string[]),
      timeoutMs,
      [] as string[]
    );

    const aaaaPromise = withTimeout(
      dns.resolve6(cleanHost).catch(() => [] as string[]),
      timeoutMs,
      [] as string[]
    );

    const mxPromise = withTimeout(
      dns.resolveMx(cleanHost).catch(() => [] as Array<{ exchange: string; priority: number }>),
      timeoutMs,
      [] as Array<{ exchange: string; priority: number }>
    );

    const [ipv4List, ipv6List, mxList] = await Promise.all([aPromise, aaaaPromise, mxPromise]);

    const ipv4 = [...ipv4List];
    const ipv6 = [...ipv6List];

    // If direct c-ares query produced no records, fallback to OS getaddrinfo (dns.lookup)
    if (ipv4.length === 0 && ipv6.length === 0) {
      try {
        const lookupRes = await withTimeout(
          dns.lookup(cleanHost, { all: true }).catch(() => []),
          1500,
          []
        );
        if (Array.isArray(lookupRes)) {
          lookupRes.forEach((entry: { address: string; family: number }) => {
            if (entry.family === 4 && !ipv4.includes(entry.address)) {
              ipv4.push(entry.address);
            } else if (entry.family === 6 && !ipv6.includes(entry.address)) {
              ipv6.push(entry.address);
            }
          });
        }
      } catch {
        // ignore
      }
    }

    const formattedMx = (mxList || []).map((m) => `${m.exchange} (pri:${m.priority})`);
    const isResolved = ipv4.length > 0 || ipv6.length > 0;

    if (isResolved) {
      console.log(`[SAFENET] DNS: resolved for ${cleanHost} -> IPv4: ${ipv4.join(', ') || 'none'}`);
      return {
        resolved: true,
        status: 'available',
        ipv4,
        ipv6,
        mx: formattedMx,
      };
    } else {
      console.log(`[SAFENET] DNS: unresolved for ${cleanHost} (no A/AAAA records)`);
      return {
        resolved: false,
        status: 'unavailable',
        ipv4: [],
        ipv6: [],
        mx: formattedMx,
        error: 'No active DNS A/AAAA records found',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[SAFENET] DNS: lookup error for ${cleanHost}:`, errorMsg);
    return {
      resolved: false,
      status: 'unavailable',
      ipv4: [],
      ipv6: [],
      mx: [],
      error: errorMsg,
    };
  }
}
