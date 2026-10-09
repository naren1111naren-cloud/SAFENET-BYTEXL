/**
 * SAFENET Internet Intelligence Platform - HTTP & Redirect Inspector
 * Performs safe, bounded, read-only HTTP fetches with hop-by-hop SSRF validation.
 * Captures redirect chains, security headers, response latencies, and bounded response bodies.
 */

import { validateSafeTarget } from './safe-target';

export interface HttpRedirectHop {
  hopIndex: number;
  fromUrl: string;
  toUrl: string;
  statusCode: number;
  headers?: Record<string, string>;
}

export interface SecurityHeadersReport {
  strictTransportSecurity?: string;
  contentSecurityPolicy?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  hasHsts: boolean;
  hasCsp: boolean;
  hasXFrameOptions: boolean;
}

export interface HttpInspectionReport {
  initialUrl: string;
  finalUrl: string;
  isAccessible: boolean;
  statusCode?: number;
  statusText?: string;
  redirectChain: HttpRedirectHop[];
  redirectCount: number;
  contentType?: string;
  contentLengthBytes?: number;
  durationMs: number;
  securityHeaders: SecurityHeadersReport;
  rawBodySnippet?: string; // Bounded to max 256KB for HTML analysis
  blockedReason?: string;
  error?: string;
}

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 512 * 1024; // 512 KB snippet for HTML analysis
const HTTP_TIMEOUT_MS = 4000;

/**
 * Inspects a target URL, safely following up to MAX_REDIRECTS with SSRF verification on every hop.
 */
export async function inspectHttpEndpoint(
  targetUrl: string,
  timeoutMs: number = HTTP_TIMEOUT_MS
): Promise<HttpInspectionReport> {
  const redirectChain: HttpRedirectHop[] = [];
  let currentUrl = targetUrl;
  const startTime = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      return {
        initialUrl: targetUrl,
        finalUrl: currentUrl,
        isAccessible: false,
        redirectChain,
        redirectCount: redirectChain.length,
        durationMs: Date.now() - startTime,
        securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false },
        error: `Malformed redirect URL: ${currentUrl}`,
      };
    }

    // SSRF Check on this specific hop destination
    const safety = await validateSafeTarget(parsedUrl.hostname);
    if (!safety.isSafe) {
      return {
        initialUrl: targetUrl,
        finalUrl: currentUrl,
        isAccessible: false,
        redirectChain,
        redirectCount: redirectChain.length,
        durationMs: Date.now() - startTime,
        securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false },
        blockedReason: `Redirect hop ${hop} to "${parsedUrl.hostname}" was blocked: ${safety.blockedReason}`,
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Perform fetch with manual redirect handling
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Enforce manual step-by-step redirect control
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (SAFENET Security Scanner/2.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const status = response.status;
      const isRedirect = [301, 302, 303, 307, 308].includes(status);

      if (isRedirect) {
        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
          // Redirect status without location header
          return {
            initialUrl: targetUrl,
            finalUrl: currentUrl,
            isAccessible: true,
            statusCode: status,
            statusText: response.statusText,
            redirectChain,
            redirectCount: redirectChain.length,
            durationMs: Date.now() - startTime,
            securityHeaders: extractSecurityHeaders(response.headers),
            error: 'Server returned HTTP redirect without a Location header.',
          };
        }

        // Resolve relative redirects against current URL
        const nextUrl = new URL(locationHeader, currentUrl).toString();
        redirectChain.push({
          hopIndex: hop,
          fromUrl: currentUrl,
          toUrl: nextUrl,
          statusCode: status,
        });

        if (hop === MAX_REDIRECTS) {
          return {
            initialUrl: targetUrl,
            finalUrl: nextUrl,
            isAccessible: false,
            statusCode: status,
            redirectChain,
            redirectCount: redirectChain.length,
            durationMs: Date.now() - startTime,
            securityHeaders: extractSecurityHeaders(response.headers),
            error: `Maximum redirect limit (${MAX_REDIRECTS}) exceeded. Possible redirect loop.`,
          };
        }

        currentUrl = nextUrl;
        continue; // Follow redirect safely
      }

      // Terminal (non-redirect) response reached
      const contentType = response.headers.get('content-type') || undefined;
      const contentLengthHeader = response.headers.get('content-length');
      const contentLengthBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;
      const securityHeaders = extractSecurityHeaders(response.headers);

      // Read bounded response body if HTML or text
      let rawBodySnippet: string | undefined = undefined;
      if (contentType && /text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
        try {
          const reader = response.body?.getReader();
          if (reader) {
            let receivedBytes = 0;
            const chunks: Uint8Array[] = [];
            while (receivedBytes < MAX_BODY_BYTES) {
              const { done, value } = await reader.read();
              if (done || !value) break;
              chunks.push(value);
              receivedBytes += value.length;
            }
            reader.cancel();
            const totalBuffer = Buffer.concat(chunks);
            rawBodySnippet = totalBuffer.toString('utf-8');
          }
        } catch {
          // Graceful handling of body read failures
        }
      }

      return {
        initialUrl: targetUrl,
        finalUrl: currentUrl,
        isAccessible: true,
        statusCode: status,
        statusText: response.statusText,
        redirectChain,
        redirectCount: redirectChain.length,
        contentType,
        contentLengthBytes,
        durationMs: Date.now() - startTime,
        securityHeaders,
        rawBodySnippet,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errorMsg.includes('abort') || errorMsg.includes('timeout');

      return {
        initialUrl: targetUrl,
        finalUrl: currentUrl,
        isAccessible: false,
        redirectChain,
        redirectCount: redirectChain.length,
        durationMs: Date.now() - startTime,
        securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false },
        error: isTimeout ? `HTTP request timed out after ${timeoutMs}ms.` : `HTTP connection error: ${errorMsg}`,
      };
    }
  }

  return {
    initialUrl: targetUrl,
    finalUrl: currentUrl,
    isAccessible: false,
    redirectChain,
    redirectCount: redirectChain.length,
    durationMs: Date.now() - startTime,
    securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false },
    error: 'Inspection terminated unexpectedly.',
  };
}

function extractSecurityHeaders(headers: Headers): SecurityHeadersReport {
  const hsts = headers.get('strict-transport-security') || undefined;
  const csp = headers.get('content-security-policy') || undefined;
  const xfo = headers.get('x-frame-options') || undefined;
  const xcto = headers.get('x-content-type-options') || undefined;
  const ref = headers.get('referrer-policy') || undefined;

  return {
    strictTransportSecurity: hsts,
    contentSecurityPolicy: csp,
    xFrameOptions: xfo,
    xContentTypeOptions: xcto,
    referrerPolicy: ref,
    hasHsts: Boolean(hsts),
    hasCsp: Boolean(csp),
    hasXFrameOptions: Boolean(xfo),
  };
}
