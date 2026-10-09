# SAFENET — App Threat Intelligence & App Store Monitoring Implementation

## 1. Executive Summary

This document details the implementation of SAFENET's 3rd core digital risk protection capability: **APP THREAT INTELLIGENCE & APP STORE MONITORING**.

The system discovers and investigates mobile applications impersonating protected brands across application stores and unverified sideloaded Android APK packages. It integrates live store intelligence through SerpApi's Google Play Engine, provides static zero-execution APK inspection, correlates discovered package identities against official store listings, runs extracted domains through SAFENET's existing Domain Intelligence engine, and scores threats using an explainable 7-point deterministic risk scoring matrix.

---

## 2. Architecture Overview

```
                                  [ User Input / Investigation ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [ Mode 1: Search App ]                                 [ Mode 2: Analyze APK ]
                     │                                                     │
                     ▼                                                     ▼
       [ SerpApi Google Play Engine ]                             [ Static APK Analyzer ]
       • engine=google_play                                        • Zero-execution parsing
       • gl=in, hl=en                                              • AXML manifest extraction
       • Server-side SERPAPI_KEY only                              • Sensitive permissions matrix
                     │                                             • Embedded URLs & domains
                     ▼                                             • SHA-256 fingerprint
       [ Candidate Normalizer ]                                            │
       • Unified SAFENET Schema                                            ▼
       • Official app identification                              [ Threat Correlator ]
                     │                                             • Package ↔ Store Matching
                     ▼                                             • Google Play search correlation
        [ 7-Point Risk Scoring Engine ]                                    │
        1. Name Similarity      (0-20 pts)                                 ▼
        2. Logo / Visual        (0-20 pts)                       [ SAFENET URL Intelligence ]
        3. Developer Mismatch   (0-15 pts)                       • Domain risk scoring (analyzeDomain)
        4. Description Sim.     (0-15 pts)                       • Phishing / lookalike detection
        5. Package Similarity   (0-10 pts)                                 │
        6. Identity Mismatch    (0-10 pts)                                 ▼
        7. Suspicious Signals   (0-10 pts)                       [ Unified Threat Assessment ]
                     │                                           • Combined Risk Score (0-100)
                     ▼                                           • Exact evidence trail
        [ Investigation Modal / UI ]                             • Sideloaded / Trojan classification
```

---

## 3. Environment Variables & Security

| Variable | Location | Client Exposure | Purpose |
|---|---|---|---|
| `SERPAPI_KEY` | `.env.local` | **STRICTLY BLOCKED** | Server-side authentication with SerpApi. Never exposed via `NEXT_PUBLIC_`, never serialized to frontend JSON payloads. |

- **Security Verification**:
  - `src/app/api/apps/search/route.ts` and `src/app/api/apps/analyze-apk/route.ts` execute exclusively in Node.js server context.
  - The API key is injected directly into outgoing HTTPS requests to `https://serpapi.com/search.json` and stripped from all telemetry and error logs.
  - Sideloaded APK inspection operates strictly in-memory using static binary and ZIP headers with zero code execution.

---

## 4. Files Created and Modified

### Created Files:
1. [src/lib/apps/types.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/lib/apps/types.ts)
   - Normalized candidate data models (`NormalizedAppCandidate`, `AppSearchResponse`).
   - APK static analysis contracts (`ApkStaticAnalysisResult`).
   - Store and network correlation models (`ApkCorrelationReport`).
2. [src/lib/apps/logo-similarity-service.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/lib/apps/logo-similarity-service.ts)
   - Modular perceptual similarity engine (`compareAppLogoSimilarity`).
   - Honest fallback handling returning `Logo comparison unavailable` without fabricating synthetic scores when assets are inaccessible.
3. [src/lib/apps/app-store-service.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/lib/apps/app-store-service.ts)
   - SerpApi Google Play search integration (`engine=google_play`, `gl=in`, `hl=en`).
   - Section/items unpacker and normalization into unified schema.
   - Official application identity detector (`official_candidate = true | false | 'unknown'`).
   - 7-Point deterministic risk scoring engine.
   - Keyword and suspicious pattern detection (fake support numbers, urgent KYC, OTP solicitation).
4. [src/lib/apk/apk-analyzer.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/lib/apk/apk-analyzer.ts)
   - Pure in-memory ZIP parser and Android Binary XML (AXML) extractor (zero execution).
   - Sensitive permissions matrix (SMS interception, `SYSTEM_ALERT_WINDOW` overlays, accessibility hijacking).
   - SHA-256 cryptographic hashing and signature file verification.
   - URL and domain extractor across DEX bytecode and manifests.
