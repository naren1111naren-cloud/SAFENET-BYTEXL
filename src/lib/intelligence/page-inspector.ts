/**
 * SAFENET Internet Intelligence Platform - Webpage HTML Content Inspector
 * Static, non-executing HTML parser extracting forms, credentials, external scripts,
 * cross-domain targets, and deceptive social engineering language patterns.
 */

export interface FormInspectionDetail {
  action?: string;
  method?: string;
  hasPasswordInput: boolean;
  hasOtpInput: boolean;
  hasPaymentFields: boolean;
  inputNames: string[];
  isCrossDomainAction: boolean;
  targetHostname?: string;
}

export interface PageInspectionReport {
  inspected: boolean;
  title?: string;
  canonicalUrl?: string;
  formCount: number;
  passwordInputCount: number;
  otpInputCount: number;
  paymentFieldCount: number;
  forms: FormInspectionDetail[];
  externalScriptHosts: string[];
  hasCrossDomainFormSubmission: boolean;
  suspiciousKeywordsDetected: string[];
  brandReferencesFound: string[];
  metaDescription?: string;
  sanitizedTextSnippet?: string;
}

/**
 * Escapes HTML characters for safe presentation.
 */
export function sanitizePlainText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SUSPICIOUS_PATTERNS = [
  { label: 'Urgent Account Suspension Threat', regex: /\b(suspend|suspended|deactivate|blocked within|24 hours|immediate action required)\b/i },
  { label: 'Mandatory KYC / PAN Reverification Lure', regex: /\b(kyc verification|pan card update|aadhaar linking|re-verify your account|mandatory verification)\b/i },
  { label: 'Credential & OTP Harvesting Request', regex: /\b(enter your otp|one-time password|enter pin|confirm your password|login to verify)\b/i },
  { label: 'Prize / Unclaimed Cashback Lure', regex: /\b(unclaimed cash|lottery prize|reward pending|scratch card reward|claim cashback)\b/i },
  { label: 'Remote Access / Malicious APK Request', regex: /\b(download anydesk|install quicksupport|teamviewer support|download .apk|install our app)\b/i },
];

/**
 * Parses raw HTML string statically and extracts security indicators.
 */
