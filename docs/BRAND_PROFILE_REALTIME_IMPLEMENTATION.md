# SAFENET Feature 1: Real-Time Brand Profile Intelligence Implementation Report
**Document Version:** 1.0.0  
**Date:** 2026-10-08  
**Scope:** Brand Profile Ground Truth Pipeline, Server-Side Website Intelligence, SSRF Protections, and Analyst Confirmation Workflow.

---

## 1. Architecture Overview

SAFENET's Digital Risk Protection (DRP) platform requires an authoritative **Ground Truth Identity** for every protected brand. Rather than relying on manual form entry or simulated configurations, **Feature 1: Real-Time Brand Profile Intelligence** introduces a live intelligence pipeline:

```
[User Input: Brand Name & URL]
             │
             ▼
[SSRF & URL Normalization Layer] ──(Rejects Private IPs, Loopbacks, Metadata, Malformed URLs)
             │
             ▼
[Controlled HTTP & TLS Inspector] ──(Follows Safe Redirects, Enforces Byte Caps, Captures Security Headers)
             │
             ▼
[Website Identity Analyzer]
   ├── JSON-LD Organization Parser (name, legalName, logo, sameAs, alternateName)
   ├── OpenGraph & Meta Parser (og:image, og:title, og:site_name, meta description)
   ├── Social Profile Harvester (X/Twitter, Instagram, LinkedIn, FB, YouTube, Telegram, TikTok, GitHub)
   ├── Mobile Application Harvester (Google Play Store & Apple App Store deep links)
   ├── Domain Authority Classifier (Canonical domain, registrable domain, service domain filter)
   └── Clean Alias Generator (Deterministic corporate suffix stripping)
             │
             ▼
[Structured Evidence & Provenance Model]
             │
             ▼
[Interactive Discovered Identity Review (UI)]
             │
             ▼
[Analyst Confirmation & Storage] ──(Persisted as Authoritative Ground Truth Baseline)
```

---

## 2. Data Flow

1. **Input Submission:** An investigator enters `Brand Name` (e.g. `Paytm`) and `Official Website` (e.g. `paytm.com`) on `/setup`.
2. **SSRF Boundary Check:** `src/lib/intelligence/safe-target.ts` validates the hostname against RFC 1918 private subnets, loopbacks (`127.0.0.1`), cloud metadata (`169.254.169.254`), and internal suffixes (`.local`, `.internal`).
3. **Controlled Fetch:** `src/lib/intelligence/http-inspector.ts` performs a step-by-step HTTP inspection with redirect tracking (up to 5 hops), enforcing SSRF validation at every destination hop and bounding the body snippet to 512 KB.
4. **Identity & Provenance Extraction:** `src/lib/analyzers/website-identity-analyzer.ts` parses the HTML statically:
   - Identifies JSON-LD `@type: Organization` schemas.
   - Extracts official `sameAs` social profile URLs.
   - Filters out share widgets (e.g. `x.com/share`, `facebook.com/sharer`).
   - Discovers mobile app deep links on Google Play (`net.one97.paytm`) and the App Store (`id473941634`).
   - Resolves relative logo URLs to absolute URLs with provenance (`organization_schema` or `og_image`).
5. **Review State (`ready_for_review`):** The setup page renders the discovered brand entity, logo preview, identity signals, and interactive toggle controls for discovered social profiles and mobile applications.
6. **Analyst Confirmation:** When the analyst clicks **CONFIRM OFFICIAL IDENTITY**, the verified profiles, package IDs, domains, and keywords are saved both in `BrandStore` (browser storage) and synchronized via `POST /api/brands`.
7. **Downstream Baseline:** All future multi-provider investigations (`POST /api/investigate`) evaluate candidate entities directly against this verified ground truth.

---

## 3. API Endpoints

### 3.1 `POST /api/brands/analyze`
- **Purpose:** Performs live server-side website analysis, SSRF defense, and identity extraction.
- **Request Body:**
  ```json
  {
    "brandName": "Paytm",
    "officialWebsite": "paytm.com"
  }
  ```