5. [src/lib/apps/threat-correlator.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/lib/apps/threat-correlator.ts)
   - Correlates static APK package IDs and labels with Google Play store listings via SerpApi.
   - Feeds extracted network domains through SAFENET's existing `analyzeDomain` engine.
   - Synthesizes multi-vector threat assessments and verdicts.
6. [src/app/api/apps/search/route.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/app/api/apps/search/route.ts)
   - Secure POST endpoint for Google Play search with query validation and country filtering.
7. [src/app/api/apps/analyze-apk/route.ts](file:///c:/Users/Naren/Downloads/SAFENET/src/app/api/apps/analyze-apk/route.ts)
   - Multipart and base64 APK file upload endpoint executing static analysis and threat correlation.
8. [src/app/apps/page.tsx](file:///c:/Users/Naren/Downloads/SAFENET/src/app/apps/page.tsx)
   - Primary App Threat Intelligence UI supporting Search App mode, Analyze APK mode, sample payload testing, and full investigation modal.
9. [tests/app-threat-intelligence.test.mjs](file:///c:/Users/Naren/Downloads/SAFENET/tests/app-threat-intelligence.test.mjs)
   - Automated test suite covering live SerpApi queries, risk scoring, static APK analysis, and threat correlation.

### Modified Files:
1. [src/components/AppShell.tsx](file:///c:/Users/Naren/Downloads/SAFENET/src/components/AppShell.tsx): Added `App Intelligence` to sidebar navigation.
2. [src/components/Navbar.tsx](file:///c:/Users/Naren/Downloads/SAFENET/src/components/Navbar.tsx): Added `App Intelligence` to top navigation bar.
3. [package.json](file:///c:/Users/Naren/Downloads/SAFENET/package.json): Added `tests/app-threat-intelligence.test.mjs` to the `npm test` script.

---

## 5. Google Play Search & Normalization Flow

1. **User Request**: User searches for a brand or app name (e.g., "PayPal", "WhatsApp", "Microsoft").
2. **SerpApi Query**: Backend requests `https://serpapi.com/search.json?engine=google_play&q=<query>&gl=in&hl=en&api_key=<SERPAPI_KEY>`.
3. **Response Unpacking**: Organic results containing categorized sections or direct items are flattened and sanitized.
4. **Official Identity Baseline**:
   - Compares publisher against known verified developers (`PayPal Mobile`, `WhatsApp LLC`, `Microsoft Corporation`, or brand profile baseline).
   - Compares package ID against known authorized package identities (`com.paypal.android.p2pmobile`, `com.whatsapp`).
   - If evidence is clear, assigns `official_candidate = true` and `is_verified_official = true`.
   - If confidence is insufficient, marks `official_candidate = 'unknown'`.
5. **Candidate Normalization**: Formats each app into the unified SAFENET schema:
   - `app_name`, `developer`, `package_id`, `description`, `icon`, `rating`, `reviews`, `installs`, `app_url`, `source`, `source_id`.

---

## 6. Deterministic 7-Point Risk Scoring Methodology

Threat scores are strictly deterministic, fully explainable, bounded between 0 and 100, and mapped to four severity tiers:

| Point Category | Max Weight | Evaluation Criteria |
|---|---|---|
| **1. Name Similarity** | 20 pts | Token overlap, character substitution, combosquatting with trademark. |
| **2. Logo Similarity** | 20 pts | Perceptual image hashing or URL match when assets available; 0 if unavailable. |
| **3. Developer Mismatch** | 15 pts | Publisher differs from known authorized brand publisher. |
| **4. Description Similarity** | 15 pts | Trademark mentions in description, fake claims, urgent KYC/support wording. |
| **5. Package Similarity** | 10 pts | Package ID includes protected brand name on an unauthorized publisher. |
| **6. Identity Mismatch** | 10 pts | Combosquatting modifiers ("Support", "KYC", "Cashback", "Secure", "Recovery"). |
| **7. Suspicious Signals** | 10 pts | Low download volume (< 5k), low rating (< 3.2), phone numbers in description. |

### Severity Scale:
- **0 – 29**: `LOW` (Legitimate applications, verified publishers, compatible non-deceptive utilities)
- **30 – 59**: `MEDIUM` (Third-party utilities with generic naming or partial trademark overlap)
- **60 – 79**: `HIGH` (Unverified apps with trademark combosquatting, unauthorized publisher)
- **80 – 100**: `CRITICAL` (Direct brand impersonation, deceptive credentials/KYC lures, malicious APKs)

---

## 7. APK Static Analysis & Correlation Flow

1. **Upload & In-Memory Ingestion**: File buffer received (multipart or base64); maximum limit 100MB; zero execution.
2. **Cryptographic Fingerprinting**: Calculates SHA-256 hash.
3. **ZIP Structure Parsing**: Locates `AndroidManifest.xml`, `classes.dex`, and `META-INF/` signature certificates.
4. **Manifest Analysis**:
   - Extracts package ID, application label, version name, and version code.
   - Evaluates declared permissions against high-risk categories (`RECEIVE_SMS`, `READ_SMS`, `SYSTEM_ALERT_WINDOW`, `BIND_ACCESSIBILITY_SERVICE`, `REQUEST_INSTALL_PACKAGES`).
5. **DEX Network Extraction**:
   - Scans string pool and bytecode buffers for HTTP/HTTPS endpoints.
   - Filters out standard benign frameworks (`schemas.android.com`, `google.com`, `w3.org`).
6. **Store Correlation**:
   - Queries Google Play for the extracted application label and package ID via SerpApi.
   - Evaluates match status: `MATCH` (verified or unverified on store), `PARTIAL MATCH`, `NO MATCH`, or `UNKNOWN`.
7. **Network Threat Correlation**:
   - Sends extracted domains to SAFENET's existing `analyzeDomain` engine.
   - Calculates domain risk scores and combines with APK permission risks.
8. **Unified Verdict**: Produces combined threat assessment and evidence trail.

---

## 8. Automated Test Results

The full SAFENET test suite was executed via `npm test`:

```
▶ SAFENET App Threat Intelligence & App Store Monitoring
  ▶ 1. SerpApi Real Google Play Queries
    ✔ 1.1 Search "PayPal" returns real candidates with normalized fields (618ms)
    ✔ 1.2 Search "WhatsApp" identifies legitimate WhatsApp candidate (433ms)
    ✔ 1.3 Search "Microsoft" identifies legitimate Microsoft publisher (263ms)
    ✔ 1.4 Search nonexistent app handles zero results gracefully without crashing (41ms)
  ✔ 1. SerpApi Real Google Play Queries (1358ms)
  ▶ 2. Deterministic 7-Point Risk Scoring Engine
    ✔ 2.1 Low risk scored for exact official application (239ms)
    ✔ 2.2 High/Critical risk detected for impersonation patterns with mismatch developer (213ms)
  ✔ 2. Deterministic 7-Point Risk Scoring Engine (453ms)
  ▶ 3. Logo Similarity Service
    ✔ 3.1 Returns unavailable explanation when icon URLs are missing or invalid (0.4ms)
  ✔ 3. Logo Similarity Service (0.7ms)
  ▶ 4. Static Zero-Execution APK Analysis
    ✔ 4.1 Accurately extracts metadata, sensitive permissions, and SHA-256 hash (2.5ms)
  ✔ 4. Static Zero-Execution APK Analysis (2.7ms)
  ▶ 5. APK ↔ Store Correlation & Network Threat Correlation
    ✔ 5.1 Correlates suspicious APK with Google Play search and domain intelligence (201ms)
  ✔ 5. APK ↔ Store Correlation & Network Threat Correlation (201ms)
✔ SAFENET App Threat Intelligence & App Store Monitoring (2018ms)

Total Suite Results: 73 tests passed, 0 failed across 22 test suites.
Next.js Production Build: Compiled cleanly with zero errors (Turbopack, TypeScript 5).
```

---

## 9. Capability Verification Matrix

| Required Capability | Status | Notes |
|---|---|---|
| **APP STORE SEARCH** | **PASS** | Functional in `/apps` with country selection (India, US, UK, Global). |
| **REAL SERPAPI DATA** | **PASS** | Live Google Play organic data parsed with real metrics (installs, ratings, packages). |
| **APK ANALYSIS** | **PASS** | Pure in-memory static inspection extracting permissions, hashes, and DEX strings. |
| **APK → GOOGLE PLAY MATCH** | **PASS** | Classifies package/label match against Google Play (`MATCH`, `NO MATCH`, etc.). |
| **APK → URL INTELLIGENCE** | **PASS** | Direct integration with SAFENET's existing `analyzeDomain` engine. |
| **RISK ENGINE** | **PASS** | 7-Point deterministic scoring model with exact, human-readable evidence. |

---

## 10. Known Limitations & Future Work

1. **Apple App Store Deep Scraping**: SerpApi currently provides Google Play search. Apple iTunes lookup is supported via the fallback iTunes Search API, but deeper iOS IPA static inspection can be expanded in a future phase.
2. **Dynamic Sandboxing**: The APK analyzer strictly adheres to **static analysis (zero execution)** for safety. Sandboxed dynamic execution (detonation) can be added as an optional modular backend worker in enterprise configurations.
3. **Vector Icon Embeddings**: Logo comparison uses perceptual hashing and asset URLs. Future upgrades can incorporate local ResNet or CLIP embeddings for non-pixel-identical logo variations.
