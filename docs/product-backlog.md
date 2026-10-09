# SAFENET Product Backlog (Phase 4)

**Document Version:** 1.0.0  
**Status:** Maintained & Prioritized  
**Project:** SAFENET (Digital Risk Protection Platform)  

---

## 1. Backlog Schema & Conventions

Each backlog item contains:
* **Item ID:** `US-xx` (User Story) or `DEF-xx` (Defect/Technical Debt).
* **Title & User Story:** Description of user intent and value.
* **Feature Area:** 1: Brand Baseline, 2: App Monitoring, 3: Social Monitoring, 4: Domain/Verification, 5: Operational Triage, 6: Platform/Quality.
* **Priority:** P0 (Must Have), P1 (Should Have), P2 (Could Have).
* **Dependencies:** Pre-requisite stories or external dependencies.
* **Acceptance Criteria (AC):** Verifiable conditions of satisfaction.
* **Implementation Status:** `VERIFIED_DONE`, `IN_PROGRESS`, `PLANNED`.
* **Verification Evidence:** Code file links, test suite results, and operational proof.

---

## 2. Product Backlog Items

### Feature 1: Brand Profile Baseline & Real-Time Identity Discovery (15% Weight)

| ID | Title & User Story | Priority | Dependencies | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|---|---|:---:|---|
| **US-01** | **Authoritative Brand Baseline Registry**<br>_As a security manager, I want to store our verified domains, handles, and app bundle IDs so that SAFENET has an authoritative source of truth._ | **P0** | None | 1. Schema supports `domain`, `officialDomains`, `handles`, `authorizedAppIds`, `officialDevelopers`.<br>2. Supports preset brands (Paytm, Nike) and custom organizations.<br>3. Baseline persists across browser sessions. | **VERIFIED_DONE** | `src/types/brand.ts`<br>`src/lib/brand-store.ts`<br>`src/app/setup/page.tsx` |
| **US-02** | **Live Website Identity Crawler**<br>_As a brand manager, I want to crawl our corporate homepage so that our official social accounts and app store badges are automatically discovered without manual data entry._ | **P0** | US-01 | 1. Extracts OpenGraph metadata, JSON-LD Organization schema.<br>2. Parses social media outbound links and app badges.<br>3. Enforces 512KB read limit and 2.5s timeout.<br>4. Presents human verification checklist before saving. | **VERIFIED_DONE** | `src/lib/analyzers/website-identity-analyzer.ts`<br>`src/app/api/brands/analyze/route.ts`<br>`tests/brand-profile-intelligence.test.mjs` |
| **US-03** | **Dual-Tier Database Persistence**<br>_As a platform architect, I want brand baselines to synchronize to Supabase PostgreSQL when configured while gracefully falling back to LocalStorage when unconfigured._ | **P1** | US-01 | 1. Native PostgREST client executes without external npm dependencies.<br>2. 7 relational tables with RLS policies.<br>3. Offline sandbox operation verified when keys absent. | **VERIFIED_DONE** | `src/lib/supabase/client.ts`<br>`supabase/migrations/`<br>`tests/supabase-brand-persistence.test.mjs` |

---

### Feature 2: Mobile App Store Monitoring & Threat Intelligence (30% Weight)

| ID | Title & User Story | Priority | Dependencies | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|---|---|:---:|---|
| **US-04** | **Apple App Store Candidate Ingestion**<br>_As an analyst, I want to search the Apple App Store catalog for rogue apps mimicking our brand so that unauthorized clones are discovered._ | **P0** | US-01 | 1. Live keyless query against Apple iTunes Search API.<br>2. Generates queries for brand variants ("{Brand}", "{Brand} Support").<br>3. Extracts bundle ID, developer, icon, and ratings. | **VERIFIED_DONE** | `src/lib/providers/apps/itunes-provider.ts`<br>`src/app/api/apps/search/route.ts`<br>`tests/real-intelligence-pipeline.test.mjs` |
| **US-05** | **App Spoof & Developer Mismatch Risk Scoring**<br>_As an analyst, I want apps with matching brand titles but unauthorized developers to receive elevated risk scores with transparent evidence._ | **P0** | US-04 | 1. Verified official apps score 0 risk.<br>2. Developer mismatch contributes +15 risk.<br>3. Unauthorized bundle ID contributes +15 risk.<br>4. Honest empty state when no rogue apps exist. | **VERIFIED_DONE** | `src/lib/risk-engine/candidate-risk-engine.ts`<br>`src/app/apps/page.tsx`<br>`tests/app-threat-intelligence.test.mjs` |
| **US-06** | **Android APK Manifest & Permission Inspector**<br>_As a mobile security engineer, I want to inspect Android APK packages and permissions to flag malware and credential harvesters._ | **P1** | None | 1. Parses Android package metadata and requested permissions.<br>2. Flags dangerous permissions (`SEND_SMS`, `READ_CONTACTS`).<br>3. Computes APK risk score (0-100) with detailed indicator list. | **VERIFIED_DONE** | `src/lib/apk/`<br>`src/app/api/apps/analyze-apk/route.ts`<br>`src/app/apps/page.tsx` |

