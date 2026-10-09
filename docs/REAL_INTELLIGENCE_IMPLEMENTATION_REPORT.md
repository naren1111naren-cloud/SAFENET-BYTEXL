# SAFENET Real Intelligence Implementation Report

**Project:** SAFENET (Digital Risk Protection Platform)  
**Date:** 2026-10-08  
**Scope:** Complete replacement of simulated/fake threat intelligence with a working, real-source investigation pipeline.

---

## 1. Executive Summary

SAFENET has been transitioned from a dashboard displaying simulated threat datasets into an authentic, evidence-backed Digital Risk Protection prototype. The system operates on a strict product principle:

> **REAL INPUT → REAL INTERNET DATA → REAL CANDIDATE DISCOVERY → REAL EVIDENCE → REAL COMPARISON → REAL RISK SCORE → REAL EXPLANATION**

SAFENET never invents API responses, never falls back to placeholder threats on failure, and never displays fabricated threat metrics. If external credentials are absent or if network filters prevent communication, SAFENET explicitly and honestly communicates provider status (`not_configured` or `provider_unavailable`).

---

## 2. What Was Changed

1. **Provider Abstraction Architecture (`src/lib/providers/`):**
   - Created `InvestigationProvider` interface and normalized `DiscoveredCandidate` schema.
   - Built `ItunesAppStoreProvider` for keyless public Apple App Store catalog discovery.
   - Built `WebSearchProvider` supporting Serper, Tavily, Brave, and generic search APIs.
   - Built `SocialMediaProvider` querying public profile footprints across Twitter/X, Telegram, Instagram, and LinkedIn.
   - Built `ProviderRegistry` for concurrent execution, timeout bounding, candidate normalization, and deduplication.

2. **Deterministic Look-alike & Name Similarity Engine (`src/lib/similarity/lookalike-engine.ts`):**
   - Implemented Damerau-Levenshtein edit distance and normalized similarity ratios.
   - Implemented Token Jaccard similarity for multi-word brand variations.
   - Implemented repeated character expansion detection (e.g., `payttm`, `examplle`).
   - Implemented combosquatting prefix/suffix keyword detection.
   - Implemented deterministic brand query and look-alike variant generation (`generateBrandVariants`).

3. **Candidate Risk Engine (`src/lib/risk-engine/candidate-risk-engine.ts`):**
   - Implemented transparent, evidence-based scoring (0–100):
     - Name / Title similarity: 0–20
     - Username similarity: 0–15
     - Official account mismatch: 0–20
     - App developer mismatch: 0–15
     - External link / domain mismatch: 0–15
     - Impersonation brand claims: 0–10
     - Visual branding: 0–5 (evaluated honestly; reports *"insufficient evidence"* rather than fabricated numbers)
   - Verified official assets authenticated against Brand Profile baseline automatically receive a safe score of 0.

4. **Strictly Grounded AI Explanation Layer (`src/lib/intelligence/ai-candidate-interpreter.ts`):**
   - Gemini 1.5 Flash is bounded strictly to explaining observed evidence without inventing candidates, URLs, or accounts.
   - Clean deterministic rule-based explainability fallback when LLM credentials are unconfigured or unavailable.

5. **Investigation API & Health Endpoint:**
   - Implemented `POST /api/investigate`: Multi-provider discovery, deduplication, identity comparison, risk scoring, AI explanation, and structured result persistence.
   - Implemented `GET /api/health`: Real-time diagnostic reporting for DNS, LLM, App Store, and Search providers.

6. **UI Integration & Honest State Progression:**
   - Updated Brand Baseline (`/setup`) with official domains, developers, and a direct `START INVESTIGATION` execution pipeline with real progress indicators (`INVESTIGATING` → `DISCOVERING` → `ANALYZING` → `COMPLETED`).
   - Updated Command Center (`/overview`): Eliminated fake fallbacks (`|| 8`, `|| 15`, `|| 47`). All metrics (detected candidates, needs attention, active investigations, campaigns, hourly velocity) are derived dynamically from genuine data.
   - Updated Single Entity Check (`/check`): Eliminated fake progress intervals and mock profile synthesis.

---

## 3. Mock Data Removed

| File | Removed Simulated Logic | Replaced With |
|---|---|---|
| `src/lib/brand-store.ts` | Automatic seeding of 6 fake threats (`@nike_support247`, fake typosquats) on storage init or preset load. | Default empty state `[]`; populated exclusively by real investigation runs. |
| `src/lib/brand-store.ts` | Static monitoring stats (`124 profiles`, `18 apps`, `67 domains`, `43 keywords`). | Dynamic calculation based on active brand assets and genuine discovered threats. |
| `src/app/overview/page.tsx` | Fallback operators inflating zero counts (`criticalCount || 8`, `totalDetected || 47`, static 8 investigations, 3 campaigns). | Honest counts (`0` when empty) and clean zero-state guidance. |
| `src/app/overview/page.tsx` | Static 24-hour velocity array `[12, 18, 14, 26, 32, ...]`. | Dynamic hourly bucket aggregation derived from actual threat timestamps. |
| `src/app/check/page.tsx` | Arbitrary `setInterval(..., 280ms)` timer faking scan stages. | State progression driven by actual network request lifecycle. |
| `src/app/check/page.tsx` | Fabricating fake social bio and app permissions when user enters `@handle` or package name. | Genuine input passed to backend; live app lookup via iTunes API. |
| `src/app/api/check/route.ts` | Synthesizing fake customer support bios and fake SMS permissions. | Genuine input evaluation against Brand Profile baseline. |
| `src/app/api/search/route.ts` | Static array of 5 pre-defined fake threats (`nike-reward-support.com`, etc.). | Real search index returning empty results when no verified matching intelligence exists. |
| `src/lib/analyzers/social-analyzer.ts` | Fabricated `logoSimilarityRatio: 0.85` if avatar URL exists. | Honest `logoSimilarityRatio: undefined` and explicit *"insufficient image evidence"* finding. |
| `src/lib/analyzers/app-analyzer.ts` | Fabricated `logoSimilarityRatio: 0.85` if icon URL exists. | Honest `logoSimilarityRatio: undefined` and explicit *"insufficient image evidence"* finding. |
| `src/components/ThreatClusterGraph.tsx` | "Seed Multi-Asset Threat Clusters Demo" button injecting fake threats. | Clean empty state with instructions to run a brand investigation. |

