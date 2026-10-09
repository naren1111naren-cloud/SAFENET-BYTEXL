/**
 * SAFENET - Logo Check Orchestration Service
 * 
 * Pipeline:
 * 1. Image validation (magic bytes, 4MB cap, re-encoding / metadata stripping)
 * 2. SHA-256 hashing & 24h deterministic cache lookup
 * 3. Gemini Vision understanding (extracted text, brand estimate, visual description)
 * 4. SerpAPI Google Lens / Reverse search & text query queries
 * 5. Domain deduplication
 * 6. SSRF-safe thumbnail fetching (1MB cap, 5s timeout, max 3 redirects)
 * 7. Multi-vector visual similarity (dHash Hamming distance + 64-bin color histogram)
 * 8. Brand Baseline classification (Official vs Unknown vs Possible lookalike)
 */

import { BrandProfile } from '@/types/brand';
import { PRESET_BRANDS } from '@/lib/brand-store';
import {
  validateImageMagicBytes,
  analyzeImageHash,
  comparePerceptualSimilarity,
  fetchThumbnailSafe,
  LogoAnalysisCache,
  ImageHashResult,
  SimilarityComparison,
} from './image-utils';
import { analyzeLogoWithGeminiVision, GeminiVisionLogoResult } from './gemini-vision';
import { SerpApiGoogleLensProvider } from '@/lib/providers/logo/serpapi-lens-provider';
import { NormalizedLogoCandidate, LogoSearchResult } from '@/lib/providers/logo/types';
import { LegitimateAssetRegistry } from '@/lib/similarity/legitimate-registry';
import { evaluateLookalikeMatch } from '@/lib/similarity/lookalike-engine';

export type LogoCandidateClassification = 'OFFICIAL' | 'POSSIBLE_LOOKALIKE' | 'UNKNOWN';

export interface EvaluatedLogoCandidate {
  id: string;
  name: string;
  domain: string;
  sourceUrl: string;
  thumbnailUrl: string;
  title: string;
  snippet?: string;
  classification: LogoCandidateClassification;
  riskScore: number; // 0 - 100
  similarityScore: number; // 0 - 100
  similarityMetrics?: SimilarityComparison;
  officialLogoSimilarityScore?: number;
  signals: string[];
  reasons: string[];
  isAllowlisted: boolean;
  thumbnailFetchStatus: 'FETCHED' | 'FAILED' | 'SKIPPED';
}

export interface LogoAnalysisReport {
  status: 'SUCCESS' | 'VALIDATION_FAILED' | 'NOT_CONFIGURED' | 'ERROR';
  imageHash: string;
  imageFormat: string;
  imageSize: number;
  cached: boolean;
  brand: {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string;
  };
  geminiVision: GeminiVisionLogoResult;
  providerStatus: {
    provider: string;
    status: string;
    message?: string;
    matchesFound: number;
  };
  candidates: EvaluatedLogoCandidate[];
  summary: {
    totalCandidates: number;
    officialCount: number;
    lookalikeCount: number;
    unknownCount: number;
    highestRiskScore: number;
  };
  durationMs: number;
  analyzedAt: string;
}