---

### Feature 3: Multi-Platform Social Media Monitoring (30% Weight)

| ID | Title & User Story | Priority | Dependencies | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|---|---|:---:|---|
| **US-07** | **Multi-Platform Impersonation Search**<br>_As an analyst, I want to search across YouTube, X, Meta, and LinkedIn for accounts impersonating our brand._ | **P0** | US-01 | 1. Live queries to YouTube Data API v3.<br>2. Rate-limited/auth-error providers degrade gracefully without halting scans.<br>3. Generates targeted query permutations ("{Brand} Helpdesk"). | **VERIFIED_DONE** | `src/lib/social/providers/`<br>`src/app/api/social/brands/[id]/scan/route.ts`<br>`tests/social-monitoring.test.mjs` |
| **US-08** | **Combosquatting & Handle Look-alike Detection**<br>_As a threat hunter, I want to detect deceptive handles containing brand keywords and suffixes so that fraud accounts are isolated._ | **P0** | US-07 | 1. Evaluates Levenshtein distance and token overlap.<br>2. Identifies combosquatting suffixes (`_Support`, `_Care`, `_Help`).<br>3. Whitelists registered official brand handles (0 risk). | **VERIFIED_DONE** | `src/lib/social/identity-fingerprint.ts`<br>`src/lib/social/discovery-engine.ts`<br>`tests/social-monitoring.test.mjs` |
| **US-09** | **Social Candidate Watchlist & Triage Lifecycle**<br>_As an incident responder, I want to transition social threats between Watchlist, Review, and Takedown statuses._ | **P1** | US-08 | 1. Analyst can add candidate to watchlist or mark dismissed.<br>2. State transitions persist locally and in database.<br>3. Generates itemized risk evidence breakdown. | **VERIFIED_DONE** | `src/lib/social/social-store.ts`<br>`src/app/api/social/candidates/route.ts`<br>`src/app/social/page.tsx` |

---

### Feature 4: Domain, URL & Phishing Verification Workspace (15% UX / Bonus Look-alike)

| ID | Title & User Story | Priority | Dependencies | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|---|---|:---:|---|
| **US-10** | **Live Network & Protocol Inspection**<br>_As an analyst or consumer, I want to inspect a domain's real DNS, TLS certificate, and RDAP registration age so that infrastructure indicators are verified._ | **P0** | None | 1. System DNS resolves IPv4/IPv6 records.<br>2. TLS socket retrieves certificate validity and SANs.<br>3. RDAP gateway queries registration date.<br>4. SSRF firewall blocks loopback and private subnets. | **VERIFIED_DONE** | `src/lib/intelligence/`<br>`src/app/api/check/route.ts`<br>`tests/phase2-intelligence.test.mjs` |
| **US-11** | **Deterministic Look-alike & Homoglyph Engine**<br>_As a security analyst, I want to catch Unicode homoglyphs and typosquats so that deceptive spoofing domains are identified._ | **P0** | US-10 | 1. Detects Cyrillic and Greek lookalike character substitutions.<br>2. Calculates Damerau-Levenshtein transposition distance.<br>3. Bounded score contribution (0-100). | **VERIFIED_DONE** | `src/lib/similarity/homoglyphs.ts`<br>`src/lib/similarity/lookalike-engine.ts`<br>`tests/phase2-intelligence.test.mjs` |
| **US-12** | **Scam Language & Urgency Lure Detector**<br>_As a consumer, I want to paste suspicious SMS messages to detect urgency coercion, fake KYC threats, and UPI demands._ | **P0** | None | 1. Flags urgency language ("suspend today", "action required").<br>2. Identifies payment solicitation (UPI/VPA handles, lottery grants).<br>3. Provides direct action guidance (`DO NOT CLICK`). | **VERIFIED_DONE** | `src/lib/analyzers/scam-analyzer.ts`<br>`src/app/api/check/route.ts`<br>`src/app/page.tsx` |
| **US-13** | **Automated Legal Takedown & Multilingual Advisory**<br>_As an incident responder, I want to generate formal takedown notices and localized customer advisories so that threats are rapidly mitigated._ | **P1** | US-10 | 1. Generates DMCA/trademark notice for domain registrar or host.<br>2. Generates customer safety warnings in English, Hindi, and Tamil.<br>3. One-click clipboard copy. | **VERIFIED_DONE** | `src/lib/takedown/takedown-generator.ts`<br>`src/lib/advisory/customer-advisory.ts`<br>`src/app/investigate/page.tsx` |

