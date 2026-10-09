/**
 * SAFENET - Static Android APK Analyzer
 * Pure static inspection (ZERO EXECUTION).
 * Parses APK ZIP format, extracts manifest string pools, dangerous permissions,
 * cryptographic hashes, component declarations, and embedded external URLs/domains.
 */

import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { ApkStaticAnalysisResult } from '../apps/types';

// High-risk Android permissions frequently abused by banking trojans, spyware, and rogue apps
const SENSITIVE_PERMISSIONS_MAP: Record<string, { risk: 'CRITICAL' | 'HIGH' | 'MEDIUM'; description: string }> = {
  'android.permission.RECEIVE_SMS': { risk: 'CRITICAL', description: 'Can intercept incoming OTPs and bank authorization messages' },
  'android.permission.READ_SMS': { risk: 'CRITICAL', description: 'Can read SMS inbox containing two-factor auth tokens' },
  'android.permission.SEND_SMS': { risk: 'CRITICAL', description: 'Can trigger premium-rate SMS or forward victim data' },
  'android.permission.SYSTEM_ALERT_WINDOW': { risk: 'CRITICAL', description: 'Can draw overlay phishing login forms over legitimate apps' },
  'android.permission.BIND_ACCESSIBILITY_SERVICE': { risk: 'CRITICAL', description: 'Can monitor keystrokes, hijack UI, and bypass user consent' },
  'android.permission.REQUEST_INSTALL_PACKAGES': { risk: 'HIGH', description: 'Can silently sideload secondary malicious payloads / APKs' },
  'android.permission.READ_CONTACTS': { risk: 'HIGH', description: 'Can exfiltrate victim contact books' },
  'android.permission.WRITE_EXTERNAL_STORAGE': { risk: 'MEDIUM', description: 'Can access and modify shared storage files' },
  'android.permission.READ_EXTERNAL_STORAGE': { risk: 'MEDIUM', description: 'Can read photos, documents, and local app data' },
  'android.permission.ACCESS_FINE_LOCATION': { risk: 'MEDIUM', description: 'Can track precise physical GPS location' },
  'android.permission.RECORD_AUDIO': { risk: 'HIGH', description: 'Can record ambient microphone audio' },
  'android.permission.CAMERA': { risk: 'MEDIUM', description: 'Can capture photos and video streams' },
  'android.permission.GET_ACCOUNTS': { risk: 'HIGH', description: 'Can enumerate registered Google and banking accounts' },
};

// Known benign SDK / namespace domains to exclude from external threat correlation
const IGNORED_DOMAINS = new Set([
  'schemas.android.com',
  'www.w3.org',
  'android.com',
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'googletagmanager.com',
  'github.com',
  'schema.org',
  'apache.org',
]);

interface ZipEntry {
  filename: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  data: Buffer;
}

/**
 * Parses a ZIP archive buffer and extracts individual file entries.
 */
function parseZipEntries(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      // Local file header signature not found, search for next or Central Directory
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const filenameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);

    const filename = buffer.toString('utf-8', offset + 30, offset + 30 + filenameLen);
    const dataOffset = offset + 30 + filenameLen + extraLen;

    if (dataOffset + compressedSize > buffer.length) break;

    const rawData = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let extractedData = Buffer.alloc(0);

    try {
      if (compressionMethod === 0) {
        extractedData = Buffer.from(rawData);
      } else if (compressionMethod === 8) {
        extractedData = zlib.inflateRawSync(rawData);
      }
    } catch {
      // If decompression fails for a non-critical entry, skip data
    }

    entries.push({
      filename,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      data: extractedData,
    });

    offset = dataOffset + compressedSize;
  }

  return entries;
}

/**
 * Extracts human-readable strings from an Android Binary XML (AXML) buffer.
 */
function extractStringsFromAxml(buffer: Buffer): string[] {
  const strings: string[] = [];
  if (buffer.length < 8) return strings;

  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x00080003) {
    // Plaintext XML manifest (e.g. debug/test APK manifests)
    const plainText = buffer.toString('utf-8');
    const quoted = Array.from(plainText.matchAll(/["']([^"']+)["']/g)).map((m) => m[1].trim()).filter((s) => s.length > 0);
    const tokens = plainText.split(/[\s<>"'=]+/i).filter((s) => s.length > 2);
    return Array.from(new Set([...quoted, ...tokens]));
  }

  // Parse String Pool Chunk (usually at offset 8)
  let offset = 8;
  while (offset + 8 < buffer.length) {
    const chunkType = buffer.readUInt32LE(offset);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkType === 0x001c0001) {
      // RES_XML_RESOURCE_MAP_TYPE or RES_STRING_POOL_TYPE
      const stringCount = buffer.readUInt32LE(offset + 8);
      const isUtf8 = (buffer.readUInt32LE(offset + 16) & (1 << 8)) !== 0;
      const stringsStart = offset + buffer.readUInt32LE(offset + 20);

      const indices: number[] = [];
      for (let i = 0; i < stringCount; i++) {
        indices.push(buffer.readUInt32LE(offset + 28 + i * 4));
      }

      for (const strOffset of indices) {
        const absolutePos = stringsStart + strOffset;
        if (absolutePos >= buffer.length) continue;

        if (isUtf8) {
          // UTF-8 string: [utf16_len, utf8_len, bytes..., 0]
          const len = buffer.readUInt8(absolutePos + 1);
          if (absolutePos + 2 + len <= buffer.length) {
            const str = buffer.toString('utf-8', absolutePos + 2, absolutePos + 2 + len);
            if (str && str.trim().length > 0) strings.push(str.trim());
          }
        } else {
          // UTF-16 string: [utf16_len (2 bytes), chars (2 bytes each)..., 0x0000]
          const charLen = buffer.readUInt16LE(absolutePos);
          const byteLen = charLen * 2;
          if (absolutePos + 2 + byteLen <= buffer.length) {
            const str = buffer.toString('utf16le', absolutePos + 2, absolutePos + 2 + byteLen);
            if (str && str.trim().length > 0) strings.push(str.trim());
          }
        }
      }
      break;
    }

    if (chunkSize <= 0) break;
    offset += chunkSize;
  }

  // Fallback: regex search printable sequences
  if (strings.length === 0) {
    const text = buffer.toString('latin1');
    const matches = text.match(/[a-zA-Z0-9_.-]{4,80}/g) || [];
    strings.push(...matches);
  }

  return Array.from(new Set(strings));
}

