/**
 * SAFENET Social Monitoring Store & State Coordinator
 * Handles persistence for brand identity profiles, scans, candidates, and watchlist.
 * Seamlessly interfaces with Supabase when configured, with zero-dependency memory/local fallback.
 */

import {
  BrandIdentityProfile,
  SocialCandidateAnalysis,
  SocialScanProgress,
} from './types';
import { supabaseClient } from '../supabase/client';

export interface SocialScanRecord {
  id: string;
  brandId: string;
  brandName: string;
  status: 'running' | 'completed' | 'failed';
  totalCandidates: number;
  highCriticalCount: number;
  queryVariants: string[];
  providersUsed: Record<string, any>;
  executionMs: number;
  startedAt: string;
  completedAt?: string;
}

// Initial default monitored brand profiles matching SAFENET presets
const DEFAULT_BRAND_MONITORS: BrandIdentityProfile[] = [
  {
    id: 'brand-paytm-social',
    brandName: 'Paytm',
    officialDomain: 'paytm.com',
    officialUrls: ['https://paytm.com', 'https://paytmbank.com'],
    officialSocialHandles: {
      twitter: '@Paytm',
      instagram: '@paytm',
      telegram: '@paytmofficial',
      linkedin: 'company/paytm',
      youtube: 'user/paytm',
      facebook: 'paytm',
    },
    aliases: ['Paytm', 'Paytm Karo', 'One97', 'Paytm Payments Bank'],
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80',
    brandKeywords: ['Paytm', 'Paytm Wallet', 'Paytm Mall', 'Fastag', 'Paytm Soundbox'],
    knownDomains: ['paytm.com', 'paytmbank.com', 'paytmmoney.com'],
    officialDescription: 'India’s leading digital payments and financial services platform.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brand-hdfc-social',
    brandName: 'HDFC Bank',
    officialDomain: 'hdfcbank.com',
    officialUrls: ['https://www.hdfcbank.com'],
    officialSocialHandles: {
      twitter: '@HDFCBank',
      instagram: '@hdfcbank',
      linkedin: 'company/hdfc-bank',
      youtube: 'hdfcbank',
      facebook: 'HDFCBank',
    },
    aliases: ['HDFC', 'HDFC Bank India', 'HDFC Banking'],
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80',
    brandKeywords: ['HDFC', 'NetBanking', 'HDFC Loans', 'HDFC Credit Card', 'HDFC PayZapp'],
    knownDomains: ['hdfcbank.com', 'hdfc.com', 'hdfcbank.net'],
    officialDescription: 'Leading private sector banking and financial services in India.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brand-nike-social',
    brandName: 'Nike',
    officialDomain: 'nike.com',
    officialUrls: ['https://nike.com', 'https://snkrs.com'],
    officialSocialHandles: {
      twitter: '@Nike',
      instagram: '@nike',
      telegram: '@nikesupport',
      linkedin: 'company/nike',
      youtube: 'user/nike',
      facebook: 'nike',
    },
    aliases: ['Nike', 'Just Do It', 'Air Max', 'Air Jordan', 'SNKRS'],
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&auto=format&fit=crop&q=80',
    brandKeywords: ['Nike', 'Jordan', 'SNKRS', 'Nike Support'],
    knownDomains: ['nike.com', 'snkrs.com', 'nike.co.in'],
    officialDescription: 'World leader in athletic apparel, footwear, and sports equipment.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brand-paypal-social',
    brandName: 'PayPal',
    officialDomain: 'paypal.com',
    officialUrls: ['https://paypal.com', 'https://paypal.me'],
    officialSocialHandles: {
      twitter: '@PayPal',
      instagram: '@paypal',
      linkedin: 'company/paypal',
      facebook: 'PayPal',
    },
    aliases: ['PayPal', 'PayPal Mobile', 'PayPal Send Money'],
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
    brandKeywords: ['PayPal', 'PayPal Balance', 'PayPal Checkout', 'PayPal Support'],
    knownDomains: ['paypal.com', 'paypal.me'],
    officialDescription: 'Global leader in digital commerce and online payment solutions.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory fallbacks
let _memoryBrands: BrandIdentityProfile[] = [...DEFAULT_BRAND_MONITORS];
let _memoryCandidates: Record<string, SocialCandidateAnalysis> = {};
let _memoryScans: SocialScanRecord[] = [];

const STORAGE_KEY_BRANDS = 'safenet_social_monitored_brands';
const STORAGE_KEY_CANDIDATES = 'safenet_social_candidates';
const STORAGE_KEY_SCANS = 'safenet_social_scans';

export class SocialStore {
  // ---------------------------------------------------------------------------
  // Monitored Brands
  // ---------------------------------------------------------------------------
  static getBrands(): BrandIdentityProfile[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_BRANDS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[SocialStore] Error reading brands from localStorage:', err);
      }
    }
    return _memoryBrands;
  }

  static getBrandById(id: string): BrandIdentityProfile | null {
    const brands = this.getBrands();
    return brands.find((b) => b.id === id) || null;
  }

  static saveBrand(brand: BrandIdentityProfile): BrandIdentityProfile {
    const brands = this.getBrands();
    const existingIndex = brands.findIndex((b) => b.id === brand.id || b.brandName.toLowerCase() === brand.brandName.toLowerCase());

    const updated = {
      ...brand,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      brands[existingIndex] = updated;
    } else {
      brands.unshift(updated);
    }

    _memoryBrands = brands;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('[SocialStore] Error saving brand:', err);
      }
    }

    return updated;
  }

  static deleteBrand(id: string): boolean {
    const brands = this.getBrands().filter((b) => b.id !== id);
    _memoryBrands = brands;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('[SocialStore] Error deleting brand:', err);
      }
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Scans
  // ---------------------------------------------------------------------------
  static getScans(brandId?: string): SocialScanRecord[] {
    let scans = _memoryScans;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SCANS);
        if (stored) {
          scans = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[SocialStore] Error reading scans:', err);
      }
    }

    if (brandId) {
      return scans.filter((s) => s.brandId === brandId);
    }
    return scans;
  }

  static saveScan(scan: SocialScanRecord): SocialScanRecord {
    const scans = this.getScans();
    const existingIdx = scans.findIndex((s) => s.id === scan.id);
    if (existingIdx >= 0) {
      scans[existingIdx] = scan;
    } else {
      scans.unshift(scan);
    }

    _memoryScans = scans;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(scans));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('[SocialStore] Error saving scan:', err);
      }
    }
    return scan;
  }

  // ---------------------------------------------------------------------------
  // Candidates
  // ---------------------------------------------------------------------------
  static getCandidates(filter?: {
    brandId?: string;
    platform?: string;
    riskLevel?: string;
    status?: string;
  }): SocialCandidateAnalysis[] {
    let candidateMap = _memoryCandidates;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CANDIDATES);
        if (stored) {
          candidateMap = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[SocialStore] Error reading candidates:', err);
      }
    }

    let list: SocialCandidateAnalysis[] = Object.values(candidateMap);

    const brandFilter = filter?.brandId;
    const platformFilter = filter?.platform;
    const riskFilter = filter?.riskLevel;
    const statusFilter = filter?.status;

    if (brandFilter) {
      list = list.filter((c) => c.matchedBrand.id === brandFilter);
    }
    if (platformFilter && platformFilter !== 'ALL') {
      list = list.filter((c) => c.candidate.platform === platformFilter.toLowerCase());
    }
    if (riskFilter && riskFilter !== 'ALL') {
      list = list.filter((c) => c.risk.riskLevel === riskFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Sort by riskScore descending
    return list.sort((a, b) => b.risk.riskScore - a.risk.riskScore);
  }

  static getCandidateById(id: string): SocialCandidateAnalysis | null {
    const candidates = this.getCandidates();
    return candidates.find((c) => c.candidate.id === id) || null;
  }

  static saveCandidateAnalyses(analyses: SocialCandidateAnalysis[]): void {
    let candidateMap = { ..._memoryCandidates };
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CANDIDATES);
        if (stored) {
          candidateMap = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[SocialStore] Candidate map read error:', err);
      }
    }

    for (const item of analyses) {
      candidateMap[item.candidate.id] = item;
    }

    _memoryCandidates = candidateMap;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(candidateMap));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('[SocialStore] Error saving candidate analyses:', err);
      }
    }
  }

  static updateCandidateStatus(
    id: string,
    status: 'reviewed' | 'watchlist' | 'confirmed_threat' | 'new'
  ): boolean {
    const item = this.getCandidateById(id);
    if (!item) return false;

    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.saveCandidateAnalyses([item]);
    return true;
  }
}
