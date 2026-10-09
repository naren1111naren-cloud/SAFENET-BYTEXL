# SAFENET Requirements Specification (Phase 2)

**Document Version:** 1.0.0  
**Status:** Approved for Baseline Adaptation  
**Target Platform:** SAFENET (Digital Risk Protection & Brand Impersonation Detection Platform)  
**Methodology:** Agile Software Development Life Cycle (SDLC)  

---

## 1. Problem Statement & Project Objectives

### 1.1. Problem Statement
Digital brand impersonation, fraudulent mobile applications, deceptive social media handles, and phishing lures present an escalating crisis for enterprises and consumers alike. Organizations lack unified tools to continuously monitor their external digital attack perimeter across mobile app stores and social platforms, while ordinary users struggle to distinguish legitimate corporate communication from deceptive scams. 

Existing solutions suffer from key vulnerabilities:
1. **Siloed monitoring:** Domain scanners, app store scrapers, and social media tools operate disconnectedly.
2. **Fabricated telemetry:** Many demonstration systems inject synthetic or hardcoded risk scores that fail when connected to real internet infrastructure.
3. **Black-box scoring:** Security analysts and end users receive scores (e.g. "85% dangerous") without granular, auditable forensic evidence.
4. **Unsafe inspection:** Naive server-side content scrapers can be exploited via Server-Side Request Forgery (SSRF) or loopback reflection.

### 1.2. Project Objectives
* **Objective 1 (Brand Baseline Integrity):** Provide a single source of truth for an organization's authoritative digital assets (domains, verified social handles, authorized mobile app package IDs, and keywords).
* **Objective 2 (Mobile App Threat Intelligence):** Monitor public mobile application software catalogs (Apple App Store) and APK manifests to identify unauthorized clones, developer mismatches, and package typosquatting.
* **Objective 3 (Social Media Impersonation Perimeter):** Detect unverified or rogue accounts mimicking official brand identities across major networks (YouTube, X, Meta, LinkedIn) with transparent similarity scoring.
* **Objective 4 (Unified Verification & Actionable Remediation):** Enable analysts and consumers to inspect suspect URLs, messages, handles, and apps, producing explainable risk ratings, automated takedown notices, and multilingual customer advisories.

---

## 2. Target Users & Primary User Journeys

### 2.1. User Personas
1. **SOC / Threat Intelligence Analyst:** Monitors organization perimeter, reviews detected anomalies, initiates triage workflows, and generates legal takedown packages.
2. **Brand Protection & Legal Manager:** Manages verified brand identity assets, assesses trademark infringement, and exports executive risk briefings.
3. **Consumer / Public User:** Receives suspicious messages, payment demands, or links and needs fast, plain-language guidance on whether an asset is safe.

### 2.2. Primary User Journeys
* **Journey 1 (Brand Onboarding & Identity Discovery):**
  1. Security manager visits `/setup`.
  2. Enters brand domain (e.g., `paytm.com` or `nike.com`).
  3. Clicks **"ANALYZE & DISCOVER"**; SAFENET crawls the live website, extracting official social profiles and app store badges.
  4. Manager confirms discovered assets into the baseline registry.
* **Journey 2 (Perimeter Threat Scanning & Triage):**
  1. Analyst navigates to `/apps` or `/social`.
  2. Launches a targeted perimeter scan against the configured brand baseline.
  3. Discovered candidates are normalized and scored by the deterministic Risk Engine.
  4. Analyst filters by severity, reviews raw signals, and transitions candidate status (`WATCHLIST`, `UNDER REVIEW`, `TAKEDOWN`).
* **Journey 3 (Forensic Investigation & Incident Escalation):**
  1. Analyst selects an anomaly in `/overview` or `/incidents`.
  2. Opens `/investigate?id=...` to inspect DNS records, TLS certificate, RDAP registration age, and heuristic signals.
  3. Generates a formal DMCA/trademark takedown notice with itemized evidence.
  4. Copies multilingual customer safety advisories (English, Hindi, Tamil) for public awareness.
* **Journey 4 (Consumer Digital Verification):**
  1. User visits `/` or `/check`.
  2. Pastes a suspicious URL, SMS text, or social handle.
  3. SAFENET evaluates the input across real network protocols and similarity engines.
  4. User receives an intuitive Arc Gauge risk score, plain-language verdict, and actionable next steps (`SAFE TO PROCEED`, `VERIFY FIRST`, `DO NOT CLICK`).

---

## 3. Functional Requirements (FR)

### Feature 1: Brand Profile Baseline & Identity Discovery (15% Weight)
* **FR-1.1 (Baseline Registry):** The system must store verified brand attributes: brand name, primary domain, official domain allowlist, authorized social handles, authorized app IDs, official developers, and support channels.
* **FR-1.2 (Live Website Crawler):** The system must fetch live brand homepage HTML (within strict size and timeout limits) to discover OpenGraph tags, schema metadata, social profile links, and app store badges.
* **FR-1.3 (Identity Confirmation):** The UI must present discovered assets in a verification checklist allowing users to approve or exclude specific items before saving to the baseline.
* **FR-1.4 (Preset Organizations):** The system must ship with pre-validated baselines for primary benchmark brands (Paytm and Nike) while supporting custom organization entry.

