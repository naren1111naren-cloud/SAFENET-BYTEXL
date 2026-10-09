import { ThreatItem, BrandProfile } from '@/types/brand';

export type TakedownRecipient = 'registrar' | 'social_platform' | 'npci_bank' | 'app_store' | 'cert_in';

export interface TakedownReport {
  recipientType: TakedownRecipient;
  recipientTitle: string;
  subject: string;
  body: string;
  generatedAt: string;
}

/**
 * Generates formal takedown notices tailored by recipient authority
 */
export function generateTakedownNotice(
  threat: ThreatItem,
  brand: BrandProfile,
  recipient: TakedownRecipient = 'registrar'
): TakedownReport {
  const date = new Date().toUTCString();
  const iocList = (threat.iocs || []).map((i) => `  - [${i.type.toUpperCase()}]: ${i.value}`).join('\n') || '  - None specified';
  const reasonsList = (threat.reasons || []).map((r) => `  * ${r}`).join('\n') || '  * Brand impersonation and consumer fraud';

  switch (recipient) {
    case 'registrar':
      return {
        recipientType: 'registrar',
        recipientTitle: 'Domain Registrar & Hosting Abuse Team',
        subject: `URGENT ABUSE & TAKEDOWN NOTICE: Phishing & Trademark Infringement targeting ${brand.name} [Domain: ${threat.targetAsset}]`,
        generatedAt: date,
        body: `ATTN: Abuse & Security Operations Center / Legal Department

DATE: ${date}
COMPLAINANT: ${brand.name} Brand Protection Team (Official Domain: ${brand.domain})
INFRINGING ASSET: ${threat.targetAsset}
SEVERITY: CRITICAL (Risk Score: ${threat.riskScore}/100)

Dear Abuse Team,

We are writing on behalf of ${brand.name} to formally report and demand the immediate deactivation/suspension of the infringing domain and web hosting services operating at:

  Target Domain / URL: ${threat.targetAsset}

1. SUMMARY OF MALICIOUS ACTIVITY:
The subject domain is actively engaged in unauthorized brand impersonation, consumer deception, and phishing fraud. It targets customers of ${brand.name} by mimicking official branding and attempting financial theft.

2. FORENSIC EVIDENCE & REASONS FOR TAKEDOWN:
${reasonsList}

3. EXTRACTED INDICATORS OF COMPROMISE (IOCs):
${iocList}

4. LEGAL & REGULATORY VIOLATIONS:
- Trademark & Intellectual Property Infringement: Unauthorized use of ${brand.name}'s proprietary mark.
- Phishing & Wire Fraud: Intentional misrepresentation to deceive consumers into transferring funds or credentials.
- Violation of Registrar & ICANN Terms of Service / Acceptable Use Policy (AUP).

5. REQUESTED REMEDIAL ACTION:
We request that you immediately:
a) Suspend the domain registration and place it on ClientHold / ServerHold.
b) Terminate associated DNS records and hosting instances hosting phishing kits.
c) Preserve access logs and registrant records for law enforcement submission.

Please confirm receipt and execution of this takedown request within 24 hours.

Sincerely,
Digital Risk Protection Operations
${brand.name} Security & Legal Office
Contact: abuse-desk@${brand.domain}
Ref ID: TS-TKD-${threat.id.toUpperCase()}`,
      };

    case 'social_platform':
      return {
        recipientType: 'social_platform',
        recipientTitle: 'Social Platform Trust & Safety (Meta / X / Telegram)',
        subject: `IMMEDIATE IMPERSONATION REPORT: Fake Customer Support Account Spoofing ${brand.name} [${threat.targetAsset}]`,
        generatedAt: date,
        body: `ATTN: Trust & Safety / Impersonation & Fraud Department

DATE: ${date}
OFFICIAL BRAND: ${brand.name} (${brand.domain})
OFFICIAL HANDLES: ${JSON.stringify(brand.handles || {})}
IMPERSONATING ACCOUNT / CHANNEL: ${threat.targetAsset}

Dear Trust & Safety Team,

We are submitting an urgent impersonation and consumer protection report regarding the rogue account/channel:
  Infringing Profile: ${threat.targetAsset}

EVIDENCE OF IMPERSONATION & HARMFUL CONDUCT:
- This profile is falsely claiming to be the official customer care / refund support team of ${brand.name}.
- It actively contacts users or intercepts public grievances to divert victims into private chats.
${reasonsList}

DETECTED FRAUD VECTORS & IOCs:
${iocList}

REQUESTED ACTION:
Pursuant to your platform's Impersonation and Deceptive Practices Policy, we request the immediate permanent suspension/ban of account "${threat.targetAsset}".

Submitted by:
${brand.name} Brand Integrity & Cyber Defense Team
Ref ID: TS-SOC-${threat.id.toUpperCase()}`,
      };

    case 'npci_bank':
      return {
        recipientType: 'npci_bank',
        recipientTitle: 'NPCI / Bank Fraud & VPA Abuse Cell',
        subject: `CYBER FRAUD ALERT: Fraudulent UPI VPA Used in Impersonation Scam Targeting ${brand.name}`,
        generatedAt: date,
        body: `TO: National Payments Corporation of India (NPCI) / Nodal Fraud Monitoring Desk / Partner Banks

DATE: ${date}
REPORTING ENTITY: ${brand.name} Cyber Threat Intelligence
FRAUDULENT ASSET / MESSAGE: ${threat.targetAsset}
RISK SCORE: ${threat.riskScore}/100

Dear Nodal Officer,

Our Digital Risk Intelligence platform (SAFENET) has intercepted active financial scam lures falsely utilizing ${brand.name}'s identity to solicit unauthorized UPI transfers or execute reverse-UPI PIN authorization fraud.

ASSOCIATED UPI VPAs / PAYMENT HANDLES:
${iocList}

FRAUD MODUS OPERANDI:
${reasonsList}

ACTION REQUESTED:
1. Immediately freeze and blacklist the identified UPI VPAs and associated beneficiary accounts.
2. Flag linked mobile numbers across central fraud databases (CFMS / I4C).
3. Provide transaction freeze confirmation for regulatory record.

Authorized Security Officer
${brand.name} Cyber Security Cell
Ref ID: TS-UPI-${threat.id.toUpperCase()}`,
      };

    case 'app_store':
      return {
        recipientType: 'app_store',
        recipientTitle: 'Google Play & Apple App Store Anti-Malware Desk',
        subject: `ROGUE APK / APP TAKEDOWN NOTICE: Trademark Clone & Malware [${threat.targetAsset}]`,
        generatedAt: date,
        body: `ATTN: Developer Policy Enforcement / Trademark & Impersonation Desk

DATE: ${date}
BRAND: ${brand.name}
OFFICIAL APP: ${brand.appPackageName || `${brand.domain}.app`}
INFRINGING APP / APK: ${threat.targetAsset}

Dear App Review Team,

We request the emergency removal of the unverified rogue mobile application "${threat.targetAsset}".

VIOLATIONS:
- Deceptive App Identity & Impersonation of ${brand.name}.
- Distribution of unauthorized APKs requesting dangerous permissions (SMS reading, Screen Overlay, Contacts) to harvest financial OTPs.
${reasonsList}

Evidence & Distribution IOCs:
${iocList}

Please purge this application and terminate associated developer certificates immediately.

${brand.name} Mobile Security Operations
Ref ID: TS-APK-${threat.id.toUpperCase()}`,
      };

    case 'cert_in':
    default:
      return {
        recipientType: 'cert_in',
        recipientTitle: 'CERT-In / National Cyber Crime Reporting Portal (NCRP)',
        subject: `INCIDENT REPORT: Digital Brand Impersonation & Consumer Fraud Campaign against ${brand.name}`,
        generatedAt: date,
        body: `TO: Indian Computer Emergency Response Team (CERT-In) / Cyber Crime Incident Cell

INCIDENT ID: TS-INC-${threat.id.toUpperCase()}
DATE OF DETECTION: ${threat.discoveredAt || date}
VICTIM ENTITY: ${brand.name} (${brand.domain})
THREAT VECTOR: ${threat.type.toUpperCase()}
OVERALL THREAT SEVERITY: ${threat.riskScore >= 75 ? 'HIGH / CRITICAL' : 'MODERATE'} (Score: ${threat.riskScore}/100)

INCIDENT OVERVIEW:
SAFENET surveillance identified an active campaign designed to deceive consumers by mimicking ${brand.name}.

1. INFRINGING INFRASTRUCTURE:
  Target Asset: ${threat.targetAsset}
  Source: ${threat.source}

2. CORRELATED THREAT INDICATORS (IOCs):
${iocList}

3. ATTACK CHARACTERISTICS & THREAT SIGNALS:
${reasonsList}

4. MITIGATION IN PROGRESS:
- Takedown notice issued to domain registrars and platform hosts.
- Advisory issued to customers.
- Requesting CERT-In advisory coordination and ISP-level DNS blocking if necessary.

Reporting Authority:
Chief Information Security Officer (CISO)
${brand.name} Information Security Group`,
      };
  }
}
