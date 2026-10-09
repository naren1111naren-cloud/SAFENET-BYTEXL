/**
 * SAFENET Internet Intelligence Platform - Strict Source-Attributed Evidence Model
 * Normalizes all observed findings into verifiable, typed evidence items.
 */

export type EvidenceStatus =
  | 'observed'
  | 'not_found'
  | 'unavailable'
  | 'error'
  | 'blocked'
  | 'not_applicable';

export type EvidenceCategory =
  | 'Identity'
  | 'Infrastructure'
  | 'Registration'
  | 'Cryptography'
  | 'Network'
  | 'Content'
  | 'ThreatFeeds';

export type EvidenceSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export interface NormalizedEvidenceItem {
  id: string;
  category: EvidenceCategory;
  findingName: string;
  observedValue: string;
  humanExplanation: string;
  source: string;
  timestamp: string;
  status: EvidenceStatus;
  severity: EvidenceSeverity;
  riskContribution?: number;
  sourceUrl?: string;
}

export interface ServiceOperationalStatus {
  serviceName: string;
  status: 'active' | 'unavailable' | 'unconfigured' | 'error' | 'blocked';
  message?: string;
  durationMs?: number;
}

export interface NormalizedEvidencePackage {
  scanId: string;
  originalInput: string;
  normalizedTarget: string;
  detectedType: 'domain' | 'url' | 'message' | 'social_profile' | 'mobile_app';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  serviceStatuses: Record<string, ServiceOperationalStatus>;
  evidenceItems: NormalizedEvidenceItem[];
  limitations: string[];
}

export class EvidenceBuilder {
  private items: NormalizedEvidenceItem[] = [];
  private serviceStatuses: Record<string, ServiceOperationalStatus> = {};
  private limitations: string[] = [];
  private scanId: string;
  private originalInput: string;
  private normalizedTarget: string;
  private detectedType: 'domain' | 'url' | 'message' | 'social_profile' | 'mobile_app';
  private startedAt: string;

  constructor(
    originalInput: string,
    normalizedTarget: string,
    detectedType: 'domain' | 'url' | 'message' | 'social_profile' | 'mobile_app' = 'domain'
  ) {
    this.scanId = `SCAN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    this.originalInput = originalInput;
    this.normalizedTarget = normalizedTarget;
    this.detectedType = detectedType;
    this.startedAt = new Date().toISOString();
  }

  public addServiceStatus(
    name: string,
    status: ServiceOperationalStatus['status'],
    message?: string,
    durationMs?: number
  ): this {
    this.serviceStatuses[name] = { serviceName: name, status, message, durationMs };
    return this;
  }

  public addEvidence(item: Omit<NormalizedEvidenceItem, 'timestamp'> & { timestamp?: string }): this {
    this.items.push({
      ...item,
      timestamp: item.timestamp || new Date().toISOString(),
    });
    return this;
  }

  public addLimitation(limitation: string): this {
    if (!this.limitations.includes(limitation)) {
      this.limitations.push(limitation);
    }
    return this;
  }

  public build(): NormalizedEvidencePackage {
    const completedAt = new Date().toISOString();
    const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(this.startedAt).getTime());

    return {
      scanId: this.scanId,
      originalInput: this.originalInput,
      normalizedTarget: this.normalizedTarget,
      detectedType: this.detectedType,
      startedAt: this.startedAt,
      completedAt,
      durationMs,
      serviceStatuses: this.serviceStatuses,
      evidenceItems: this.items,
      limitations: this.limitations,
    };
  }
}