### Feature 2: Mobile App Store Monitoring & APK Analysis (30% Weight)
* **FR-2.1 (Live App Store Ingestion):** The system must query the public Apple iTunes Search API across brand title permutations (`{Brand}`, `{Brand} Official`, `{Brand} Support`) without hardcoded credentials.
* **FR-2.2 (Candidate Normalization):** Every discovered app must be normalized to standard schema (`appName`, `developerName`, `bundleId`, `storeUrl`, `rating`, `reviewCount`, `iconUrl`).
* **FR-2.3 (Developer & Package Correlation):** The system must cross-reference discovered apps against the brand's `officialDevelopers` and `authorizedAppIds`.
* **FR-2.4 (APK Manifest Inspector):** The system must accept Android package metadata or APK files to evaluate requested permissions (`SEND_SMS`, `READ_CONTACTS`, `INSTALL_PACKAGES`) and calculate an APK risk score.
* **FR-2.5 (Honest No-Result Reporting):** When no matching rogue apps exist in stores, the system must display zero candidates rather than generating simulated applications.

### Feature 3: Multi-Platform Social Media Monitoring (30% Weight)
* **FR-3.1 (Multi-Platform Querying):** The system must generate targeted search permutations across YouTube, X (Twitter), Meta (Instagram/Facebook), and LinkedIn.
* **FR-3.2 (Combosquatting & Lookalike Detection):** The system must detect username variations (e.g. `@Brand_Helpdesk`, `@BrandOfficialCare`) using Levenshtein distance, token overlap, and delimiter analysis.
* **FR-3.3 (Verified Allowlist Bypass):** Official handles explicitly registered in the brand baseline must be assigned a risk score of 0 (Authenticated Asset).
* **FR-3.4 (Explainable Scoring):** Risk scores must be decomposed into transparent point contributors (handle mismatch: +20, unverified bio link: +15, urgency wording: +15).
* **FR-3.5 (Candidate Triage):** Analysts must be able to change candidate triage states (`NEW`, `WATCHLIST`, `TAKEDOWN`, `DISMISSED`) with persistent storage.
* **FR-3.6 (Graceful Provider Degradation):** When an external social API returns rate limits (`402`, `429`) or auth failures (`400`, `401`), the system must record provider status without crashing remaining discovery sources.

### Feature 4: Domain, URL & Phishing Threat Intelligence (15% UX / Bonus Look-alike)
* **FR-4.1 (URL Normalization & Validation):** The system must parse and normalize inputs (supporting scheme-less hostnames, IP literals, and Punycode IDNs) and reject invalid or malformed formats.
* **FR-4.2 (Network Protocol Inspection):** The system must execute live DNS A/AAAA lookups, TLS certificate extraction, and RDAP registration age queries.
* **FR-4.3 (Look-alike & Homoglyph Detection):** The system must identify Cyrillic/Greek homoglyph confusables (e.g. Cyrillic `а` in `pаytm`) and character repetitions.
* **FR-4.4 (Scam Lure & Pressure Analysis):** The system must detect urgency manipulation (threat of immediate suspension, fake KYC expiry, UPI payment demands).
* **FR-4.5 (Evidence Package Generation):** Scans must produce a structured evidence package separating confirmed findings from unavailable data.
* **FR-4.6 (Takedown & Advisory Generation):** The system must generate formal takedown notices and localized customer warnings in English, Hindi, and Tamil.

### Operational Features: Triage, Campaigns & Reports
* **FR-5.1 (Campaign Clustering):** The system must group related threats sharing common IOCs (IP, ASN, registrar, developer) into attack clusters.
* **FR-5.2 (Incident Lifecycle Management):** The system must track incidents through defined states (`New` → `Investigating` → `Confirmed` → `Contained` → `Resolved`).
* **FR-5.3 (Executive Briefings):** The system must generate shareable risk reports summarizing critical alerts, monitored vectors, and mitigation progress.

---

## 4. Non-Functional Requirements (NFR)

* **NFR-1 (Performance & Latency):** Full multi-vector scans must complete within a maximum execution budget of 8,000 ms (`SAFENET_SCAN_TIMEOUT_MS`). Individual network probes (DNS, TLS, RDAP) must have dedicated 2.5s timeouts.
* **NFR-2 (Reliability & Fault Tolerance):** A failure in any single third-party provider or protocol probe must never crash the server process or return an unhandled 500 error.
* **NFR-3 (Evidence Integrity & Zero Hallucination):** The system must never fabricate telemetry, mock scores, or invented accounts. Missing or unconfigured data must be reported as `unavailable` or `not_configured`.
* **NFR-4 (Accessibility & Responsive Design):** The UI must render seamlessly across modern desktop and mobile browsers, maintaining typography hierarchy and touch targets.
* **NFR-5 (Resource Conservation):** Read-only web page inspections must be strictly bounded to a maximum of 512 KB (`SAFENET_MAX_RESPONSE_BYTES`) to prevent memory exhaustion.

