'use client';

export type VerificationType = 'message' | 'url' | 'media';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNVERIFIED';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface EvidenceSource {
  name: string;
  type: 'Official Source' | 'Trusted News' | 'Fact-Checking' | 'Domain Intelligence' | 'Original Publication';
  relevance: 'Direct Match' | 'Contextual' | 'Counter-Evidence' | 'Technical Signal';
  status: 'Verified' | 'Not Found' | 'Suspicious' | 'Warning';
  url?: string;
  timestamp?: string;
  summary: string;
}

export interface ExplainableSignal {
  signal: string;
  detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
}

export interface VerificationRecord {
  id: string;
  type: VerificationType;
  rawInput: string;
  extractedClaim: string;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  verdictTitle: string;
  verdictDescription: string;
  signalsFound: string[];
  explainableSignals: ExplainableSignal[];
  evidenceSources: EvidenceSource[];
  assessmentSummary: string;
  recommendedAction: {
    heading: 'DO NOT CLICK' | 'VERIFY FIRST' | 'SAFE TO PROCEED' | 'WAIT FOR CONFIRMATION' | 'DO NOT PAY';
    advice: string;
    steps: string[];
  };
  domainIntel?: {
    domain: string;
    httpsStatus: boolean;
    domainAge?: string;
    redirectsDetected: boolean;
    brandMimicrySignal: boolean;
  };
  mediaAnalysis?: {
    textExtracted: string;
    manipulationSignal: string;
    aiGeneratedSignal: string;
  };
  timestamp: string;
  isSample?: boolean;
}

const STORAGE_KEY = 'safenet_user_verifications';

