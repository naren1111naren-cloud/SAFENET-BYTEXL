# SAFENET Real-Time Brand Profile Intelligence Audit
**Document Version:** 1.0.0  
**Date:** 2026-10-08  
**Objective:** Audit existing brand profile management, website inspection services, and mock dependencies; outline the engineering blueprint for authentic, evidence-backed brand ground truth establishment.

---

## 1. Executive Summary

In a Digital Risk Protection (DRP) platform like SAFENET, the **Brand Profile is the authoritative ground truth**. Every look-alike domain, malicious mobile application, and impersonating social media profile is evaluated against this baseline.

Currently, SAFENET features an administrative setup screen (`src/app/setup/page.tsx`) and an in-memory/localStorage store (`src/lib/brand-store.ts`) with hardcoded presets for Paytm and Nike. While manual configuration works, SAFENET lacks **Real-Time Brand Profile Intelligence**—the ability to take a brand name and official website URL, autonomously inspect the live website, extract OpenGraph/JSON-LD/canonical metadata, discover verified social handles and app store links with provenance trails, and allow an analyst to review and confirm the ground truth before storing it.

---

## 2. Existing Codebase Audit

### 2.1 Existing Brand Profile Functionality
- **Data Types (`src/types/brand.ts`):**
  - Defines `BrandProfile` containing `id`, `name`, `domain`, `officialDomains`, `handles` (`SocialHandles`), `appPackageName`, `authorizedAppIds`, `officialDevelopers`, `brandKeywords`, and `officialSupportChannels`.
  - Defines `ThreatItem`, `ThreatEvidence`, and `MonitoringStats`.
- **Storage Layer (`src/lib/brand-store.ts`):**
  - Uses browser `localStorage` under `safenet_brand_profile`.
  - Provides `getBrand()`, `saveBrand()`, `loadPreset()`.
  - Pre-loads presets (`Nike`, `Paytm`).
  - Computes `getMonitoringStats()` dynamically from active assets.
- **Frontend Setup UI (`src/app/setup/page.tsx`):**
  - A manual form with preset switchers (Paytm / Nike).
  - Contains fields for Brand Name, Official Primary Domain, Allowlisted Domains, Twitter handle, Telegram/Instagram handle, App Package ID, Authorized Publishers, Brand Keywords, and Support Channels.
  - Features a "START INVESTIGATION" button calling `POST /api/investigate`.
  - **Limitation:** Does not currently have an "ANALYZE BRAND" action to crawl and extract verified brand identity from a real URL.

### 2.2 Existing Backend / API Architecture
- **Framework:** Next.js 16.3.8 App Router with Turbopack.
- **Active API Routes:**
  - `POST /api/investigate`: Runs live multi-provider discovery (iTunes, Search, Social), assesses deterministic risk, and returns explainable threats.
  - `GET /api/health`: Validates DNS, Gemini LLM, App Store provider, and Search provider connectivity.
  - `POST /api/check`: Inspects individual domains/URLs using DNS, TLS, and look-alike heuristics.
  - `POST /api/search`: Real-time threat index search.
  - `POST /api/simulate`: Controlled simulation endpoint.

### 2.3 Existing Internet & Data Providers
- `src/lib/providers/apps/itunes-provider.ts`: Queries the live Apple iTunes Search API for iOS candidate apps.
- `src/lib/providers/search/search-provider.ts`: Real web search provider (Serper, Tavily, Brave); reports honest `not_configured` when API keys are absent.
- `src/lib/providers/social/social-provider.ts`: Targeted social candidate search across Twitter/X, Telegram, Instagram, and LinkedIn.
- `src/lib/providers/registry.ts`: Concurrent execution, bounded timeouts, and deduplication.

### 2.4 Existing Reusable Services
- **SSRF & Safety Checker (`src/lib/intelligence/safe-target.ts`):**
  - Validates hostnames against loopbacks (`127.0.0.1`), RFC 1918 private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), private IPv6 (`fc00::/7`, `fe80::/10`, `::1`), and internal suffixes (`.local`, `.internal`, `.lan`).
  - Implements DNS pre-resolution validation to prevent DNS rebinding.
- **URL Normalizer (`src/lib/intelligence/url-normalizer.ts`):**
  - Validates protocols (strictly `http:` and `https:`), strips embedded credentials, parses multi-level public suffixes (`.co.in`, `.co.uk`, etc.), and extracts registrable domains.
- **Bounded HTTP Inspector (`src/lib/intelligence/http-inspector.ts`):**
  - Executes controlled `fetch` requests with manual redirect handling (up to 5 hops), enforcing SSRF validation at every single redirect destination.
  - Implements abort timeouts (default 4000ms) and response byte capping (512 KB).
- **Static HTML Inspector (`src/lib/intelligence/page-inspector.ts`):**
  - Extracts titles, canonical links, meta descriptions, forms, inputs, and external script hosts.