---

## 4. Real Providers Implemented

### Apple App Store Provider (`ItunesAppStoreProvider`)
- **Protocol:** Official Apple iTunes Search API (`https://itunes.apple.com/search`).
- **Authentication:** None required (Public, free).
- **Entities Collected:** App title, developer name, bundle ID, store URL, description, 512px icon, rating, review count, price, OS requirements.
- **Normalization:** Converts to `DiscoveredCandidate` with `source: 'apple_app_store'`.

### Web Search Provider (`WebSearchProvider`)
- **Supported Engines:** Google via Serper (`SERPER_API_KEY`), Tavily (`TAVILY_API_KEY`), Brave (`BRAVE_API_KEY`), or custom Search API (`SEARCH_PROVIDER_API_KEY`).
- **Authentication:** Server-side environment variables only; never exposed to browser.
- **Unconfigured State:** Explicitly returns `not_configured` with instructions to add search key. Never returns fake search results.

### Social Media Provider (`SocialMediaProvider`)
- **Target Platforms:** Twitter/X, Telegram, Instagram, LinkedIn.
- **Method:** Targeted query permutations (`site:twitter.com`, `site:t.me`, etc.) across brand stems.
- **Entities Collected:** Public handle (`@username`), platform, bio snippet, profile URL.
- **Authentication:** Uses configured search provider API key. Honest `not_configured` if absent.

---

## 5. Risk Engine Implementation

Risk scores (0–100) are deterministic and mathematically bounded:

$$\text{Risk Score} = \text{NameSim} + \text{UsernameSim} + \text{OfficialMismatch} + \text{DevMismatch} + \text{LinkMismatch} + \text{BrandClaim}$$

- **Verified Official Asset Override:** If candidate matches the registered official domain, handle, or bundle ID, risk score is strictly set to **0** (Authenticated Official Brand Asset).
- **Evidence-First Guarantee:** Each point contributed must have a corresponding `ThreatEvidence` item in `evidenceList`. If evidence is missing, score contribution is 0.

---

## 6. Environment Variables

Create or update `.env.local`:

```bash
# Optional AI Interpretation (Google Gemini 1.5 Flash)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Search & Social Discovery Feeds
SERPER_API_KEY=your_serper_google_api_key_here
# or TAVILY_API_KEY=your_tavily_api_key_here
# or BRAVE_API_KEY=your_brave_api_key_here

# Threat Intelligence Feeds (Optional)
GOOGLE_SAFE_BROWSING_API_KEY=
VIRUSTOTAL_API_KEY=

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

*Note: The core SAFENET platform, Apple App Store discovery, DNS inspection, RDAP querying, TLS certificate inspection, HTTP verification, look-alike engine, and deterministic risk scoring operate without requiring external paid API keys.*

---

## 7. Known Limitations

1. **Corporate Network Firewalls & SSL Inspection:**
   - In environments where an enterprise firewall (such as Fortinet or Zscaler) intercepts HTTPS traffic with a self-signed root certificate, Node.js fetch requests may encounter `DEPTH_ZERO_SELF_SIGNED_CERT` or HTTP 403 Fortinet Web Filter blocks.
   - SAFENET detects these blocks honestly and reports `status: 'error'` with the exact diagnostic reason, rather than masking it with fake data.
2. **Search API Key Dependency for Social Networks:**
   - Social candidate discovery requires `SERPER_API_KEY` or `TAVILY_API_KEY` to query public platform footprints. If unconfigured, SAFENET reports `status: 'not_configured'`.

---

## 8. Exact Steps to Run & Test

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Test Suite
```bash
npm test
```
Executes all 40 automated verification tests across domain inspection, SSRF boundaries, evidence models, real provider handling, look-alike algorithms, and candidate risk evaluation.

### End-to-End Acceptance Test Walkthrough
1. **Navigate to Brand Baseline:** Open `/setup`.
2. **Configure/Select Organization:** Select **Paytm** or **Nike** (or enter a custom organization).
3. **Verify Baseline Parameters:** Review official primary domain, official domains allowlist, handles, app package, and authorized developers.
4. **Click "START INVESTIGATION":**
   - The UI displays live progress: `INVESTIGATING` → `DISCOVERING` → `ANALYZING` → `COMPLETED`.
   - The backend queries real providers (`POST /api/investigate`), calculates risk scores from real evidence, and persists the investigation.
5. **View Results:**
   - Click **VIEW RESULTS IN DASHBOARD**.
   - Navigate to `/overview` to see genuine detected candidates, triage priority queue, and dynamic telemetry.
   - Click **Investigate** on any candidate to open the Forensic Dossier (`/investigate?id=...`) showing:
     - Entity title and URL
     - Discovered timestamp and provider source
     - Transparent risk score breakdown (0–100)
     - Full evidence trail with itemized findings
     - AI / deterministic threat assessment and defensive recommendations.
