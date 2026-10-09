# SAFENET Real Intelligence Audit

**Date:** 2026-10-08  
**Scope:** Full codebase audit for simulated, fake, hardcoded, and placeholder intelligence data in SAFENET.  
**System Objective:** Replace simulated intelligence with a real, working, evidence-backed Digital Risk Protection investigation pipeline.

---

## 1. Current Data Flow

1. **Brand Profile Configuration (`/setup` & `BrandStore`):**
   - User configures or selects a brand profile (e.g., Paytm or Nike) with name, domain, social handles, and app package.
   - Stored in browser `localStorage` (`safenet_brand_profile`).
   - If empty, default seeded profile is loaded.

2. **Single Entity Checking (`/check` & `/api/check`):**
   - The user inputs a domain, URL, social handle, mobile app name, or SMS/text message.
   - Handled by `POST /api/check`:
     - For **Domains & URLs**: Dispatches to `runFullIntelligenceScan` in `src/lib/intelligence/analysis-orchestrator.ts`. Performs real network operations (DNS query, RDAP query, TLS handshake inspection, HTTP response inspection, HTML body parsing, safe browsing / VirusTotal feeds if keys configured, and deterministic risk calculation).
     - For **Social Profiles**: If the user only enters `@handle`, the API synthesizes a fabricated profile object (`displayName: "${currentBrand.name} Customer Support"`, `bio: "Official support representative..."`).
     - For **Mobile Apps**: If the user enters a package name, the API synthesizes a fabricated app object (`appName: "${currentBrand.name} Mobile Services"`, `developerName: "${currentBrand.name} Official"`, `permissions: ['READ_SMS', ...]`).
     - For **Messages**: Runs rule-based scam pattern detection (`analyzeScamContent`).

3. **Dashboard & Threat Display (`/overview`, `/incidents`, `/campaigns`, `/investigate`):**
   - Reads `BrandStore.getThreats()`.
   - If `localStorage` is empty, automatically generates and seeds a 6-item fake demo dataset (`BrandStore.generateDemoDataset`).
   - If `threats.length` is 0, `/overview` falls back to hardcoded numbers (`criticalCount || 8`, `highCount || 15`, `totalDetected || 47`).
   - `/overview` displays hardcoded hourly velocity arrays and static counts (`8 active investigations`, `3 campaigns discovered`).

4. **Search Autocomplete (`/api/search`):**
   - Returns a static array of 5 pre-defined fake threats (`nike-reward-support.com`, `paytm-kyc-verify-2026.net`, `@nike_support247`, etc.).

---

## 2. Every Source of Simulated / Fake Data Identified

| File Path | Location | Description of Simulated Data |
|---|---|---|
| `src/lib/brand-store.ts` | Lines 93–106, 278–360, 622–626 | `generateDemoDataset`: Fabricates fake social profiles (`@nike_support247`), fake typosquat domains, fake APK packages, fake IOCs, and fake timeline events. |
| `src/lib/brand-store.ts` | Lines 238–269 | `getMonitoringStats`: Hardcodes fake monitoring metrics (`socialProfilesMonitored: 124`, `mobileAppsMonitored: 18`, `domainsMonitored: 67`, `keywordsMonitored: 43`). |
| `src/app/api/check/route.ts` | Lines 141–147 | Synthesizes fake social profile metadata when only a handle is provided instead of retrieving real data. |
| `src/app/api/check/route.ts` | Lines 179–184 | Synthesizes fake mobile app metadata (permissions, developer) when only a package name is provided. |
| `src/app/api/search/route.ts` | Lines 7–54 | Hardcoded static array of 5 simulated threats and campaigns. |
| `src/app/api/simulate/route.ts` | Lines 1–38 | Simulated attack scenario generation endpoint creating synthetic threats. |
| `src/lib/simulator/attack-simulator.ts` | Complete file | Attack scenario simulator producing synthetic threat objects. |
| `src/lib/clustering/threat-clusterer.ts` | Lines 337–450 | `getSampleClusteredThreats`: Returns 7 hardcoded fake threats (`demo-threat-1` through `demo-threat-7`). |
| `src/components/ThreatClusterGraph.tsx` | Lines 26, 202–207, 351 | "Seed Multi-Asset Threat Clusters Demo" button injecting simulated threats into the graph. |
| `src/app/overview/page.tsx` | Lines 40–46 | Fallback operators inflating zero counts with hardcoded values (`|| 8`, `|| 15`, `|| 19`, `|| 5`, `|| 47`). |
| `src/app/overview/page.tsx` | Lines 100, 121, 133, 163 | Hardcoded telemetry metrics ("↑ 4 new in last 2h", 8 active investigations, 3 campaigns, static 24h velocity array). |
| `src/app/check/page.tsx` | Lines 130–132 | `setInterval` timer (280ms) simulating progress stages without tracking actual backend execution. |
| `src/app/check/page.tsx` | Lines 155–169 | Client submits fabricated profile and app payloads to `/api/check`. |
| `src/lib/analyzers/social-analyzer.ts` | Line 77 | Fabricates `logoSimilarityRatio = 0.85` if an avatar URL exists. |
| `src/lib/analyzers/app-analyzer.ts` | Line 87 | Fabricates `logoSimilarityRatio = 0.85` if an icon URL exists. |

