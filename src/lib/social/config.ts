/**
 * SAFENET Social Media Monitoring - Configuration & Provider Status
 * Centralizes environment variable inspection and provider capabilities.
 * Strictly never logs or leaks secret credentials to the client.
 */

import { ProviderConfigStatus, SocialPlatform } from './types';

export interface SocialMonitoringConfig {
  enabled: boolean;
  demoMode: boolean;
  providers: {
    youtube: {
      enabled: boolean;
      hasApiKey: boolean;
    };
    twitter: {
      enabled: boolean;
      hasBearerToken: boolean;
    };
    meta: {
      enabled: boolean;
      hasAccessToken: boolean;
      hasConfigId: boolean;
      isConfigIdOnly: boolean;
    };
    linkedin: {
      enabled: boolean;
      hasAccessToken: boolean;
    };
    searchFallback: {
      enabled: boolean;
      provider: 'serper' | 'tavily' | 'serpapi' | 'brave' | 'custom' | null;
      hasKey: boolean;
    };
  };
}

export function getSocialMonitoringConfig(): SocialMonitoringConfig {
  const isEnabled = process.env.SOCIAL_MONITORING_ENABLED !== 'false';
  
  const youtubeKey = process.env.YOUTUBE_API_KEY?.trim() || '';
  const youtubeEnabledEnv = process.env.SOCIAL_PROVIDER_YOUTUBE_ENABLED?.trim();
  const youtubeEnabled = youtubeEnabledEnv === 'true' || (Boolean(youtubeKey) && youtubeEnabledEnv !== 'false');

  const xToken = process.env.X_BEARER_TOKEN?.trim() || '';
  const xEnabledEnv = process.env.SOCIAL_PROVIDER_X_ENABLED?.trim();
  const xEnabled = xEnabledEnv === 'true' || (Boolean(xToken) && xEnabledEnv !== 'false');

  const metaToken = process.env.META_ACCESS_TOKEN?.trim() || '';
  const metaConfigId = process.env.META_CONFIG_ID?.trim() || '';
  const metaEnabledEnv = process.env.SOCIAL_PROVIDER_META_ENABLED?.trim();
  const metaEnabled = metaEnabledEnv === 'true' || (Boolean(metaToken || metaConfigId) && metaEnabledEnv !== 'false');

  const isNumericConfigId = /^\d{10,24}$/.test(metaToken);
  const isPlaceholder = /^(YOUR_|placeholder|undefined|null)/i.test(metaToken) || metaToken.length < 15;
  const isConfigIdOnly = isNumericConfigId || (Boolean(metaConfigId) && (!metaToken || isPlaceholder));
  const hasValidMetaToken = Boolean(metaToken) && !isNumericConfigId && !isPlaceholder;

  const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim() || '';
  const linkedinEnabledEnv = process.env.SOCIAL_PROVIDER_LINKEDIN_ENABLED?.trim();
  const linkedinEnabled = linkedinEnabledEnv === 'true' || (Boolean(linkedinToken) && linkedinEnabledEnv !== 'false');

  // Search providers for candidate discovery fallback
  const serper = process.env.SERPER_API_KEY?.trim();
  const tavily = process.env.TAVILY_API_KEY?.trim();
  const serpapi = process.env.SERPAPI_KEY?.trim();
  const brave = process.env.BRAVE_API_KEY?.trim();
  const custom = process.env.SEARCH_PROVIDER_API_KEY?.trim();

  let searchProv: 'serper' | 'tavily' | 'serpapi' | 'brave' | 'custom' | null = null;
  if (serper) searchProv = 'serper';
  else if (tavily) searchProv = 'tavily';
  else if (serpapi) searchProv = 'serpapi';
  else if (brave) searchProv = 'brave';
  else if (custom) searchProv = 'custom';

  // Demo mode is ONLY active when explicitly set to 'true' in environment
  const demoModeEnv = process.env.SOCIAL_MONITORING_DEMO_MODE?.trim();
  const demoMode = demoModeEnv === 'true';

  return {
    enabled: isEnabled,
    demoMode,
    providers: {
      youtube: {
        enabled: youtubeEnabled,
        hasApiKey: Boolean(youtubeKey),
      },
      twitter: {
        enabled: xEnabled,
        hasBearerToken: Boolean(xToken),
      },
      meta: {
        enabled: metaEnabled,
        hasAccessToken: hasValidMetaToken,
        hasConfigId: Boolean(metaConfigId || isNumericConfigId),
        isConfigIdOnly,
      },
      linkedin: {
        enabled: linkedinEnabled,
        hasAccessToken: Boolean(linkedinToken) && linkedinToken !== 'your_token',
      },
      searchFallback: {
        enabled: Boolean(searchProv),
        provider: searchProv,
        hasKey: Boolean(searchProv),
      },
    },
  };
}

