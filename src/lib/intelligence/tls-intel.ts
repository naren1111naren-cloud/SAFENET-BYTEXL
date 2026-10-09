/**
 * SAFENET Internet Intelligence Platform - TLS Certificate Intelligence
 * Inspects remote X.509 certificates safely using Node.js tls.connect.
 * Preserves verification errors and reports genuine certificate validity windows.
 */

import tls from 'node:tls';

export interface TlsCertificateReport {
  hostname: string;
  port: number;
  queriedAt: string;
  status: 'valid' | 'invalid_cert' | 'expired' | 'hostname_mismatch' | 'no_tls' | 'timeout' | 'error';
  subject?: {
    commonName?: string;
    organization?: string;
  };
  issuer?: {
    commonName?: string;
    organization?: string;
  };
  subjectAltNames?: string[];
  validFromUtc?: string;
  validToUtc?: string;
  daysRemaining?: number;
  isExpired: boolean;
  isNotYetValid: boolean;
  isSelfSigned: boolean;
  hostnameMatches: boolean;
  tlsProtocol?: string;
  cipherSuite?: string;
  authorized: boolean;
  authorizationError?: string;
  error?: string;
}

/**
 * Checks if a hostname matches any Subject Alternative Name or Common Name.
 */
function checkHostnameMatch(hostname: string, sans: string[], commonName?: string): boolean {
  const host = hostname.toLowerCase();
  const allNames = [...sans.map((s) => s.toLowerCase()), commonName?.toLowerCase()].filter(Boolean) as string[];

  return allNames.some((pattern) => {
    if (pattern === host) return true;
    if (pattern.startsWith('*.') && host.endsWith(pattern.slice(1))) {
      // Wildcard check: *.example.com matches sub.example.com
      const sub = host.slice(0, host.length - pattern.length + 2);
      return !sub.includes('.');
    }
    return false;
  });
}

/**
 * Connects via TLS to inspect server certificate.
 */
export async function inspectTlsCertificate(
  hostname: string,
  port: number = 443,
  timeoutMs: number = 3500
): Promise<TlsCertificateReport> {
  const cleanHost = hostname.toLowerCase().trim();
  const timestamp = new Date().toISOString();

  // Basic format validation
  if (!cleanHost || cleanHost.includes('/') || cleanHost.includes('?')) {
    return {
      hostname: cleanHost,
      port,
      queriedAt: timestamp,
      status: 'error',
      isExpired: false,
      isNotYetValid: false,
      isSelfSigned: false,
      hostnameMatches: false,
      authorized: false,
      error: 'Invalid hostname format for TLS negotiation.',
    };
  }

  return new Promise<TlsCertificateReport>((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({
          hostname: cleanHost,
          port,
          queriedAt: timestamp,
          status: 'timeout',
          isExpired: false,
          isNotYetValid: false,
          isSelfSigned: false,
          hostnameMatches: false,
          authorized: false,
          error: `TLS handshake timed out after ${timeoutMs}ms.`,
        });
      }
    }, timeoutMs);

    // Standard TLS connection options
    const socket = tls.connect(
      {
        host: cleanHost,
        port,
        servername: cleanHost, // SNI extension
        rejectUnauthorized: false, // We inspect the authorized boolean ourselves to capture the error accurately
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        try {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authorizationError = socket.authorizationError ? String(socket.authorizationError) : undefined;
          const tlsProtocol = socket.getProtocol() || undefined;
          const cipherSuite = socket.getCipher()?.name || undefined;

          socket.end();

          if (!cert || Object.keys(cert).length === 0) {
            resolve({
              hostname: cleanHost,
              port,
              queriedAt: timestamp,
              status: 'no_tls',
              isExpired: false,
              isNotYetValid: false,
              isSelfSigned: false,
              hostnameMatches: false,
              authorized: false,
              error: 'Server did not present an X.509 certificate.',
            });
            return;
          }

          // Parse Validity Windows
          const validFrom = cert.valid_from ? new Date(cert.valid_from) : undefined;
          const validTo = cert.valid_to ? new Date(cert.valid_to) : undefined;
          const now = Date.now();

          const isExpired = validTo ? validTo.getTime() < now : false;
          const isNotYetValid = validFrom ? validFrom.getTime() > now : false;

          let daysRemaining: number | undefined = undefined;
          if (validTo && !isExpired) {
            daysRemaining = Math.max(0, Math.floor((validTo.getTime() - now) / (1000 * 60 * 60 * 24)));
          }

          // Parse SANs
          const rawSans = cert.subjectaltname || '';
          const subjectAltNames = rawSans
            .split(',')
            .map((s) => s.trim().replace(/^DNS:/i, ''))
            .filter(Boolean);

          const toSingleString = (val: string | string[] | undefined): string | undefined =>
            Array.isArray(val) ? val[0] : val;

          const commonName = toSingleString(cert.subject?.CN);
          const organization = toSingleString(cert.subject?.O);
          const issuerCn = toSingleString(cert.issuer?.CN);
          const issuerOrg = toSingleString(cert.issuer?.O);

          const isSelfSigned = !!(issuerCn && commonName && issuerCn === commonName);
          const hostnameMatches = checkHostnameMatch(cleanHost, subjectAltNames, commonName);

          let status: TlsCertificateReport['status'] = 'valid';
          if (isExpired) {
            status = 'expired';
          } else if (!hostnameMatches) {
            status = 'hostname_mismatch';
          } else if (!authorized) {
            status = 'invalid_cert';
          }

          resolve({
            hostname: cleanHost,
            port,
            queriedAt: timestamp,
            status,
            subject: { commonName, organization },
            issuer: { commonName: issuerCn, organization: issuerOrg },
            subjectAltNames,
            validFromUtc: validFrom?.toISOString(),
            validToUtc: validTo?.toISOString(),
            daysRemaining,
            isExpired,
            isNotYetValid,
            isSelfSigned,
            hostnameMatches,
            tlsProtocol,
            cipherSuite,
            authorized,
            authorizationError,
          });
        } catch (innerErr: unknown) {
          const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
          resolve({
            hostname: cleanHost,
            port,
            queriedAt: timestamp,
            status: 'error',
            isExpired: false,
            isNotYetValid: false,
            isSelfSigned: false,
            hostnameMatches: false,
            authorized: false,
            error: `Failed to inspect certificate data: ${msg}`,
          });
        }
      }
    );

    socket.on('error', (err: Error) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      const errorMsg = err?.message || String(err);
      const isConnectionRefused = errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND');

      resolve({
        hostname: cleanHost,
        port,
        queriedAt: timestamp,
        status: isConnectionRefused ? 'no_tls' : 'error',
        isExpired: false,
        isNotYetValid: false,
        isSelfSigned: false,
        hostnameMatches: false,
        authorized: false,
        error: isConnectionRefused
          ? `Port ${port} does not accept TLS connections (${(err as { code?: string })?.code || 'Connection Refused'})`
          : `TLS connection failed: ${errorMsg}`,
      });
    });
  });
}