---

## 3. Every API Currently Connected

1. **DNS Resolver (`dns.promises` in `src/lib/intelligence/dns-intel.ts`):**  
   - Real, local Node.js DNS queries (A, AAAA, MX, TXT, NS, CNAME, PTR, CAA). Fully functional.

2. **RDAP Protocol Query (`src/lib/intelligence/rdap-intel.ts`):**  
   - Real HTTP requests to IANA, ARIN, and RIPE bootstrap RDAP services with 3-second timeout. Fully functional.

3. **TLS Handshake Inspector (`tls.connect` in `src/lib/intelligence/tls-intel.ts`):**  
   - Real Node.js TLS socket inspection for X.509 certificate validity, issuer, SANs, and expiry. Fully functional.

4. **HTTP & HTML Inspector (`fetch` in `src/lib/intelligence/http-inspector.ts` & `page-inspector.ts`):**  
   - Real HTTP head and bounded GET inspections with SSRF safety checks. Fully functional.

5. **IP ASN Enrichment (`ip-api.com` in `src/lib/intelligence/ip-intel.ts`):**  
   - Real public API endpoint for autonomous system numbers and geographic hosting data. Fully functional.

6. **Threat Intelligence Feeds (`src/lib/intelligence/threat-feeds.ts`):**  
   - Google Safe Browsing Lookup v4 and VirusTotal v3. Configured via env variables, gracefully disabled with clear status if unconfigured.

7. **Google Gemini Generative AI (`@google/generative-ai`):**  
   - Connected via `GEMINI_API_KEY`. Used for structured explanation of observed evidence.

---

## 4. APIs That Are Broken or Missing

1. **Missing Provider Architecture:**  
   - No standardized provider interface for discovering external candidates across Web Search, Social Networks, and App Stores.
2. **Missing Real App Store Discovery:**  
   - No connection to public app store APIs (such as Apple iTunes Search API which requires zero API keys, or Google Play store search).
3. **Missing Real Social Media Monitoring:**  
   - No real candidate discovery across Twitter/X, Instagram, Telegram, LinkedIn, YouTube using legitimate search or platform queries.
4. **Missing Brand Investigation Endpoint:**  
   - No `POST /api/investigate` endpoint to orchestrate brand-wide discovery, candidate collection, deduplication, identity comparison, deterministic risk scoring, and evidence persistence.
5. **Missing Provider Health Check Endpoint:**  
   - No `GET /api/health` reporting live connectivity status for Search, App Discovery, LLM, and Network Resolvers.
6. **Key Format Restriction Bug in Gemini:**  
   - Hardcoded check `apiKey.startsWith('AIzaSy')` rejects other valid Google API key formats.

---

## 5. Components Dependent on Mock Data