// Pre-seeded authentic real-world sample checks (clearly marked)
export const INITIAL_SAMPLE_CHECKS: VerificationRecord[] = [
  {
    id: 'check-001',
    type: 'message',
    rawInput: 'URGENT: Your HDFC Bank account will be blocked today due to pending PAN KYC. Click http://hdfc-kyc-update.online to avoid suspension.',
    extractedClaim: 'Bank account will be blocked today unless PAN KYC is completed via link.',
    riskLevel: 'CRITICAL',
    confidence: 'High',
    verdictTitle: 'Phishing & Credential Theft Attempt',
    verdictDescription: 'The message uses urgent account blockage language and directs to an unauthorized lookalike domain soliciting bank credentials.',
    signalsFound: [
      'Urgency & coercion language detected',
      'Unauthorized lookalike domain detected',
      'Sensitive banking KYC credential request',
      'Official banking confirmation not found',
      'Unregistered short-lived domain'
    ],
    explainableSignals: [
      {
        signal: 'Brand & Identity Impersonation',
        detected: true,
        severity: 'critical',
        explanation: 'The domain "hdfc-kyc-update.online" mimics HDFC Bank but is not registered or owned by the institution.'
      },
      {
        signal: 'Urgency & Pressure Manipulation',
        detected: true,
        severity: 'high',
        explanation: 'Threatens immediate account block within 24 hours to panic the victim into bypassing security verification.'
      },
      {
        signal: 'Suspicious Destination',
        detected: true,
        severity: 'critical',
        explanation: 'Destination redirects to an unverified .online gTLD registered only 4 days ago with hidden WHOIS privacy.'
      },
      {
        signal: 'Missing Official Confirmation',
        detected: true,
        severity: 'high',
        explanation: 'Official banks in India never send unsolicited SMS links requesting immediate KYC update or credentials.'
      }
    ],
    evidenceSources: [
      {
        name: 'HDFC Bank Security Advisory',
        type: 'Official Source',
        relevance: 'Direct Match',
        status: 'Warning',
        summary: 'Official advisory warns customers that bank never requests KYC updates via third-party web forms or SMS links.'
      },
      {
        name: 'Domain Registrar & DNS Intelligence',
        type: 'Domain Intelligence',
        relevance: 'Technical Signal',
        status: 'Suspicious',
        summary: 'Domain registered 4 days ago on NameCheap with masked WHOIS records. Zero legitimate bank MX or SSL EV validation.'
      },
      {
        name: 'National Cyber Crime Reporting Portal (NCRP)',
        type: 'Fact-Checking',
        relevance: 'Contextual',
        status: 'Verified',
        summary: 'Over 140 reports matching identical SMS text format associated with unauthorized phishing clusters.'
      }
    ],
    assessmentSummary: 'High-confidence financial phishing campaign. The attacker employs trademark spoofing and false deadlines to capture net banking credentials and OTPs.',
    recommendedAction: {
      heading: 'DO NOT CLICK',
      advice: 'Do not click the link, do not enter PAN or debit card details, and do not forward this message.',
      steps: [
        'Delete the message immediately or report it to 1930 (National Cyber Crime Helpline).',
        'If you already clicked, contact your bank immediately to freeze online banking access.',
        'Always check account status directly in the official banking mobile application.'
      ]
    },
    timestamp: '12 minutes ago',
    isSample: true,
  },
  {
    id: 'check-002',
    type: 'url',
    rawInput: 'https://paytm.com/recharge',
    extractedClaim: 'Official online mobile recharge and utility payment portal for Paytm.',
    riskLevel: 'LOW',
    confidence: 'High',
    verdictTitle: 'Likely Trustworthy & Authentic',
    verdictDescription: 'Verified official digital property owned and operated by One97 Communications (Paytm). Valid EV TLS certificate with authentic root domain.',
    signalsFound: [
      'Official root domain verified',
      'Valid Extended Validation SSL certificate',
      'No redirect manipulation detected',
      'Legitimate corporate DNS infrastructure',
      'Zero phishing or threat flags across domain databases'
    ],
    explainableSignals: [
      {
        signal: 'Identity & Root Domain Match',
        detected: false,
        severity: 'low',
        explanation: 'Target belongs to the official root domain paytm.com registered in 2010.'
      },
      {
        signal: 'Phishing Kit / Form Injection',
        detected: false,
        severity: 'low',
        explanation: 'Page uses legitimate corporate authentication flows without external exfiltration hooks.'
      }
    ],
    evidenceSources: [
      {
        name: 'Paytm Verified Asset Directory',
        type: 'Official Source',
        relevance: 'Direct Match',
        status: 'Verified',
        summary: 'Exact match with One97 Communications official production web infrastructure.'
      },
      {
        name: 'Certificate Authority & DNS Registry',
        type: 'Domain Intelligence',
        relevance: 'Technical Signal',
        status: 'Verified',
        summary: 'Valid DigiCert SHA-2 High Assurance Server CA certificate with standard HSTS enforcement.'
      }
    ],
    assessmentSummary: 'No risk indicators detected. The destination URL is authentic and safe for transactions.',
    recommendedAction: {
      heading: 'SAFE TO PROCEED',
      advice: 'The link is safe to use. Verify that the address bar displays https://paytm.com before logging in.',
      steps: [
        'Proceed safely with utility recharge or payment.',
        'Ensure you never share generated OTPs with anyone claiming to call from support.'
      ]
    },
    domainIntel: {
      domain: 'paytm.com',
      httpsStatus: true,
      domainAge: '14+ years (Registered 2010)',
      redirectsDetected: false,
      brandMimicrySignal: false,
    },
    timestamp: '42 minutes ago',
    isSample: true,
  },
  {
    id: 'check-003',
    type: 'message',
    rawInput: 'Government of India has announced free ₹5,000 monthly allowance for all citizens under PM-Kisan Yuva Yojana. Register on free-pm-allowance.site within 24 hours.',
    extractedClaim: 'Government of India providing ₹5,000 monthly allowance under PM-Kisan Yuva Yojana.',
    riskLevel: 'HIGH',
    confidence: 'High',
    verdictTitle: 'Unverified Scheme & Fraudulent Lure',
    verdictDescription: 'Fabricated government welfare scheme using unauthorized web form to harvest user Aadhaar, phone numbers, and payment details.',
    signalsFound: [
      'Fictitious government scheme name',
      'Non-government .site top-level domain',
      'Aadhaar / PII harvesting form detected',
      'Official PIB Fact Check debunked identical claim'
    ],
    explainableSignals: [
      {
        signal: 'Government Impersonation',
        detected: true,
        severity: 'critical',
        explanation: 'Official central schemes use gov.in or nic.in domains. This site uses a generic commercial .site extension.'
      },
      {
        signal: 'Fabricated Financial Benefit',
        detected: true,
        severity: 'high',
        explanation: 'No scheme named "PM-Kisan Yuva Yojana" exists in the Ministry of Agriculture or Finance databases.'
      }
    ],
    evidenceSources: [
      {
        name: 'PIB Fact Check (Government of India)',
        type: 'Fact-Checking',
        relevance: 'Direct Match',
        status: 'Verified',
        summary: 'PIB Fact Check confirmed this viral message is completely FAKE. Government has issued no such monthly allowance scheme.'
      },
      {
        name: 'National Informatics Centre (NIC) Registry',
        type: 'Official Source',
        relevance: 'Counter-Evidence',
        status: 'Warning',
        summary: 'Domain free-pm-allowance.site has zero association with Government of India infrastructure.'
      }
    ],
    assessmentSummary: 'Known viral misinformation scheme designed to extract identity documents and mobile numbers for subsequent scam targeting.',
    recommendedAction: {
      heading: 'VERIFY FIRST',
      advice: 'Do not register, do not share personal ID numbers, and do not forward to WhatsApp groups.',
      steps: [
        'Refer to pib.gov.in or myscheme.gov.in for all authentic Government of India welfare schemes.',
        'Warn family and contacts who shared this message that it has been officially debunked.'
      ]
    },
    timestamp: '2 hours ago',
    isSample: true,
  }
];

