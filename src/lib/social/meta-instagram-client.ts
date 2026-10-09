/**
 * SAFENET Meta & Instagram Graph API Client
 * 
 * Provides server-side readiness verification, token inspection, and authorized
 * Instagram Business Discovery integration adhering to Meta's supported endpoints.
 * 
 * STRICT SECURITY PRINCIPLE:
 * Never exposes access tokens or secrets in return objects, logs, or API responses.
 * Never claims API connectivity until a live Graph API request succeeds.
 */

export type MetaCredentialStatusType =
  | 'not_configured'
  | 'config_id_only'
  | 'placeholder_credential'
  | 'unauthorized'
  | 'expired_token'
  | 'insufficient_permissions'
  | 'rate_limited'
  | 'connected'
  | 'error';

export interface MetaCredentialReadiness {
  status: MetaCredentialStatusType;
  isConnected: boolean;
  hasAccessToken: boolean;
  hasConfigId: boolean;
  hasAppCredentials?: boolean;
  appVerified?: boolean;
  maskedAppId?: string;
  maskedConfigId?: string;
  callerInstagramAccountId?: string;
  grantedPermissions?: string[];
  missingPermissions?: string[];
  capabilities: {
    businessDiscovery: boolean;
    pageInspection: boolean;
    searchFallbackAvailable: boolean;
  };
  message: string;
  setupGuidance?: string;
  testedAt: string;
}

export interface InstagramBusinessProfileData {
  id?: string;
  username: string;
  name?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  website?: string;
  isBusinessAccount: boolean;
  discoveredVia: 'meta_business_discovery' | 'search_fallback' | 'official_registry';
  rawMetadata?: Record<string, any>;
}

export interface BusinessDiscoveryQueryResult {
  success: boolean;
  profile?: InstagramBusinessProfileData;
  isPersonalOrPrivate?: boolean;
  notFound?: boolean;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
}

export class MetaInstagramClient {
  private apiVersion = 'v19.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  /**
   * Reads credentials from environment variables.
   */
  private getEnvCredentials() {
    const rawAccessToken = process.env.META_ACCESS_TOKEN?.trim() || '';
    const rawConfigId = process.env.META_CONFIG_ID?.trim() || '';
    const rawAppId = process.env.META_APP_ID?.trim() || '';
    const rawAppSecret = process.env.META_APP_SECRET?.trim() || '';
    const rawCallerIgId = (
      process.env.META_INSTAGRAM_ACCOUNT_ID?.trim() ||
      process.env.META_IG_USER_ID?.trim() ||
      ''
    );

    // Detect if META_ACCESS_TOKEN was erroneously set to a numeric Configuration ID or placeholder
    const isTokenActuallyNumericConfigId = /^\d{10,24}$/.test(rawAccessToken);
    const isTokenPlaceholder = /^(YOUR_|your_|placeholder|undefined|null)/i.test(rawAccessToken) || rawAccessToken.length < 15;

    let accessToken: string | null = null;
    let configId: string | null = rawConfigId || null;

    if (isTokenActuallyNumericConfigId) {
      if (!configId) configId = rawAccessToken;
      accessToken = null;
    } else if (!isTokenPlaceholder && rawAccessToken) {
      accessToken = rawAccessToken;
    }

    return {
      accessToken,
      configId,
      appId: rawAppId && !rawAppId.startsWith('YOUR_') ? rawAppId : null,
      appSecret: rawAppSecret && !rawAppSecret.startsWith('YOUR_') ? rawAppSecret : null,
      callerIgAccountId: rawCallerIgId || null,
      rawAccessTokenSet: Boolean(rawAccessToken),
      isTokenActuallyNumericConfigId,
      isTokenPlaceholder,
    };
  }

  /**
   * Masks sensitive identifier for safe display (e.g. "2266934170818569" -> "...8569").
   */
  private maskIdentifier(id: string): string {
    if (!id || id.length <= 4) return '****';
    return `...${id.slice(-4)}`;
  }