1. **`BrandStore`:** Seeds simulated dataset whenever storage is empty.
2. **`OverviewPage` (`/overview`):** Displays fallback numbers and static charts when real threats are absent.
3. **`IncidentsPage` (`/incidents`):** Displays mock threats from `BrandStore`.
4. **`CampaignsPage` (`/campaigns`):** Clustered against fake `BrandStore` threats.
5. **`ThreatClusterGraph`:** Features a "Seed Demo Data" button.
6. **`InvestigatePage` (`/investigate`):** Renders dossiers derived from fake `BrandStore` threat items.
7. **`GlobalSearchModal` (`/api/search`):** Autocomplete queries return hardcoded fake domain results.

---

## 6. What Must Be Replaced

1. **Replace Mock Generation with Real Providers:**  
   - Eliminate `generateDemoDataset`, `seedDemoDataset`, and `getSampleClusteredThreats` from the production path.
   - Build a real Provider Architecture in `src/lib/providers/` covering:
     - `SearchProvider` (supporting real search APIs like Serper, Tavily, Brave, Google Custom Search, or explicit unconfigured error states).
     - `AppStoreProvider` (real public queries to Apple iTunes Software Search API and public Play Store discovery).
     - `SocialMediaProvider` (real queries targeting public profiles on X/Twitter, Telegram, Instagram, LinkedIn).
     - Normalized candidate schema returning genuine discovered candidates with raw evidence and timestamps.

2. **Implement `POST /api/investigate`:**  
   - Takes a Brand Profile (`brandName`, `officialWebsite`, `officialSocialAccounts`, `officialApps`, `officialDomains`).
   - Generates brand query variants and look-alike variants.
   - Dispatches to real providers concurrently.
   - Collects, normalizes, and deduplicates candidates.
   - Compares candidates against official Brand Profile baseline.
   - Applies deterministic risk scoring and look-alike distance algorithms.
   - Invokes Gemini for evidence explanation (strictly grounded in retrieved evidence).
   - Returns structured investigation results with provider health states.

3. **Implement `GET /api/health`:**  
   - Validates live connectivity for Search, App Stores, AI/Gemini, and DNS/Network services.

4. **Connect Frontend to Real Investigation Pipeline:**  
   - Add "Start Investigation" flow on Brand Profile (`/setup`) and Command Center (`/overview`).
   - Remove fake fallback numbers and fake progress timers.
   - Render real discovered candidates, genuine evidence, and honest states (`NO_RESULTS`, `PROVIDER_UNAVAILABLE`, `COMPLETED`).
   - Replace `/api/search` with live search against real stored investigations and candidates.

---

## 7. Recommended Implementation Plan

1. **Phase 1: Provider Architecture (`src/lib/providers/`)**
   - Create provider base interfaces and normalized candidate schemas.
   - Implement `AppStoreProvider` utilizing Apple iTunes Search API (public, no key required) and store search.
   - Implement `SearchProvider` supporting configured search engines (`SERPER_API_KEY`, `TAVILY_API_KEY`, `BRAVE_API_KEY`, or `SEARCH_PROVIDER_API_KEY`) with explicit `provider_unavailable` states when unconfigured.
   - Implement `SocialMediaProvider` utilizing targeted search queries and public handle verification.

2. **Phase 2: Look-alike & Risk Engine Enhancement**
   - Enhance string similarity with Levenshtein, Damerau-Levenshtein, token Jaccard, combosquatting, homoglyph detection, and developer matching.
   - Implement honest logo similarity (explicit "insufficient evidence" rather than fabricated 85%).
   - Implement evidence-first risk calculation.

3. **Phase 3: Investigation API & Health Endpoint**
   - Create `POST /api/investigate` implementing the complete 11-step pipeline.
   - Create `GET /api/health` returning live provider statuses.
   - Connect `/api/search` to real brand investigations and candidates.

4. **Phase 4: Brand Profile & Frontend Wiring**
   - Strengthen `BrandProfile` with `officialDevelopers` and `officialApps`.
   - Update `BrandStore` to store real investigation results and discovered candidates, removing default demo seeding from production.
   - Update `/setup`, `/overview`, `/check`, `/investigate`, `/incidents`, `/campaigns` to display real data, honest empty states, and real progress states.

5. **Phase 5: Automated Verification & Documentation**
   - Add unit and integration tests covering real brand investigation, unconfigured providers, empty results, and look-alike calculations.
   - Produce ByteXL mapping and implementation report.
