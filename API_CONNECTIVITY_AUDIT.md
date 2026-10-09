# SAFENET External Social-Monitoring API Connectivity Audit

**Date of Audit:** October 8, 2026  
**Auditor:** SAFENET Threat Engine & Architecture Inspector  
**Environment Target:** Local Development (`.env.local` + Next.js Server Runtime)  
**Security Notice:** In adherence with strict credential protection policies, **NO secret key values, bearer tokens, or query hashes are exposed or printed in this document**.

---

## 1. Executive Summary

| Provider | Environment Variable | Variable Detected | Backend Accessible | Provider Init | Live API Connectivity | HTTP Status | Verdict |
|---|---|:---:|:---:|:---:|---|:---:|---|
| **YouTube Data API v3** | `YOUTUBE_API_KEY` | **YES** | **YES** | **SUCCESS** | **LIVE CONNECTED** | `200 OK` | **OPERATIONAL** |
| **X (Twitter) API v2** | `X_BEARER_TOKEN` | **YES** | **YES** | **SUCCESS** | **FAILED (Credits Depleted)** | `402 Payment Required` | **TIER / BILLING ACTION REQUIRED** |
| **Meta Graph API** | `META_ACCESS_TOKEN` | **YES** | **YES** | **SUCCESS** | **FAILED (Invalid Token)** | `400 Bad Request` | **TOKEN RENEWAL REQUIRED** |
| **LinkedIn Community API** | `LINKEDIN_ACCESS_TOKEN` | **YES** | **YES** | **SUCCESS** | **FAILED (Unauthorized)** | `401 Unauthorized` | **TOKEN RENEWAL REQUIRED** |

---

## 2. Global Provider Flags & Configuration State

| Configuration Variable | Configured Value in `.env.local` | Effective Value in Backend | Description |
|---|---|---|---|
| `SOCIAL_MONITORING_ENABLED` | *(Not set)* | `true` (Default) | Master toggle for social network monitoring capability. |
| `SOCIAL_MONITORING_DEMO_MODE` | *(Not set)* | `true` (Default) | Serves marked synthetic benchmark candidates (`[DEMO DATA]`) alongside live providers. |
| `SOCIAL_PROVIDER_YOUTUBE_ENABLED` | *(Not set)* | `true` (Inferred) | YouTube ingestion active (inferred from valid `YOUTUBE_API_KEY`). |
| `SOCIAL_PROVIDER_X_ENABLED` | *(Not set)* | `true` (Inferred) | X ingestion active (inferred from present `X_BEARER_TOKEN`). |
| `SOCIAL_PROVIDER_META_ENABLED` | *(Not set)* | `true` (Inferred) | Meta ingestion active (inferred from present `META_ACCESS_TOKEN`). |
| `SOCIAL_PROVIDER_LINKEDIN_ENABLED` | *(Not set)* | `true` (Inferred) | LinkedIn ingestion active (inferred from present `LINKEDIN_ACCESS_TOKEN`). |

---

## 3. Detailed Provider-by-Provider Audit

### 3.1. YouTube Data API v3

- **Configuration Status:** Configured
- **Environment Variable:** `YOUTUBE_API_KEY`
- **Environment Variable Detected:** **YES** (Standard 39-character key format detected)
- **Backend Access:** **VERIFIED** — Next.js runtime correctly reads `process.env.YOUTUBE_API_KEY`.
- **Provider Initialization:** **SUCCESS** — `YouTubeProvider.isConfigured()` returns `true`.
- **Live Endpoint Tested:** `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=...`
- **Connectivity Result:** **SUCCESSFUL (200 OK)**
- **Response Details:**
  ```json
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=UTF-8
  Payload: Valid channel search results returned with snippet metadata
  ```
- **Operational Verdict:** **Fully functional and ready for live perimeter discovery.**

---

### 3.2. X (Twitter) API v2

- **Configuration Status:** Configured (Valid format token present)
- **Environment Variable:** `X_BEARER_TOKEN`
- **Environment Variable Detected:** **YES** (116-character OAuth 2.0 Bearer Token string detected)
- **Backend Access:** **VERIFIED** — Next.js runtime correctly reads `process.env.X_BEARER_TOKEN`.
- **Provider Initialization:** **SUCCESS** — `XProvider.isConfigured()` returns `true`.
- **Live Endpoint Tested:** `https://api.twitter.com/2/users/by?usernames=X`
- **Connectivity Result:** **FAILED (API Error)**
- **HTTP Status:** `402 Payment Required`
- **Exact API Error Response:**
  ```json
  {
    "title": "Payment Required",
    "detail": "credits depleted",
    "status": 402,
    "type": "https://api.x.com/2/problems/credits-depleted"
  }
  ```