export function getProviderStatuses(): Record<SocialPlatform | 'demo', ProviderConfigStatus> {
  const config = getSocialMonitoringConfig();

  // Determine Instagram status
  let igStatus: ProviderConfigStatus['status'] = 'not_configured';
  let igMessage = 'Instagram discovery requires META_ACCESS_TOKEN or a Search Provider (SERPER_API_KEY / TAVILY_API_KEY).';

  if (config.providers.meta.hasAccessToken) {
    igStatus = 'connected';
    igMessage = 'Connected to Meta Graph API for Instagram Business Discovery.';
  } else if (config.providers.meta.isConfigIdOnly) {
    igStatus = 'unauthorized';
    igMessage = 'Meta Configuration ID is present. Complete Meta Login or configure META_ACCESS_TOKEN for direct Graph API access.';
  } else if (config.providers.searchFallback.hasKey) {
    igStatus = 'connected';
    igMessage = `Active via Public Search Fallback (${config.providers.searchFallback.provider?.toUpperCase()}). Meta API not connected.`;
  }

  return {
    youtube: {
      platform: 'youtube',
      name: 'YouTube Data API v3',
      status: config.providers.youtube.hasApiKey ? 'connected' : 'not_configured',
      enabled: config.providers.youtube.enabled,
      message: config.providers.youtube.hasApiKey
        ? 'Connected to YouTube Data API v3'
        : 'YouTube API key is not configured. Set YOUTUBE_API_KEY in .env.local.',
      requiresKeys: ['YOUTUBE_API_KEY'],
    },
    twitter: {
      platform: 'twitter',
      name: 'X (Twitter) API v2',
      status: config.providers.twitter.enabled && config.providers.twitter.hasBearerToken
        ? 'connected'
        : 'restricted',
      enabled: config.providers.twitter.enabled,
      message: config.providers.twitter.enabled && config.providers.twitter.hasBearerToken
        ? 'Connected to X API v2'
        : 'X credits unavailable / provider disabled',
      requiresKeys: ['X_BEARER_TOKEN'],
    },
    instagram: {
      platform: 'instagram',
      name: 'Instagram (Meta Graph API & Search Fallback)',
      status: igStatus,
      enabled: config.providers.meta.enabled || config.providers.searchFallback.enabled,
      message: igMessage,
      requiresKeys: ['META_ACCESS_TOKEN', 'META_CONFIG_ID (optional)'],
    },
    facebook: {
      platform: 'facebook',
      name: 'Facebook Pages (Meta Graph API)',
      status: config.providers.meta.hasAccessToken ? 'connected' : 'unauthorized',
      enabled: config.providers.meta.enabled,
      message: config.providers.meta.hasAccessToken
        ? 'Connected to Meta Graph API'
        : 'Meta API unauthorized — requires Meta App review and Page permissions',
      requiresKeys: ['META_ACCESS_TOKEN'],
    },
    linkedin: {
      platform: 'linkedin',
      name: 'LinkedIn Community API',
      status: config.providers.linkedin.hasAccessToken ? 'connected' : 'unauthorized',
      enabled: config.providers.linkedin.enabled,
      message: config.providers.linkedin.hasAccessToken
        ? 'Connected to LinkedIn Community API'
        : 'LinkedIn access not available — requires partner credentials',
      requiresKeys: ['LINKEDIN_ACCESS_TOKEN'],
    },
    demo: {
      platform: 'twitter', // placeholder platform
      name: 'SAFENET Local Synthetic Demo Generator',
      status: config.demoMode ? 'connected' : 'not_configured',
      enabled: config.demoMode,
      message: config.demoMode
        ? 'Active for local development and UI simulation. Discovered candidates are strictly marked as DEMO DATA.'
        : 'Disabled in production mode.',
      requiresKeys: ['SOCIAL_MONITORING_DEMO_MODE=true'],
    },
  };
}