---

### Feature 5: Operational Triage, Clustering & Reporting

| ID | Title & User Story | Priority | Dependencies | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|---|---|:---:|---|
| **US-14** | **Coordinated Campaign Clustering**<br>_As a SOC lead, I want to cluster related threats sharing IP, ASN, or registrar so that coordinated attack campaigns are exposed._ | **P1** | US-10 | 1. Clusters threats based on common IOC overlaps.<br>2. Renders interactive graph and correlation dossier.<br>3. Identifies campaign attribution pathways. | **VERIFIED_DONE** | `src/lib/clustering/threat-clusterer.ts`<br>`src/components/ThreatClusterGraph.tsx`<br>`src/app/campaigns/page.tsx` |
| **US-15** | **Incident Queue & Operational Lifecycle**<br>_As a responder, I want to track incidents across operational states (`New` → `Investigating` → `Confirmed` → `Contained` → `Resolved`)._ | **P1** | US-01 | 1. Status transitions update threat records.<br>2. Severity filtering (Critical, High, Medium, Low).<br>3. Dynamic triage stats without fake counters. | **VERIFIED_DONE** | `src/app/incidents/page.tsx`<br>`src/lib/brand-store.ts` |
| **US-16** | **Executive Briefing Generator**<br>_As a CISO, I want to export an executive summary of our digital threat perimeter for leadership reporting._ | **P2** | US-15 | 1. Generates briefing with threat count, severity distribution, top IOCs.<br>2. Markdown export and clipboard copy. | **VERIFIED_DONE** | `src/app/reports/page.tsx` |

---

### Technical Debt & Code Quality Defect Items

| ID | Title & Description | Priority | Target Sprint | Acceptance Criteria | Status | Verification Evidence |
|---|---|:---:|:---:|---|:---:|---|
| **DEF-01** | **ESLint Configuration & Type Rectification**<br>Resolve 104 ESLint errors and warnings across candidate engines and providers. | **P0** | Sprint 1 | `npm run lint` passes without fatal errors or build blocks (0 errors achieved). | **VERIFIED_DONE** | `eslint.config.mjs`<br>`src/lib/risk-engine/candidate-risk-engine.ts`<br>`npm run lint` (0 errors) |
| **DEF-02** | **Provider Literal Assertion Hardening**<br>Convert string literal types to `as const` in provider declarations to avoid TypeScript type narrowing warnings. | **P1** | Sprint 1 | Clean TypeScript type checks across all providers; type narrowing verified. | **VERIFIED_DONE** | `src/lib/providers/apps/itunes-provider.ts`<br>`src/lib/providers/search/search-provider.ts`<br>`src/lib/providers/social/social-provider.ts`<br>`tests/brand-profile-intelligence.test.mjs` |
| **DEF-03** | **Clean Up Navigation Redundancies**<br>Align `/dashboard` and `/monitoring` routing to maintain unified user journeys across AppShell and Navbar. | **P1** | Sprint 2 | Clear and consistent navigation across all pages; AppShell links to `/social`. | **VERIFIED_DONE** | `src/app/monitoring/page.tsx`<br>`src/components/AppShell.tsx`<br>`src/components/Navbar.tsx` |
| **DEF-04** | **Documentation & SDLC Deliverables Completion**<br>Produce comprehensive Agile SDLC documentation suite in `docs/` according to standard. | **P0** | Sprint 0 / 1 | All 12 requested docs created with verified evidence. | **VERIFIED_DONE** | `docs/` (12 core SDLC documents)<br>`CHANGELOG.md`<br>`SAFENET_BRANDING_INTEGRATION_REPORT.md` |

