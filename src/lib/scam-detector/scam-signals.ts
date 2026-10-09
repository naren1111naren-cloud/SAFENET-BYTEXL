import { ThreatIOC } from '@/types/brand';

/**
 * Deterministic Scam Signal Detector & IOC Extractor
 * Identifies high-risk fraud patterns: UPI requests, fake refunds, urgency, DM support, credential phishing.
 */

export interface ScamSignalMatch {
  category: 'upi_payment' | 'urgency' | 'fake_refund' | 'dm_support' | 'credential_otp' | 'suspicious_link';
  label: string;
  matchedText: string;
  severity: 'high' | 'critical' | 'medium';
  explanation: string;
}

export interface ScamSignalAnalysis {
  hasUpiRequests: boolean;
  hasUrgency: boolean;
  hasFakeRefunds: boolean;
  hasDmSupport: boolean;
  hasOtpHarvesting: boolean;
  matches: ScamSignalMatch[];
  extractedIocs: ThreatIOC[];
  scamSignalScore: number; // 0 - 50
  summaryReasons: string[];
}

// UPI ID / VPA Regex pattern
const UPI_REGEX = /\b[a-zA-Z0-9._-]{2,256}@(okaxis|okhdfcbank|okicici|oksbi|paytm|ybl|axl|ibl|apl|upi|pz|barodampay|postbank|jupiteraxis|kotak|slice|fbl|idfcbank|federal|waaxis|wahdfcbank|wasbi|icici|airtel|freecharge|mobikwik|superyes|yesbank|aubank|indus|citi|hsbc|scb)\b/gi;

// General VPA pattern
const GENERIC_UPI_REGEX = /\b[a-zA-Z0-9._-]{3,60}@[a-zA-Z]{3,30}\b/g;

// Phone number regex (Indian + International)
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/g;

// Telegram link / handle
const TELEGRAM_REGEX = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})|@([a-zA-Z0-9_]{4,32}_(?:bot|support|care|refund|help))/gi;

// WhatsApp link
const WHATSAPP_REGEX = /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?(\d+)/gi;

// Scam keyword dictionaries & patterns
const SCAM_PATTERNS = [
  // 1. UPI Payment & Transfer Fraud
  {
    category: 'upi_payment' as const,
    label: 'UPI Payment Request / VPA Fraud',
    regex: /(?:pay\s*(?:rs\.?|inr|₹)?\s*\d+|transfer\s*amount|send\s*money|scan\s*qr(?:\s*code)?|enter\s*upi\s*pin|upi\s*id\s*[:=]|vpa\s*[:=]|payment\s*gateway\s*charge|refundable\s*deposit|processing\s*fee|registration\s*fee)/i,
    severity: 'critical' as const,
    explanation: 'Requests upfront payment, UPI PIN entry, or payment under guise of fee/deposit.',
  },
  {
    category: 'upi_payment' as const,
    label: 'UPI PIN Scam Trigger',
    regex: /(?:enter\s*pin\s*to\s*receive|pin\s*required\s*for\s*credit|accept\s*money\s*by\s*pin)/i,
    severity: 'critical' as const,
    explanation: 'Falsely claims user must enter UPI PIN to receive money (classic reverse UPI scam).',
  },

  // 2. Urgency & Coercion
  {
    category: 'urgency' as const,
    label: 'Urgent Account Suspension / Expiry Threat',
    regex: /(?:account\s*(?:will\s*be\s*)?(?:blocked|suspended|closed|deactivated|frozen)|immediate(?:ly)?\s*action|within\s*(?:24|12|48|2)\s*hours?|urgent(?:ly)?\s*update|kyc\s*(?:expired|pending|mandatory|verification)|pan\s*(?:card)?\s*(?:link|update|deactivated)|sim\s*(?:blocked|deactivation)|electricity\s*power\s*cut|last\s*(?:warning|reminder))/i,
    severity: 'high' as const,
    explanation: 'Uses artificial urgency and threats of account closure or service disruption.',
  },

  // 3. Fake Refunds & Cashbacks
  {
    category: 'fake_refund' as const,
    label: 'Fake Refund / Cashback / Reward Offer',
    regex: /(?:refund\s*(?:approved|pending|initiated|process|claim)|cashback\s*(?:of\s*(?:rs|₹)?)?\s*\d+|claim\s*(?:your\s*)?(?:reward|lottery|prize|bonus)|double\s*your\s*money|credit\s*card\s*points\s*redemption|overpaid\s*amount\s*return|instant\s*loan\s*approval)/i,
    severity: 'critical' as const,
    explanation: 'Lures victims with fake refunds, unearned cashbacks, or lottery payouts.',
  },

  // 4. DM-for-Support / Unofficial Contact
  {
    category: 'dm_support' as const,
    label: 'Unofficial Support / Redirection to DM',
    regex: /(?:dm\s*(?:us|me)|contact\s*(?:on|via)\s*whatsapp|telegram\s*(?:support|channel|bot|desk)|inbox\s*for\s*resolution|message\s*on\s*whatsapp|customer\s*care\s*helpline\s*[:=]|24x7\s*support\s*executive|reach\s*out\s*in\s*dm|private\s*message\s*support)/i,
    severity: 'high' as const,
    explanation: 'Redirects official inquiries to unverified WhatsApp, Telegram, or private DMs.',
  },

  // 5. Credential Phishing / Remote Desktop App Malware
  {
    category: 'credential_otp' as const,
    label: 'OTP / Credential / Remote Access Solicitation',
    regex: /(?:share\s*otp|enter\s*otp|netbanking\s*password|cvv\s*number|card\s*expiry|install\s*(?:anydesk|teamviewer|rustdesk|quicksupport)|download\s*apk|screen\s*sharing)/i,
    severity: 'critical' as const,
    explanation: 'Attempts to steal OTPs, banking credentials, or trick user into installing remote access tools.',
  },
];