export const VerificationStore = {
  getChecks(): VerificationRecord[] {
    if (typeof window === 'undefined') return INITIAL_SAMPLE_CHECKS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      this.saveChecks(INITIAL_SAMPLE_CHECKS);
      return INITIAL_SAMPLE_CHECKS;
    } catch {
      return INITIAL_SAMPLE_CHECKS;
    }
  },

  saveChecks(records: VerificationRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save verifications', e);
    }
  },

  addCheck(record: VerificationRecord): void {
    const existing = this.getChecks();
    const updated = [record, ...existing.filter((c) => c.id !== record.id)];
    this.saveChecks(updated);
  },

  getCheckById(id: string): VerificationRecord | null {
    const list = this.getChecks();
    return list.find((c) => c.id === id) || null;
  },

  getUserActivityStats() {
    const checks = this.getChecks();
    const totalChecks = checks.length;
    const trustworthyCount = checks.filter((c) => c.riskLevel === 'LOW').length;
    const attentionCount = checks.filter((c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length;
    const unverifiedCount = checks.filter((c) => c.riskLevel === 'MEDIUM' || c.riskLevel === 'UNVERIFIED').length;

    // Categories found based on actual checks
    const categories: { label: string; count: number }[] = [];
    const scamCount = checks.filter((c) => c.signalsFound.some((s) => s.toLowerCase().includes('scam') || s.toLowerCase().includes('phishing') || s.toLowerCase().includes('lure'))).length;
    const unverifiedClaimsCount = checks.filter((c) => c.signalsFound.some((s) => s.toLowerCase().includes('unverified') || s.toLowerCase().includes('claim'))).length;
    const suspiciousLinksCount = checks.filter((c) => c.type === 'url' || c.signalsFound.some((s) => s.toLowerCase().includes('domain') || s.toLowerCase().includes('link'))).length;

    if (scamCount > 0) categories.push({ label: 'Potential Scams & Phishing', count: scamCount });
    if (unverifiedClaimsCount > 0) categories.push({ label: 'Unverified Viral Claims', count: unverifiedClaimsCount });
    if (suspiciousLinksCount > 0) categories.push({ label: 'Suspicious / Impersonated Links', count: suspiciousLinksCount });
    if (trustworthyCount > 0) categories.push({ label: 'Verified Trustworthy Sources', count: trustworthyCount });

    return {
      totalChecks,
      trustworthyCount,
      attentionCount,
      unverifiedCount,
      categories,
    };
  },

  clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
  }
};