---

## 5. Security & Privacy Requirements

* **SEC-1 (SSRF Prevention):** All outbound network requests must validate target destinations against prohibited IP ranges. Private IPv4 blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), and cloud metadata services (`169.254.169.254`) must be immediately blocked before socket creation.
* **SEC-2 (Redirect Sandboxing):** HTTP redirect sequences must be strictly bounded to a maximum of 5 hops (`SAFENET_MAX_REDIRECTS`), and every intermediate redirect destination must be re-validated by the SSRF firewall.
* **SEC-3 (Zero Secret Exposure):** API keys, bearer tokens, and private credentials must never be passed to frontend client bundles, printed in log streams, or returned in public API payloads.
* **SEC-4 (Input Sanitization):** User inputs must be sanitized against SQL injection, XSS, and command injection before being passed to underlying libraries or stored in databases.
* **SEC-5 (Scriptless Page Analysis):** Content inspection must parse static HTML without executing untrusted client-side JavaScript.

---

## 6. API & Integration Requirements

| Integration | Protocol / Transport | Authentication | Failure Handling Behavior |
|---|---|---|---|
| **Apple iTunes API** | HTTPS REST | None (Public) | Fall back to empty result list; log status. |
| **System DNS Resolver** | UDP/TCP Socket | OS-level | Mark DNS status as `unresolved`; risk score bounded. |
| **RDAP WHOIS Protocol** | HTTPS REST | None (Public) | Mark age as `unknown`; do not invent fake creation dates. |
| **TLS Handshake** | TCP/TLS Socket | None | Record TLS status as `handshake_failed` or `expired`. |
| **Google Gemini 1.5** | HTTPS SDK / REST | API Key | Fall back to deterministic rule-based explainability. |
| **YouTube Data API v3** | HTTPS REST | API Key | Return `not_configured` or `unavailable` on quota limit. |
| **X (Twitter) API v2** | HTTPS REST | Bearer Token | Return `rate_limited` on HTTP 402/429 without halting pipeline. |
| **Meta Graph API** | HTTPS REST | Access Token | Return `auth_error` on HTTP 400 without crashing discovery. |
| **LinkedIn API** | HTTPS REST | Access Token | Return `unauthorized` on HTTP 401 without crashing discovery. |
| **Supabase PostgREST** | HTTPS REST | Service/Anon Key | Fall back to LocalStorage sandbox when unconfigured. |

---

## 7. Feature Acceptance Criteria

### AC-1: Brand Profile Setup
* **Given** an analyst on `/setup` entering `paytm.com`,
* **When** they trigger "ANALYZE & DISCOVER",
* **Then** the system crawls the live site, extracts authentic social handles (`@Paytm`), and allows one-click baseline saving.

### AC-2: Mobile App Spoof Detection
* **Given** a search query for a protected brand,
* **When** an application matches the brand name but originates from an unauthorized developer (e.g. "Quick Loans LLC"),
* **Then** the Risk Engine must flag developer mismatch (+15 risk) and produce an explainable threat item.

### AC-3: Social Media Lookalike Detection
* **Given** an unauthorized handle containing brand keywords (e.g. `@Paytm_KYC_Fast`),
* **When** the handle is evaluated against the registered brand baseline,
* **Then** it must be classified as an unauthorized lookalike (+20 risk) with itemized evidence.

### AC-4: URL & Phishing Threat Evaluation
* **Given** a lookalike domain with Unicode homoglyphs (e.g. `pаytm.com` with Cyrillic `а`),
* **When** inspected via `/api/check`,
* **Then** the Homoglyph Engine must isolate the exact confusable characters and assign elevated risk points.

---

## 8. Known Limitations & Out-of-Scope Items

### Known Limitations
* **Public App Store Depth:** Ingestion is currently limited to the Apple App Store catalog via the iTunes Search API; Google Play scraping without headless browser emulation is restricted by Google bot-detection.
* **Social API Quota Constraints:** Free-tier or developer-tier API keys for X and Meta are subject to strict monthly request caps; sandbox demo candidates provide benchmark coverage when quotas are exhausted.
* **Client-Side Script Execution:** The page inspector analyzes raw DOM structure and forms; dynamic single-page application rendering (SPAs requiring client-side JS execution) is intentionally out-of-scope for security and performance reasons.

### Out-of-Scope Functionality
* Automated take-down execution against external registrars (SAFENET generates legal takedown notices; manual or legal submission remains an analyst action).
* Active credential testing or offensive vulnerability exploitation against detected phishing infrastructure.
