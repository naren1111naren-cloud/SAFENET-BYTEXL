/**
 * SAFENET Look-alike Review & Feedback Persistence Store
 * Enables analysts to record verification decisions:
 * - Legitimate (False positive / whitelist)
 * - Suspicious (Watchlist / under observation)
 * - Confirmed Impersonation (Escalated threat)
 * Dual-persists via Supabase and local storage fallback.
 */

import { supabaseClient } from '../supabase/client';
import { LegitimateAssetRegistry } from './legitimate-registry';

export type ReviewDecisionType = 'legitimate' | 'suspicious' | 'confirmed_impersonation';

export interface LookalikeReviewRecord {
  id: string;
  brandId: string;
  brandName: string;
  candidateName: string;
  platform?: string;
  profileUrl?: string;
  decision: ReviewDecisionType;
  similarityScore: number;
  riskScore: number;
  variationType: string;
  notes?: string;
  reviewedBy: string;
  reviewedAt: string;
}

const STORAGE_KEY = 'safenet_lookalike_reviews';

// In-memory fallback
let _memoryReviews: LookalikeReviewRecord[] = [];

export const LookalikeReviewStore = {
  /**
   * Retrieves all review decisions, optionally filtered by brand
   */
  getReviews(brandName?: string): LookalikeReviewRecord[] {
    let list: LookalikeReviewRecord[] = [];

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) list = JSON.parse(raw);
      } catch {
        list = [..._memoryReviews];
      }
    } else {
      list = [..._memoryReviews];
    }

    if (brandName) {
      const b = brandName.toLowerCase();
      return list.filter((r) => r.brandName.toLowerCase() === b || r.brandId.toLowerCase() === b);
    }
    return list;
  },

  /**
   * Records or updates a review decision
   */
  async recordDecision(review: Omit<LookalikeReviewRecord, 'id' | 'reviewedAt'>): Promise<LookalikeReviewRecord> {
    const record: LookalikeReviewRecord = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reviewedAt: new Date().toISOString(),
    };

    // If marked legitimate, register in LegitimateAssetRegistry so future scans respect it
    if (record.decision === 'legitimate') {
      LegitimateAssetRegistry.addAllowlistEntry({
        brandId: record.brandId || record.brandName,
        type: record.candidateName.startsWith('@') ? 'handle' : 'name',
        value: record.candidateName,
        notes: record.notes || `Analyst ${record.reviewedBy} marked as legitimate`,
      });
    }

    // Save in memory
    _memoryReviews.unshift(record);

    // Save in localStorage if in browser
    if (typeof window !== 'undefined') {
      try {
        const existing = this.getReviews();
        // Replace existing review for same candidate and brand if present
        const filtered = existing.filter(
          (r) => !(r.brandName.toLowerCase() === record.brandName.toLowerCase() && r.candidateName.toLowerCase() === record.candidateName.toLowerCase())
        );
        filtered.unshift(record);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.warn('[SAFENET] Failed to save review to localStorage', e);
      }
    }

    // Asynchronously sync to Supabase if configured
    if (supabaseClient.getIsConfigured()) {
      try {
        await supabaseClient.insertRecord('lookalike_reviews', {
          brand_id: record.brandId,
          brand_name: record.brandName,
          candidate_name: record.candidateName,
          platform: record.platform,
          profile_url: record.profileUrl,
          decision: record.decision,
          similarity_score: record.similarityScore,
          risk_score: record.riskScore,
          variation_type: record.variationType,
          notes: record.notes,
          reviewed_by: record.reviewedBy,
          reviewed_at: record.reviewedAt,
        });
      } catch (err) {
        // Supabase error is non-blocking to prevent UI disruption
        console.warn('[SAFENET] Supabase review sync notice:', err);
      }
    }

    return record;
  },

  /**
   * Retrieves specific review for candidate if one exists
   */
  getReviewForCandidate(candidateName: string, brandName: string): LookalikeReviewRecord | null {
    const list = this.getReviews(brandName);
    const c = candidateName.toLowerCase().trim();
    return list.find((r) => r.candidateName.toLowerCase().trim() === c) || null;
  },
};