/**
 * Extracts URLs and domains from raw byte buffers (DEX bytecode or manifests).
 */
function extractUrlsAndDomainsFromBuffer(buffer: Buffer): { urls: string[]; domains: string[] } {
  const content = buffer.toString('latin1');
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?(?:[^\s"'<>()[\]{}|\\]*)?/gi;
  const urls: string[] = [];
  const domains = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(content)) !== null) {
    const rawUrl = match[0].trim();
    urls.push(rawUrl);
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      if (!IGNORED_DOMAINS.has(host) && host.includes('.') && !host.endsWith('.local') && !host.endsWith('.internal')) {
        domains.add(host);
      }
    } catch {
      // Ignored
    }
  }

  return {
    urls: Array.from(new Set(urls)).slice(0, 50),
    domains: Array.from(domains).slice(0, 30),
  };
}

/**
 * Performs static analysis of an Android APK file.
 */
export function analyzeApkStatic(apkBuffer: Buffer, fileName: string = 'app-sample.apk'): ApkStaticAnalysisResult {
  const sha256Hash = crypto.createHash('sha256').update(apkBuffer).digest('hex');
  const fileSizeBytes = apkBuffer.length;

  const entries = parseZipEntries(apkBuffer);

  // Look for AndroidManifest.xml
  const manifestEntry = entries.find((e) => e.filename === 'AndroidManifest.xml');
  const manifestStrings = manifestEntry ? extractStringsFromAxml(manifestEntry.data) : [];

  // Identify package name
  let packageId = 'unknown.package';
  const pkgCandidates = manifestStrings.filter(
    (s) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/.test(s) && !s.startsWith('android.') && !s.startsWith('androidx.')
  );
  if (pkgCandidates.length > 0) {
    packageId = pkgCandidates[0];
  }

  // Identify application label / name
  let applicationLabel = packageId.split('.').pop() || 'Android Application';
  const labelCandidates = manifestStrings.filter(
    (s) => /^[A-Z][a-zA-Z0-9\s-]{2,30}$/.test(s) && !s.includes('.') && !s.includes('/')
  );
  if (labelCandidates.length > 0) {
    applicationLabel = labelCandidates[0];
  }

  // Identify version
  let versionName = '1.0.0';
  const verMatch = manifestStrings.find((s) => /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/.test(s));
  if (verMatch) versionName = verMatch;

  // Extract declared permissions
  const permissions = manifestStrings.filter((s) => s.startsWith('android.permission.') || s.startsWith('com.'));
  const uniquePermissions = Array.from(new Set(permissions));

  const sensitivePermissionsList = uniquePermissions
    .filter((p) => SENSITIVE_PERMISSIONS_MAP[p])
    .map((p) => ({
      permission: p,
      risk_level: SENSITIVE_PERMISSIONS_MAP[p].risk,
      description: SENSITIVE_PERMISSIONS_MAP[p].description,
    }));

  // Extract components (Activities, Services, Receivers)
  const activities = manifestStrings.filter((s) => s.endsWith('Activity') || s.includes('.ui.') || s.includes('.activity.'));
  const services = manifestStrings.filter((s) => s.endsWith('Service') || s.includes('.service.'));
  const receivers = manifestStrings.filter((s) => s.endsWith('Receiver') || s.includes('.receiver.'));

  // Check for signature files in META-INF
  const hasV1Signature = entries.some((e) => e.filename.startsWith('META-INF/') && (e.filename.endsWith('.RSA') || e.filename.endsWith('.DSA') || e.filename.endsWith('.EC') || e.filename.endsWith('.SF')));

  // Extract URLs and domains across classes.dex and manifest
  const allUrls: string[] = [];
  const allDomains = new Set<string>();

  for (const entry of entries) {
    if (entry.filename.endsWith('.dex') || entry.filename === 'AndroidManifest.xml') {
      const extracted = extractUrlsAndDomainsFromBuffer(entry.data);
      allUrls.push(...extracted.urls);
      extracted.domains.forEach((d) => allDomains.add(d));
    }
  }

  return {
    file_name: fileName,
    file_size_bytes: fileSizeBytes,
    sha256_hash: sha256Hash,
    package_id: packageId,
    application_label: applicationLabel,
    version_name: versionName,
    version_code: 1,
    permissions: {
      total_count: uniquePermissions.length,
      sensitive_count: sensitivePermissionsList.length,
      all: uniquePermissions,
      sensitive: sensitivePermissionsList,
    },
    components: {
      activities_count: activities.length,
      services_count: services.length,
      receivers_count: receivers.length,
      activities: Array.from(new Set(activities)).slice(0, 20),
      services: Array.from(new Set(services)).slice(0, 20),
      receivers: Array.from(new Set(receivers)).slice(0, 20),
    },
    extracted_urls: Array.from(new Set(allUrls)).slice(0, 30),
    extracted_domains: Array.from(allDomains).slice(0, 20),
    has_v1_signature: hasV1Signature,
    raw_strings_sample: manifestStrings.slice(0, 25),
  };
}