  /**
   * Evaluates credential readiness without exposing tokens.
   */
  async checkCredentialReadiness(): Promise<MetaCredentialReadiness> {
    const creds = this.getEnvCredentials();
    const testedAt = new Date().toISOString();

    // Check search fallback availability
    const hasSearchFallback = Boolean(
      process.env.SERPER_API_KEY?.trim() ||
      process.env.TAVILY_API_KEY?.trim() ||
      process.env.SERPAPI_KEY?.trim() ||
      process.env.BRAVE_API_KEY?.trim() ||
      process.env.SEARCH_PROVIDER_API_KEY?.trim()
    );

    const hasAppCreds = Boolean(creds.appId && creds.appSecret);
    let appVerified = false;

    // If App ID & Secret are present, test verification with Meta Graph API
    if (hasAppCreds) {
      try {
        const appCheckUrl = `${this.baseUrl}/${encodeURIComponent(creds.appId!)}?fields=id,name&access_token=${encodeURIComponent(`${creds.appId}|${creds.appSecret}`)}`;
        const appRes = await fetch(appCheckUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (appRes.ok) {
          appVerified = true;
        }
      } catch {
        // App check offline/network timeout
      }
    }

    // Case 1: App Credentials and/or Configuration ID configured, but no User Access Token
    if (!creds.accessToken && (hasAppCreds || creds.configId || creds.isTokenActuallyNumericConfigId)) {
      const activeConfigId = creds.configId || (creds.isTokenActuallyNumericConfigId ? process.env.META_ACCESS_TOKEN?.trim() : '');
      return {
        status: 'config_id_only',
        isConnected: false,
        hasAccessToken: false,
        hasConfigId: Boolean(activeConfigId),
        hasAppCredentials: hasAppCreds,
        appVerified,
        maskedAppId: creds.appId ? this.maskIdentifier(creds.appId) : undefined,
        maskedConfigId: activeConfigId ? this.maskIdentifier(activeConfigId) : undefined,
        capabilities: {
          businessDiscovery: false,
          pageInspection: false,
          searchFallbackAvailable: hasSearchFallback,
        },
        message: appVerified
          ? `Meta App verified (${this.maskIdentifier(creds.appId!)}). To query Instagram Business Discovery, generate a User or Page Access Token with instagram_basic & instagram_manage_insights permissions.`
          : (activeConfigId
              ? 'Meta Configuration ID is present, but no Meta User or Page Access Token is configured.'
              : 'Meta App ID & Secret configured. A User or Page Access Token is required for Instagram Business Discovery.'),
        setupGuidance: 'A Meta Configuration ID defines Facebook Login for Business assets and permissions for OAuth authentication. To query Instagram Graph API endpoints, complete the Meta Login flow or generate a System User / Page Access Token with instagram_basic and instagram_manage_insights permissions.',
        testedAt,
      };
    }

    // Case 2: Placeholder or invalid token
    if (creds.isTokenPlaceholder && creds.rawAccessTokenSet) {
      return {
        status: 'placeholder_credential',
        isConnected: false,
        hasAccessToken: false,
        hasConfigId: Boolean(creds.configId),
        hasAppCredentials: hasAppCreds,
        appVerified,
        maskedAppId: creds.appId ? this.maskIdentifier(creds.appId) : undefined,
        maskedConfigId: creds.configId ? this.maskIdentifier(creds.configId) : undefined,
        capabilities: {
          businessDiscovery: false,
          pageInspection: false,
          searchFallbackAvailable: hasSearchFallback,
        },
        message: 'META_ACCESS_TOKEN contains a placeholder template value. A real Meta User or Page Access Token is required.',
        setupGuidance: 'Generate a real token in the Meta App Dashboard Graph API Explorer or Meta Business Manager.',
        testedAt,
      };
    }

    // Case 3: Completely not configured
    if (!creds.accessToken) {
      return {
        status: 'not_configured',
        isConnected: false,
        hasAccessToken: false,
        hasConfigId: false,
        hasAppCredentials: false,
        appVerified: false,
        capabilities: {
          businessDiscovery: false,
          pageInspection: false,
          searchFallbackAvailable: hasSearchFallback,
        },
        message: 'Meta Graph API access token is not configured. Set META_ACCESS_TOKEN in .env.local to enable authorized Instagram Business Discovery.',
        setupGuidance: 'Create a Meta App, connect an Instagram Professional account to a Facebook Page, and configure META_ACCESS_TOKEN.',
        testedAt,
      };
    }

    // Case 4: Access token exists — execute real connectivity probe against Meta Graph API
    try {
      const probeUrl = `${this.baseUrl}/me?fields=id,name,accounts{id,name,instagram_business_account{id,username}}&access_token=${encodeURIComponent(creds.accessToken)}`;
      const res = await fetch(probeUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errObj = data.error || {};
        const code = errObj.code;
        const subcode = errObj.error_subcode;
        const errMsg = errObj.message || `HTTP ${res.status}`;

        // OAuth Token Expired or Invalid (Code 190)
        if (code === 190) {
          const isExpired = subcode === 463 || subcode === 467 || /expired/i.test(errMsg);
          return {
            status: isExpired ? 'expired_token' : 'unauthorized',
            isConnected: false,
            hasAccessToken: true,
            hasConfigId: Boolean(creds.configId),
            maskedConfigId: creds.configId ? this.maskIdentifier(creds.configId) : undefined,
            capabilities: {
              businessDiscovery: false,
              pageInspection: false,
              searchFallbackAvailable: hasSearchFallback,
            },
            message: isExpired
              ? 'Meta Access Token has expired. Refresh your User or Page Access Token.'
              : `Meta API authorization error (Code 190): ${errMsg}`,
            setupGuidance: 'Generate a new Long-Lived User Access Token (valid for 60 days) or a System User Token (never expires) in Meta Business Manager.',
            testedAt,
          };
        }

        // Rate Limited (Code 4, 17, 32, 613)
        if ([4, 17, 32, 613].includes(code)) {
          return {
            status: 'rate_limited',
            isConnected: false,
            hasAccessToken: true,
            hasConfigId: Boolean(creds.configId),
            capabilities: {
              businessDiscovery: false,
              pageInspection: false,
              searchFallbackAvailable: hasSearchFallback,
            },
            message: 'Meta Graph API call limit reached or user rate limited.',
            testedAt,
          };
        }

        // Insufficient Permissions (Code 200, 10)
        if (code === 200 || code === 10) {
          return {
            status: 'insufficient_permissions',
            isConnected: false,
            hasAccessToken: true,
            hasConfigId: Boolean(creds.configId),
            capabilities: {
              businessDiscovery: false,
              pageInspection: false,
              searchFallbackAvailable: hasSearchFallback,
            },
            message: `Meta API token lacks required permissions: ${errMsg}`,
            setupGuidance: 'Ensure your Meta App and Access Token have instagram_basic, instagram_manage_insights, and pages_show_list permissions.',
            testedAt,
          };
        }

        return {
          status: 'error',
          isConnected: false,
          hasAccessToken: true,
          hasConfigId: Boolean(creds.configId),
          capabilities: {
            businessDiscovery: false,
            pageInspection: false,
            searchFallbackAvailable: hasSearchFallback,
          },
          message: `Meta API connectivity check returned error (Code ${code}): ${errMsg}`,
          testedAt,
        };
      }

      // Success! Extract discovered Instagram Business Account ID if available
      let discoveredCallerIgId = creds.callerIgAccountId;
      if (!discoveredCallerIgId && Array.isArray(data.accounts?.data)) {
        for (const acc of data.accounts.data) {
          if (acc.instagram_business_account?.id) {
            discoveredCallerIgId = acc.instagram_business_account.id;
            break;
          }
        }
      }

      return {
        status: 'connected',
        isConnected: true,
        hasAccessToken: true,
        hasConfigId: Boolean(creds.configId),
        maskedConfigId: creds.configId ? this.maskIdentifier(creds.configId) : undefined,
        callerInstagramAccountId: discoveredCallerIgId ? this.maskIdentifier(discoveredCallerIgId) : undefined,
        capabilities: {
          businessDiscovery: Boolean(discoveredCallerIgId),
          pageInspection: true,
          searchFallbackAvailable: hasSearchFallback,
        },
        message: discoveredCallerIgId
          ? 'Connected to Meta Graph API with authorized Instagram Business Discovery capabilities.'
          : 'Connected to Meta Graph API (Facebook Page mode). Connect an Instagram Business Account to enable Business Discovery.',
        testedAt,
      };
    } catch (err: any) {
      return {
        status: 'error',
        isConnected: false,
        hasAccessToken: true,
        hasConfigId: Boolean(creds.configId),
        capabilities: {
          businessDiscovery: false,
          pageInspection: false,
          searchFallbackAvailable: hasSearchFallback,
        },
        message: `Network failure connecting to Meta Graph API: ${err?.message || err}`,
        testedAt,
      };
    }
  }

  /**
   * Queries Meta Instagram Business Discovery API for a specific target username.
   * 
   * Endpoint format:
   * GET /{caller_ig_user_id}?fields=business_discovery.username({target_username}){id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website}&access_token={token}
   */
  async queryBusinessDiscovery(
    targetUsername: string,
    options?: { callerIgAccountId?: string; accessToken?: string }
  ): Promise<BusinessDiscoveryQueryResult> {
    const creds = this.getEnvCredentials();
    const token = options?.accessToken || creds.accessToken;
    const cleanTarget = (targetUsername || '').replace(/^@/, '').trim().toLowerCase();

    if (!cleanTarget) {
      return { success: false, error: 'Target Instagram username is required.' };
    }

    if (!token) {
      return {
        success: false,
        error: 'Meta access token is not configured.',
      };
    }

    let callerId = options?.callerIgAccountId || creds.callerIgAccountId;

    // If caller IG ID is not known, discover it dynamically via /me/accounts
    if (!callerId) {
      try {
        const accRes = await fetch(`${this.baseUrl}/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          if (Array.isArray(accData.data)) {
            for (const page of accData.data) {
              if (page.instagram_business_account?.id) {
                callerId = page.instagram_business_account.id;
                break;
              }
            }
          }
        }
      } catch {
        // Fallback to me
      }
    }

    if (!callerId) {
      return {
        success: false,
        error: 'No connected Instagram Business/Creator Account found to execute Business Discovery. Set META_INSTAGRAM_ACCOUNT_ID.',
      };
    }

    try {
      const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website';
      const endpoint = `${this.baseUrl}/${encodeURIComponent(callerId)}?fields=business_discovery.username(${encodeURIComponent(cleanTarget)}){${fields}}&access_token=${encodeURIComponent(token)}`;

      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errObj = data.error || {};
        const code = errObj.code;
        const subcode = errObj.error_subcode;
        const msg = errObj.message || `HTTP ${res.status}`;

        // Case: Personal account or profile not found
        // Meta Graph API returns Error 100 with message "Tried accessing nonexisting field (business_discovery) on node type (User)"
        // or "Object with ID does not exist" when target is not a public business/creator account
        if (code === 100 || (msg && /business_discovery|does not exist/i.test(msg))) {
          return {
            success: false,
            isPersonalOrPrivate: true,
            notFound: /does not exist/i.test(msg),
            error: `Target "@${cleanTarget}" is either a personal/private account or does not exist. Meta Business Discovery API supports public Business and Creator accounts only.`,
            errorCode: code,
            errorSubcode: subcode,
          };
        }

        return {
          success: false,
          error: `Meta Graph API error (Code ${code}): ${msg}`,
          errorCode: code,
          errorSubcode: subcode,
        };
      }

      const disc = data.business_discovery;
      if (!disc || !disc.username) {
        return {
          success: false,
          notFound: true,
          error: `No business profile data returned for "@${cleanTarget}".`,
        };
      }

      const profile: InstagramBusinessProfileData = {
        id: disc.id,
        username: disc.username,
        name: disc.name || disc.username,
        biography: disc.biography || '',
        profilePictureUrl: disc.profile_picture_url,
        followersCount: typeof disc.followers_count === 'number' ? disc.followers_count : undefined,
        followsCount: typeof disc.follows_count === 'number' ? disc.follows_count : undefined,
        mediaCount: typeof disc.media_count === 'number' ? disc.media_count : undefined,
        website: disc.website || undefined,
        isBusinessAccount: true,
        discoveredVia: 'meta_business_discovery',
        rawMetadata: {
          metaId: disc.id,
          mediaCount: disc.media_count,
        },
      };

      return {
        success: true,
        profile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Business Discovery request failed: ${err?.message || err}`,
      };
    }
  }
}

export const globalMetaInstagramClient = new MetaInstagramClient();