export function inspectHtmlContent(
  html: string | undefined,
  currentHostname: string,
  targetBrandKeywords: string[] = ['Paytm']
): PageInspectionReport {
  if (!html || typeof html !== 'string') {
    return {
      inspected: false,
      formCount: 0,
      passwordInputCount: 0,
      otpInputCount: 0,
      paymentFieldCount: 0,
      forms: [],
      externalScriptHosts: [],
      hasCrossDomainFormSubmission: false,
      suspiciousKeywordsDetected: [],
      brandReferencesFound: [],
    };
  }

  // 1. Title Extraction
  let title: string | undefined = undefined;
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (titleMatch && titleMatch[1]) {
    title = sanitizePlainText(titleMatch[1].trim().slice(0, 150));
  }

  // 2. Canonical URL & Meta Description
  let canonicalUrl: string | undefined = undefined;
  const canonicalMatch = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (canonicalMatch && canonicalMatch[1]) {
    canonicalUrl = canonicalMatch[1].trim().slice(0, 200);
  }

  let metaDescription: string | undefined = undefined;
  const metaDescMatch = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (metaDescMatch && metaDescMatch[1]) {
    metaDescription = sanitizePlainText(metaDescMatch[1].trim().slice(0, 250));
  }

  // 3. Form & Input Elements Inspection
  const forms: FormInspectionDetail[] = [];
  let passwordInputCount = 0;
  let otpInputCount = 0;
  let paymentFieldCount = 0;
  let hasCrossDomainFormSubmission = false;

  const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let formMatch: RegExpExecArray | null;

  while ((formMatch = formRegex.exec(html)) !== null) {
    const formAttributes = formMatch[1];
    const formBody = formMatch[2];

    const actionMatch = /\baction=["']([^"']*)["']/i.exec(formAttributes);
    const methodMatch = /\bmethod=["']([^"']*)["']/i.exec(formAttributes);
    const action = actionMatch ? actionMatch[1].trim() : '';
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

    let isCrossDomainAction = false;
    let targetHostname: string | undefined = undefined;

    if (action.startsWith('http://') || action.startsWith('https://')) {
      try {
        const parsedAction = new URL(action);
        targetHostname = parsedAction.hostname.toLowerCase();
        if (targetHostname !== currentHostname.toLowerCase() && !currentHostname.endsWith(`.${targetHostname}`)) {
          isCrossDomainAction = true;
          hasCrossDomainFormSubmission = true;
        }
      } catch {
        // Ignored URL parsing error
      }
    }

    // Inspect inputs inside this form
    let hasPassword = false;
    let hasOtp = false;
    let hasPayment = false;
    const inputNames: string[] = [];

    const inputRegex = /<input\b([^>]*)>/gi;
    let inputMatch: RegExpExecArray | null;

    while ((inputMatch = inputRegex.exec(formBody)) !== null) {
      const inputAttrs = inputMatch[1];
      const typeMatch = /\btype=["']([^"']*)["']/i.exec(inputAttrs);
      const nameMatch = /\bname=["']([^"']*)["']/i.exec(inputAttrs);
      const inputType = typeMatch ? typeMatch[1].toLowerCase() : 'text';
      const inputName = nameMatch ? nameMatch[1].toLowerCase() : '';

      if (inputName) inputNames.push(inputName.slice(0, 40));

      if (inputType === 'password') {
        hasPassword = true;
        passwordInputCount++;
      }
      if (/otp|passcode|token|2fa|verification_code|sms_code/i.test(inputName)) {
        hasOtp = true;
        otpInputCount++;
      }
      if (/card|cvv|expiry|cardnumber|upi|vpa|bank_account|routing/i.test(inputName)) {
        hasPayment = true;
        paymentFieldCount++;
      }
    }

    forms.push({
      action: action.slice(0, 150),
      method,
      hasPasswordInput: hasPassword,
      hasOtpInput: hasOtp,
      hasPaymentFields: hasPayment,
      inputNames,
      isCrossDomainAction,
      targetHostname,
    });
  }

  // 4. External Script Tag Hostnames
  const externalScriptHostsSet = new Set<string>();
  const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const src = scriptMatch[1].trim();
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      try {
        const fullUrl = src.startsWith('//') ? `https:${src}` : src;
        const parsed = new URL(fullUrl);
        if (parsed.hostname.toLowerCase() !== currentHostname.toLowerCase()) {
          externalScriptHostsSet.add(parsed.hostname.toLowerCase());
        }
      } catch {
        // Ignored
      }
    }
  }

  // 5. Keyword & Social Engineering Analysis
  const suspiciousKeywordsDetected: string[] = [];
  for (const item of SUSPICIOUS_PATTERNS) {
    if (item.regex.test(html)) {
      suspiciousKeywordsDetected.push(item.label);
    }
  }

  // 6. Brand Mentions
  const brandReferencesFound: string[] = [];
  for (const brand of targetBrandKeywords) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(html)) {
      brandReferencesFound.push(brand);
    }
  }

  // 7. Sanitized Text Snippet
  // Strip tags and excessive whitespace
  const rawText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const sanitizedTextSnippet = sanitizePlainText(rawText.slice(0, 300));

  return {
    inspected: true,
    title,
    canonicalUrl,
    formCount: forms.length,
    passwordInputCount,
    otpInputCount,
    paymentFieldCount,
    forms,
    externalScriptHosts: Array.from(externalScriptHostsSet).slice(0, 10),
    hasCrossDomainFormSubmission,
    suspiciousKeywordsDetected,
    brandReferencesFound,
    metaDescription,
    sanitizedTextSnippet,
  };
}
