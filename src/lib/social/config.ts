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
    };
    linkedin: {
      enabled: boolean;
      hasAccessToken: boolean;
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
  const metaEnabledEnv = process.env.SOCIAL_PROVIDER_META_ENABLED?.trim();
  const metaEnabled = metaEnabledEnv === 'true' || (Boolean(metaToken) && metaEnabledEnv !== 'false');

  const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim() || '';
  const linkedinEnabledEnv = process.env.SOCIAL_PROVIDER_LINKEDIN_ENABLED?.trim();
  const linkedinEnabled = linkedinEnabledEnv === 'true' || (Boolean(linkedinToken) && linkedinEnabledEnv !== 'false');

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
        hasAccessToken: Boolean(metaToken) && metaToken !== '2266934170818569',
      },
      linkedin: {
        enabled: linkedinEnabled,
        hasAccessToken: Boolean(linkedinToken) && linkedinToken !== 'your_token',
      },
    },
  };
}

export function getProviderStatuses(): Record<SocialPlatform | 'demo', ProviderConfigStatus> {
  const config = getSocialMonitoringConfig();

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
      name: 'Instagram (Meta Graph API)',
      status: config.providers.meta.hasAccessToken ? 'connected' : 'unauthorized',
      enabled: config.providers.meta.enabled,
      message: config.providers.meta.hasAccessToken
        ? 'Connected to Meta Graph API'
        : 'Meta API unauthorized — requires Meta App review and permissions',
      requiresKeys: ['META_ACCESS_TOKEN'],
    },
    facebook: {
      platform: 'facebook',
      name: 'Facebook Pages (Meta Graph API)',
      status: config.providers.meta.hasAccessToken ? 'connected' : 'unauthorized',
      enabled: config.providers.meta.enabled,
      message: config.providers.meta.hasAccessToken
        ? 'Connected to Meta Graph API'
        : 'Meta API unauthorized — requires Meta App review and permissions',
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