/**
 * Analyzes arbitrary text, bio, message or URL for scam signals & extracts IOCs
 */
export function analyzeScamSignals(text: string): ScamSignalAnalysis {
  const matches: ScamSignalMatch[] = [];
  const extractedIocs: ThreatIOC[] = [];
  const summaryReasons: string[] = [];

  const raw = text || '';

  // 1. Check for specific UPI handles
  const upiMatches = raw.match(UPI_REGEX) || [];
  for (const upi of upiMatches) {
    extractedIocs.push({ type: 'upi', value: upi });
    matches.push({
      category: 'upi_payment',
      label: 'Specific UPI Handle Detected',
      matchedText: upi,
      severity: 'critical',
      explanation: `Found direct payment handle (${upi}) in communication.`,
    });
  }

  // Check generic VPA if not matched by specific
  if (upiMatches.length === 0) {
    const genericUpis = raw.match(GENERIC_UPI_REGEX) || [];
    for (const gUpi of genericUpis) {
      if (!gUpi.includes('@gmail') && !gUpi.includes('@yahoo') && !gUpi.includes('@outlook') && !gUpi.includes('@hotmail')) {
        extractedIocs.push({ type: 'upi', value: gUpi });
        matches.push({
          category: 'upi_payment',
          label: 'Potential Payment VPA Address',
          matchedText: gUpi,
          severity: 'high',
          explanation: `Found address formatted as UPI handle: ${gUpi}`,
        });
      }
    }
  }

  // 2. Check for Phone numbers
  const phoneMatches = raw.match(PHONE_REGEX) || [];
  for (const phone of phoneMatches) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
      extractedIocs.push({ type: 'phone', value: phone.trim() });
    }
  }

  // 3. Check for Telegram / WhatsApp links
  let tgMatch;
  while ((tgMatch = TELEGRAM_REGEX.exec(raw)) !== null) {
    const tgHandle = tgMatch[1] || tgMatch[2] || tgMatch[0];
    extractedIocs.push({ type: 'telegram', value: tgHandle });
  }

  let waMatch;
  while ((waMatch = WHATSAPP_REGEX.exec(raw)) !== null) {
    const waNumber = waMatch[1] || waMatch[0];
    extractedIocs.push({ type: 'phone', value: waNumber });
  }

  // 4. Pattern checks
  let hasUpiRequests = false;
  let hasUrgency = false;
  let hasFakeRefunds = false;
  let hasDmSupport = false;
  let hasOtpHarvesting = false;

  for (const pattern of SCAM_PATTERNS) {
    const match = raw.match(pattern.regex);
    if (match) {
      matches.push({
        category: pattern.category,
        label: pattern.label,
        matchedText: match[0],
        severity: pattern.severity,
        explanation: pattern.explanation,
      });

      if (pattern.category === 'upi_payment') hasUpiRequests = true;
      if (pattern.category === 'urgency') hasUrgency = true;
      if (pattern.category === 'fake_refund') hasFakeRefunds = true;
      if (pattern.category === 'dm_support') hasDmSupport = true;
      if (pattern.category === 'credential_otp') hasOtpHarvesting = true;
    }
  }

  // Build summary reasons
  if (hasUpiRequests || upiMatches.length > 0) {
    summaryReasons.push('Explicit UPI payment/PIN request detected — standard vector for fund diversion.');
  }
  if (hasUrgency) {
    summaryReasons.push('High-pressure urgency/coercion tactics (threat of account block/expiry).');
  }
  if (hasFakeRefunds) {
    summaryReasons.push('Luring incentives detected (unsolicited refund, cashback, or reward claim).');
  }
  if (hasDmSupport) {
    summaryReasons.push('Solicitation to private messaging (WhatsApp/Telegram/DM) instead of official channels.');
  }
  if (hasOtpHarvesting) {
    summaryReasons.push('High-risk request for OTP, PIN, credentials, or remote screen-sharing application.');
  }

  // Calculate deterministic score (0 - 50)
  let scamSignalScore = 0;
  if (hasUpiRequests || upiMatches.length > 0) scamSignalScore += 20;
  if (hasFakeRefunds) scamSignalScore += 15;
  if (hasUrgency) scamSignalScore += 10;
  if (hasDmSupport) scamSignalScore += 10;
  if (hasOtpHarvesting) scamSignalScore += 25;

  scamSignalScore = Math.min(50, scamSignalScore);

  return {
    hasUpiRequests: hasUpiRequests || upiMatches.length > 0,
    hasUrgency,
    hasFakeRefunds,
    hasDmSupport,
    hasOtpHarvesting,
    matches,
    extractedIocs: deduplicateIocs(extractedIocs),
    scamSignalScore,
    summaryReasons,
  };
}

function deduplicateIocs(iocs: ThreatIOC[]): ThreatIOC[] {
  const seen = new Set<string>();
  const result: ThreatIOC[] = [];
  for (const ioc of iocs) {
    const key = `${ioc.type}:${ioc.value.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ioc);
    }
  }
  return result;
}