- **Response (`ready_for_review`):**
  ```json
  {
    "status": "ready_for_review",
    "brand": {
      "name": "Paytm",
      "legalName": "One97 Communications Limited",
      "website": "https://paytm.com/",
      "domain": "paytm.com",
      "logo": "https://paytm.com/static/brand-logo.png",
      "logoSource": "organization_schema",
      "logoConfidence": "high",
      "aliases": ["Paytm", "One97 Communications Limited", "One97 Communications", "Paytm Wallet"]
    },
    "domains": [
      { "domain": "paytm.com", "source": "canonical_hostname", "confidence": "high" }
    ],
    "socialProfiles": [
      {
        "platform": "twitter",
        "url": "https://x.com/Paytm",
        "username": "@Paytm",
        "source": "organization_schema",
        "confidence": "high",
        "evidenceUrl": "https://paytm.com/",
        "confirmed": true
      }
    ],
    "applications": [
      {
        "name": "net.one97.paytm",
        "store": "Google Play",
        "storeUrl": "https://play.google.com/store/apps/details?id=net.one97.paytm",
        "packageId": "net.one97.paytm",
        "source": "official_website",
        "confidence": "high",
        "confirmed": true
      }
    ],
    "signals": [
      { "name": "Website Reachable", "status": "verified", "description": "Target responded with valid HTML payload." },
      { "name": "Organization Schema", "status": "verified", "description": "Found 1 JSON-LD organizational schema entity." },
      { "name": "Canonical Domain", "status": "verified", "description": "Authoritative domain established as \"paytm.com\"." }
    ],
    "evidence": [...],
    "providerStatus": {
      "websiteAnalyzer": { "status": "connected", "statusCode": 200 },
      "searchDiscovery": { "status": "not_configured" }
    },
    "discoveredAt": "2026-10-08T08:00:00.000Z"
  }
  ```

### 3.2 `POST /api/brands` & `GET /api/brands`
- **Purpose:** Stores and retrieves the analyst-confirmed authoritative brand profile baseline.

---

## 4. Evidence & Provenance Model

Every discovered digital asset carries an immutable provenance trace:
- **`sourceType`:** `'organization_schema'` | `'official_website'` | `'og_image'` | `'apple_touch_icon'` | `'favicon'` | `'user_input'`
- **`sourceUrl` / `evidenceUrl`:** The exact webpage URL where the asset was discovered.
- **`confidence`:**
  - `HIGH`: Direct JSON-LD `sameAs` link or official footer link on verified primary domain.
  - `MEDIUM`: OpenGraph image or non-schema link.
  - `LOW`: Generic favicon icon.
- **`status`:**
  - `DISCOVERED`: Discovered during automated analysis, awaiting analyst review.
  - `OFFICIAL`: Verified and confirmed by the analyst.

---

## 5. Security Controls

1. **SSRF Prevention (`src/lib/intelligence/safe-target.ts`):**
   - Direct rejection of loopbacks (`127.0.0.0/8`, `::1`), link-local/cloud metadata (`169.254.0.0/16`, `fe80::/10`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and internal suffixes (`.local`, `.internal`, `.lan`, `.arpa`).
   - DNS pre-resolution validation to thwart DNS rebinding attacks.
2. **Hop-by-Hop SSRF Validation:** Every HTTP 3xx redirect destination is individually validated against SSRF rules before making the next outbound request.
3. **Execution Caps:** Maximum 5 redirect hops, 5000ms network timeout, and 512 KB response body read cap.
4. **No Arbitrary Script Execution:** Static regex/DOM parsing without executing JavaScript, preventing DOM-based payload execution.

---

## 6. Environment Variables

| Variable | Description | Default / Requirement |
|---|---|---|
| `GEMINI_API_KEY` | Optional Google Gemini 1.5 Flash key for AI evidence summarization | Optional |
| `SERPER_API_KEY` | Optional Serper Google Search API key for web candidate discovery | Optional |
| `TAVILY_API_KEY` | Optional Tavily Search API key for social candidate discovery | Optional |
| `SAFENET_SCAN_TIMEOUT_MS` | Network timeout budget for live scans (ms) | `8000` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |

*Note: The core Feature 1 pipeline (SSRF protection, HTTP inspection, JSON-LD parsing, OpenGraph extraction, and provenance modeling) operates autonomously without any external API keys.*

---

## 7. Known Limitations & Real vs. Unavailable Capabilities

1. **Client-Side SPA Content:** Websites that inject their entire navigation and JSON-LD exclusively via client-side JavaScript (without Server-Side Rendering) will expose only `<head>` metadata (OpenGraph tags, title, and favicons) to static HTTP fetches.
2. **Firewall / Corporate Proxy:** In environments with strict corporate SSL interception (e.g. Fortinet Web Filter), outbound HTTPS connections without locally trusted system roots will return `DEPTH_ZERO_SELF_SIGNED_CERT`. SAFENET detects and honestly reports these network errors (`website_unreachable`) rather than silently synthesizing mock profiles.
3. **Search Provider:** Without a `SERPER_API_KEY` or `TAVILY_API_KEY`, Layer 2 search discovery is marked honestly as `not_configured`, with zero fake search results generated.
