/**
 * SAFENET - Logo Search Provider Interfaces
 */

export interface NormalizedLogoCandidate {
  name: string;
  domain: string;
  sourceUrl: string;
  thumbnailUrl: string;
  title: string;
  snippet?: string;
  sourceType: 'reverse_image_lens' | 'text_search_fallback' | 'synthetic';
}

export type LogoSearchProviderStatus = 'SUCCESS' | 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'ERROR';

export interface LogoSearchResult {
  status: LogoSearchProviderStatus;
  provider: string;
  candidates: NormalizedLogoCandidate[];
  rawMatchesCount?: number;
  message?: string;
  error?: string;
}

export interface LogoSearchProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  searchByImage(imageBuffer: Buffer, mimeType: string, options?: { brandName?: string }): Promise<LogoSearchResult>;
  searchByTextQuery?(query: string): Promise<LogoSearchResult>;
}