export async function processLogoCheck(
  imageBuffer: Buffer,
  brandProfileInput?: BrandProfile,
  options: { bypassCache?: boolean } = {}
): Promise<LogoAnalysisReport> {
  const startTime = Date.now();
  const activeBrand: BrandProfile = brandProfileInput || PRESET_BRANDS['Paytm'];

  // 1. Validate Image Magic Bytes & Size
  const magicValidation = validateImageMagicBytes(imageBuffer);
  if (!magicValidation.valid) {
    return {
      status: 'VALIDATION_FAILED',
      imageHash: '',
      imageFormat: magicValidation.format,
      imageSize: imageBuffer ? imageBuffer.length : 0,
      cached: false,
      brand: { id: activeBrand.id, name: activeBrand.name, domain: activeBrand.domain },
      geminiVision: {
        status: 'NOT_CONFIGURED',
        extractedText: '',
        brandNameEstimate: '',
        visualDescription: '',
        detectedColors: [],
        explanation: magicValidation.error || 'Invalid file format',
      },
      providerStatus: {
        provider: 'validator',
        status: 'REJECTED',
        message: magicValidation.error,
        matchesFound: 0,
      },
      candidates: [],
      summary: { totalCandidates: 0, officialCount: 0, lookalikeCount: 0, unknownCount: 0, highestRiskScore: 0 },
      durationMs: Date.now() - startTime,
      analyzedAt: new Date().toISOString(),
    };
  }

  // 2. Compute Hashes & Check 24-Hour Cache
  const targetHash = analyzeImageHash(imageBuffer);

  if (!options.bypassCache) {
    const cached = LogoAnalysisCache.get<LogoAnalysisReport>(targetHash.sha256);
    if (cached) {
      return {
        ...cached,
        cached: true,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // 3. Gemini Vision Understanding (Extract Text & Details)
  const visionResult = await analyzeLogoWithGeminiVision(imageBuffer, magicValidation.mimeType);

  // 4. Reverse Image & Text Search via Provider
  const lensProvider = new SerpApiGoogleLensProvider();
  let searchResult: LogoSearchResult;

  if (lensProvider.isConfigured()) {
    searchResult = await lensProvider.searchByImage(imageBuffer, magicValidation.mimeType, {
      brandName: activeBrand.name,
    });
  } else {
    searchResult = {
      status: 'NOT_CONFIGURED',
      provider: lensProvider.id,
      candidates: [],
      message: 'SERPAPI_API_KEY is not configured in environment variables. Reverse image search omitted honestly.',
    };
  }

  // If vision extracted brand text and provider is configured, run supplementary query
  let combinedCandidates = [...searchResult.candidates];
  if (lensProvider.isConfigured() && visionResult.extractedText && lensProvider.searchByTextQuery) {
    try {
      const textQueryRes = await lensProvider.searchByTextQuery(visionResult.extractedText);
      if (textQueryRes.status === 'SUCCESS') {
        combinedCandidates.push(...textQueryRes.candidates);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // 5. Deduplicate Candidates by Domain
  const uniqueCandidatesMap = new Map<string, NormalizedLogoCandidate>();
  for (const cand of combinedCandidates) {
    const key = cand.domain.toLowerCase().trim();
    if (!key) continue;
    if (!uniqueCandidatesMap.has(key)) {
      uniqueCandidatesMap.set(key, cand);
    }
  }
  const deduplicatedList = Array.from(uniqueCandidatesMap.values());

  // 6. Pre-calculate Official Logo Hash if available
  let officialLogoHash: ImageHashResult | null = null;
  if (activeBrand.logoUrl) {
    try {
      const offFetch = await fetchThumbnailSafe(activeBrand.logoUrl, { maxBytes: 1024 * 1024, timeoutMs: 3000 });
      if (offFetch.ok && offFetch.buffer) {
        officialLogoHash = analyzeImageHash(offFetch.buffer);
      }
    } catch {
      // Official logo fetch failed
    }
  }

  // 7. Process & Score Each Candidate
  const evaluatedCandidates: EvaluatedLogoCandidate[] = [];

  for (let i = 0; i < deduplicatedList.length; i++) {
    const cand = deduplicatedList[i];
    const candidateId = `logo_cand_${i + 1}_${cand.domain.replace(/[^a-z0-9]/gi, '_')}`;

    // A. Check Brand Baseline Allowlist
    const allowlistCheck = LegitimateAssetRegistry.evaluateCandidateLegitimacy(
      { domain: cand.domain, url: cand.sourceUrl, name: cand.name },
      activeBrand
    );

    // B. Download Thumbnail Safely (SSRF-Guarded)
    let similarityVsUpload: SimilarityComparison | undefined;
    let officialLogoSimScore: number | undefined;
    let fetchStatus: 'FETCHED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';

    if (cand.thumbnailUrl) {
      const thumbFetch = await fetchThumbnailSafe(cand.thumbnailUrl, {
        maxBytes: 1024 * 1024,
        timeoutMs: 5000,
        maxRedirects: 3,
      });

      if (thumbFetch.ok && thumbFetch.buffer) {
        fetchStatus = 'FETCHED';
        const candHash = analyzeImageHash(thumbFetch.buffer);
        similarityVsUpload = comparePerceptualSimilarity(targetHash, candHash);

        if (officialLogoHash) {
          const offComp = comparePerceptualSimilarity(officialLogoHash, candHash);
          officialLogoSimScore = offComp.score0to100;
        }
      } else {
        fetchStatus = 'FAILED';
      }
    }

    // C. Evaluate Text/Domain Similarity
    const domainEval = evaluateLookalikeMatch(activeBrand.name, cand.domain);

    // D. Classification & Risk Scoring
    let classification: LogoCandidateClassification = 'UNKNOWN';
    let riskScore = 15;
    const signals: string[] = [];
    const reasons: string[] = [];

    if (allowlistCheck.isAllowlisted) {
      classification = 'OFFICIAL';
      riskScore = 0;
      signals.push('OFFICIAL_DOMAIN_ALLOWLIST');
      reasons.push(allowlistCheck.reason);
    } else {
      const visualScore = similarityVsUpload ? similarityVsUpload.score0to100 : 0;
      
      if (domainEval.isLookalike) {
        signals.push(`LOOKALIKE_DOMAIN_${domainEval.variationType.toUpperCase()}`);
        reasons.push(`Domain "${cand.domain}" exhibits ${domainEval.variationType.replace(/_/g, ' ')} mimicry.`);
      }

      if (visualScore >= 75) {
        signals.push('HIGH_VISUAL_SIMILARITY');
        reasons.push(`Visual artwork exhibits ${visualScore}% perceptual and color alignment with upload.`);
      } else if (visualScore >= 50) {
        signals.push('MODERATE_VISUAL_SIMILARITY');
        reasons.push(`Visual artwork matches ${visualScore}% of logo color and structure.`);
      }

      // Synthesize Risk Score
      if (domainEval.isLookalike && visualScore >= 60) {
        classification = 'POSSIBLE_LOOKALIKE';
        riskScore = Math.min(95, 60 + Math.round(visualScore * 0.35));
        reasons.push('Co-occurrence of suspicious domain syntax and high logo visual alignment.');
      } else if (domainEval.isLookalike) {
        classification = 'POSSIBLE_LOOKALIKE';
        riskScore = Math.min(85, 50 + domainEval.similarityScore0to20 * 2);
      } else if (visualScore >= 80) {
        classification = 'POSSIBLE_LOOKALIKE';
        riskScore = 70;
        reasons.push('Unrecognized third-party host utilizing near-identical brand logo artwork.');
      } else {
        classification = 'UNKNOWN';
        riskScore = Math.max(10, Math.min(45, Math.round(visualScore * 0.4)));
        reasons.push('Third-party website indexing matched artwork with low-to-moderate correlation.');
      }
    }

    evaluatedCandidates.push({
      id: candidateId,
      name: cand.name,
      domain: cand.domain,
      sourceUrl: cand.sourceUrl,
      thumbnailUrl: cand.thumbnailUrl,
      title: cand.title,
      snippet: cand.snippet,
      classification,
      riskScore,
      similarityScore: similarityVsUpload ? similarityVsUpload.score0to100 : 0,
      similarityMetrics: similarityVsUpload,
      officialLogoSimilarityScore: officialLogoSimScore,
      signals,
      reasons,
      isAllowlisted: allowlistCheck.isAllowlisted,
      thumbnailFetchStatus: fetchStatus,
    });
  }

  // Sort candidates: Highest Risk & Similarity first
  evaluatedCandidates.sort((a, b) => b.riskScore - a.riskScore || b.similarityScore - a.similarityScore);

  const officialCount = evaluatedCandidates.filter((c) => c.classification === 'OFFICIAL').length;
  const lookalikeCount = evaluatedCandidates.filter((c) => c.classification === 'POSSIBLE_LOOKALIKE').length;
  const unknownCount = evaluatedCandidates.filter((c) => c.classification === 'UNKNOWN').length;
  const highestRiskScore = evaluatedCandidates.length > 0 ? evaluatedCandidates[0].riskScore : 0;

  const report: LogoAnalysisReport = {
    status: searchResult.status === 'ERROR' ? 'ERROR' : 'SUCCESS',
    imageHash: targetHash.sha256,
    imageFormat: magicValidation.format,
    imageSize: imageBuffer.length,
    cached: false,
    brand: {
      id: activeBrand.id,
      name: activeBrand.name,
      domain: activeBrand.domain,
      logoUrl: activeBrand.logoUrl,
    },
    geminiVision: visionResult,
    providerStatus: {
      provider: searchResult.provider,
      status: searchResult.status,
      message: searchResult.message || searchResult.error,
      matchesFound: searchResult.rawMatchesCount || 0,
    },
    candidates: evaluatedCandidates,
    summary: {
      totalCandidates: evaluatedCandidates.length,
      officialCount,
      lookalikeCount,
      unknownCount,
      highestRiskScore,
    },
    durationMs: Date.now() - startTime,
    analyzedAt: new Date().toISOString(),
  };

  // Cache report for 24 hours
  LogoAnalysisCache.set(targetHash.sha256, report);

  return report;
}