### 2.5 Existing Mock Data Inventory
- `src/lib/brand-store.ts`:
  - Contains `generateDemoDataset()` and `seedDemoDataset()` (isolated in demo mode, not invoked during live investigations).
  - Hardcoded preset objects (`PRESET_BRANDS['Nike']`, `PRESET_BRANDS['Paytm']`) used for quick analyst demonstration.
- `src/lib/clustering/threat-clusterer.ts`: Contains demo cluster seed functions.
- `src/app/check/page.tsx`: Contains demo check input presets for quick UI demonstration.

### 2.6 Missing Functionality (Feature 1 Scope)
1. **No Website Identity Analyzer:** No dedicated server-side engine that parses Organization JSON-LD schemas (`@type: Organization`, `sameAs`, `logo`), OpenGraph tags (`og:image`, `og:title`), favicons, footer/header social links, and official mobile application store links.
2. **No `POST /api/brands/analyze` Route:** No endpoint taking `{ brandName, officialWebsite }` and orchestrating validation, safe HTTP retrieval, identity parsing, and provenance generation.
3. **No Interactive Review UI:** The setup page currently has static text fields and does not display live discovery steps (`VALIDATING` → `FETCHING_WEBSITE` → `EXTRACTING_IDENTITY` → `DISCOVERING_SOCIAL` → `READY_FOR_REVIEW`) or allow the user to review, edit, and confirm discovered assets before committing to the baseline.
4. **No Provenance / Evidence Tracking for Brand Assets:** Discovered assets lack metadata documenting `sourceType` (`official_website`, `organization_schema`, etc.), `sourceUrl`, and `confidence` (`high`, `medium`).

---

## 3. Implementation Plan

### Step 1: Create Website Identity Analyzer (`src/lib/analyzers/website-identity-analyzer.ts`)
- Build a server-side parser extracting:
  - Canonical hostname & registrable domain.
  - Page title & meta description.
  - OpenGraph branding (`og:title`, `og:image`, `og:site_name`).
  - High-resolution favicon & logo URLs.
  - JSON-LD schemas (`Organization`, `Corporation`, `WebSite`) extracting `name`, `legalName`, `alternateName`, `logo`, and `sameAs` URLs.
  - Social media profiles (Instagram, X/Twitter, LinkedIn, Facebook, YouTube, Telegram, TikTok, GitHub) with username parsing and social share widget exclusion.
  - Official App Store links (Google Play `play.google.com/store/apps/details?id=...`, Apple App Store `apps.apple.com/...`).
  - Organization aliases (cleaned legal forms: "Pvt Ltd", "Inc.", etc.).
  - Provenance model for each asset: `sourceType`, `sourceUrl`, `discoveredAt`, `confidence`.

### Step 2: Create API Route `POST /api/brands/analyze` (`src/app/api/brands/analyze/route.ts`)
- Validate input: `brandName` and `officialWebsite`.
- Execute SSRF safety check via `validateSafeTarget()`.
- Normalize target URL via `normalizeUrlInput()`.
- Execute bounded HTTP retrieval via `inspectHttpEndpoint()`.
- Run `analyzeWebsiteIdentity()`.
- Check optional search provider if configured; return honest status if unconfigured.
- Return structured analysis response with discovery signals and evidence items.

### Step 3: Enhance Brand Store & Types (`src/types/brand.ts` & `src/lib/brand-store.ts`)
- Add provenance support: `DiscoveredIdentityAsset`, `BrandEvidenceItem`.
- Ensure brand profile persistence retains discovered official domains, developer names, app bundle IDs, and social handles.

### Step 4: Upgrade Setup UI (`src/app/setup/page.tsx`)
- Add an "ANALYZE BRAND" action button alongside manual fields.
- Display genuine progress states (`IDLE` → `VALIDATING` → `FETCHING_WEBSITE` → `EXTRACTING_IDENTITY` → `READY_FOR_REVIEW`).
- Present interactive Discovered Identity Review Card:
  - Discovered Brand Name & Logo preview with provenance source.
  - Discovered Domains with status.
  - Discovered Social Profiles with platform badges, direct links, and [Confirm / Remove] actions.
  - Discovered Mobile Applications with store badges and package IDs.
  - Identity Signals checklist (Website Reachable, Organization Schema Found, Canonical Domain Verified, etc.).
  - "CONFIRM OFFICIAL IDENTITY" button that writes verified assets to the authoritative baseline.

### Step 5: Comprehensive Automated Testing & Documentation
- Write automated test suite `tests/brand-profile-intelligence.test.mjs` verifying:
  - SSRF protection blocks internal/private IPs.
  - Real HTML parsing with JSON-LD schemas, OpenGraph tags, and social/app links.
  - Share-link filtering (rejecting `twitter.com/share`, etc.).
  - Alias normalization.
  - End-to-end API response contract.
- Run `npm test` and `npm run build` to ensure zero regressions and clean TypeScript builds.
- Document implementation in `/docs/BRAND_PROFILE_REALTIME_IMPLEMENTATION.md` and test results in `/docs/BRAND_PROFILE_TEST_REPORT.md`.