- **Diagnosis:** The Bearer Token is syntactically valid and recognized by X API v2, but the associated X Developer account has exhausted its monthly request credits or requires an active subscription tier (e.g. Basic / Pro).
- **Required Action:** Top up credits or renew subscription in the [X Developer Portal](https://developer.x.com/). SAFENET's X adapter handles this gracefully by returning a `rate_limited` status without breaking other discovery sources.

---

### 3.3. Meta Graph API (Instagram & Facebook)

- **Configuration Status:** Configured (Short string detected)
- **Environment Variable:** `META_ACCESS_TOKEN`
- **Environment Variable Detected:** **YES** (16-character token detected)
- **Backend Access:** **VERIFIED** — Next.js runtime correctly reads `process.env.META_ACCESS_TOKEN`.
- **Provider Initialization:** **SUCCESS** — `MetaProvider.isConfigured()` returns `true`.
- **Live Endpoint Tested:** `https://graph.facebook.com/v19.0/me`
- **Connectivity Result:** **FAILED (OAuth Error)**
- **HTTP Status:** `400 Bad Request`
- **Exact API Error Response:**
  ```json
  {
    "error": {
      "message": "Invalid OAuth access token - Cannot parse access token",
      "type": "OAuthException",
      "code": 190,
      "fbtrace_id": "Az3AFEZpiyxNpuYxv7VwL02"
    }
  }
  ```
- **Diagnosis:** The configured token is 16 characters in length, whereas genuine Meta User/System User Access Tokens are typically 100+ characters (often starting with `EAAB...` or `EAA...`). Meta's OAuth server cannot parse the token.
- **Required Action:** Generate a valid System User or Long-Lived Page Access Token from the [Meta for Developers Portal](https://developers.facebook.com/) with `pages_read_engagement` and `instagram_basic` permissions and paste it into `.env.local`.

---

### 3.4. LinkedIn Community API

- **Configuration Status:** Configured (Short string detected)
- **Environment Variable:** `LINKEDIN_ACCESS_TOKEN`
- **Environment Variable Detected:** **YES** (10-character token detected)
- **Backend Access:** **VERIFIED** — Next.js runtime correctly reads `process.env.LINKEDIN_ACCESS_TOKEN`.
- **Provider Initialization:** **SUCCESS** — `LinkedInProvider.isConfigured()` returns `true`.
- **Live Endpoint Tested:** `https://api.linkedin.com/v2/userinfo`
- **Connectivity Result:** **FAILED (Authentication Error)**
- **HTTP Status:** `401 Unauthorized`
- **Exact API Error Response:**
  ```json
  {
    "status": 401,
    "serviceErrorCode": 65600,
    "code": "INVALID_ACCESS_TOKEN",
    "message": "Invalid access token"
  }
  ```
- **Diagnosis:** The configured token is 10 characters in length (likely a placeholder or key identifier), whereas genuine LinkedIn OAuth 2.0 access tokens are typically 300+ characters. LinkedIn rejects the request as unauthorized.
- **Required Action:** Generate an active OAuth 2.0 Access Token from the [LinkedIn Developer Portal](https://developer.linkedin.com/) with Community Management or Organization search scopes and paste into `.env.local`.

---

## 4. Architectural Resilience Verification

During the connectivity audit, we also verified the SAFENET system's runtime resilience when facing mixed provider health:

1. **Independent Fault Isolation:**
   When a discovery scan is triggered, failures in X (`402`), Meta (`400`), or LinkedIn (`401`) **do not crash the pipeline**. The discovery orchestrator catches each provider's error independently, records the status, and returns live candidates from YouTube (`200 OK`) and the demo sandbox (`DEMO DATA`).
2. **No Secret Leaks:**
   Neither the frontend UI, client bundles, nor API route payloads (`/api/social/providers`, `/api/social/brands/:id/scan`) expose or echo the secret key values.
3. **Demo Sandbox Availability:**
   Because `SOCIAL_MONITORING_DEMO_MODE=true` is enabled, developers and analysts can continue testing end-to-end impersonation detection, lookalike domain analysis, and watchlist triage even while external API tokens are being renewed.
