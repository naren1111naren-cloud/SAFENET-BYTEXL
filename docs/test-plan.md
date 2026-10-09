# SAFENET Comprehensive Test Plan (Phase 6)

**Document Version:** 1.0.0  
**Status:** Approved Quality Assurance Strategy  
**Project:** SAFENET (Digital Risk Protection Platform)  
**Test Runner:** Node.js Native Test Runner via `tsx --test`  

---

## 1. Test Strategy & Scope

The SAFENET testing strategy validates that all detection engines, API adapters, network security controls, and UI workflows operate deterministically, resist adversarial manipulation, and degrade gracefully under network or authentication failures.

### Scope of Testing
1. **Unit Testing:** Similarity metrics (Damerau-Levenshtein, Jaccard overlap), homoglyph confusable matching, URL parsing, IDN Punycode decoding, and permission scoring.
2. **Integration Testing:** End-to-end multi-vector scanner (`/api/check`), Apple iTunes App Store integration, multi-platform social discovery, and website identity crawler.
3. **Negative & Edge-Case Testing:** Empty inputs, malformed URLs, unresolvable domains (NXDOMAIN), oversized response truncation, and private subnet reflection (SSRF).
4. **Resilience & Fault Injection:** Third-party API rate limits (HTTP 402/429), expired bearer tokens (HTTP 400/401), DNS timeouts, and offline database fallback.
5. **Security & Privacy Controls:** SSRF firewall rules, secret non-leakage in client bundles and logs, scriptless page parsing.
6. **Build & Release Quality Gates:** Production compilation (`next build`) and code linting (`eslint`).

---

## 2. Test Environments & Tooling

| Component | Tool / Framework | Configuration / Command |
|---|---|---|
| **Test Runner** | Node.js Test Runner via `tsx` | `npm test` (`tsx --test tests/*.test.mjs`) |
| **Linter** | ESLint 9 (Next.js flat config) | `npm run lint` (`eslint`) |
| **Production Build** | Next.js 16 (Turbopack) | `npm run build` (`next build`) |
| **Runtime Target** | Node.js v20+ / Windows / Linux | `.env.local` + Sandbox fallbacks |

---

## 3. Test Suites & Scenario Matrix

### Suite 1: Phase 2 Intelligence Pipeline (`tests/phase2-intelligence.test.mjs`)
* **30 Scenarios covering:**
  1. *Domain & Risk Heuristics:* Legitimate brand domains not penalized solely for TLD; benign domains (google.com) not triggering false-positive homoglyph warnings; Unicode confusables (Cyrillic `а` in `pаytm.com`) caught; brand-plus-login combosquats detected; unresolvable DNS treated proportionally without critical spikes; missing RDAP handled without fake creation dates; unconfigured providers reported as `not_configured`; confidence and risk score independence; inconclusive assessment states.
  2. *Network Safety & SSRF:* Loopback (`127.0.0.1`, `::1`), private IPv4 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cloud metadata (`169.254.169.254`), and IPv4-mapped IPv6 loopbacks blocked; redirect validation sandboxing; prohibited hostnames; oversized response clamping (512KB); public suffix calculation for multi-part TLDs (`co.uk`, `co.in`); malformed URL resilience.
  3. *Evidence Integrity & Attribution:* Normalized evidence items; credential collection detection without script execution; benign webpages verified clean; bounded score contributions; confidence scaling with coverage.
  4. *Integration & Resilience:* IDN Punycode normalizer; mature domain age penalty immunity; HTTP redirect hop bounds; TLS expired certificate scoring; Gemini AI fallback when offline.

### Suite 2: Real Intelligence Pipeline (`tests/real-intelligence-pipeline.test.mjs`)
* **10 Scenarios covering:**
  1. Live Apple iTunes App Store provider network queries and candidate normalization.
  2. Unconfigured search provider returning honest `not_configured` status.
  3. Unconfigured social provider returning honest `not_configured` status.
  4. Word token overlap calculation in look-alike engine.
  5. Repeated character typosquat expansion (`payttm`).
  6. Deterministic `evaluateLookalikeMatch` scoring.
  7. Brand variant generation without combinatorial explosion.
  8. Verified official application scoring 0 risk.
  9. Unauthorized developer mismatch risk elevation.
  10. Logo similarity reporting `insufficient_evidence` rather than fabricated 93%.

### Suite 3: Brand Profile Intelligence (`tests/brand-profile-intelligence.test.mjs`)
* **Scenarios covering:**
  1. Authoritative baseline registry storage and lookup.
  2. Live website crawler JSON-LD schema parsing.
  3. OpenGraph and social link extraction from HTML.
  4. Human verification checklist asset approval flow.
  5. Fallback behavior for non-schema webpages.

### Suite 4: Mobile App Threat Intelligence (`tests/app-threat-intelligence.test.mjs`)
* **Scenarios covering:**
  1. Multi-query search execution across brand permutations.
  2. Candidate normalization and deduplication.
  3. Android APK manifest permission risk scoring (`SEND_SMS`, `SYSTEM_ALERT_WINDOW`).
  4. Bounded 0–100 risk score and 4-tier risk classification.
  5. Empty store catalog honest state handling.

### Suite 5: Social Media Monitoring (`tests/social-monitoring.test.mjs`)
* **19 Scenarios covering:**
  1. Reference identity normalization.
  2. Bounded variant generation.
  3. Handle normalization (stripping `@`, punctuation).
  4. Combosquatting detection (`_Support`, `_Help`).
  5. Registered official handle whitelisting.
  6. Unconfigured provider graceful non-throwing status.
  7. Logo analyzer `not_available` guarantee.
  8. Reuse of SAFENET domain intelligence on external bio links.
  9. Explainable risk scoring with concrete evidence.
  10. Demo provider synthetic candidate marking (`[DEMO DATA]`).
  11. Candidate handle deduplication across queries.
  12. SocialStore candidate triage and watchlist state transitions.
  13. Multi-signal brand discovery for Nike baseline.
  14. Authoritative identity fingerprint generation.
  15. Controlled lookalike mutations.
  16. 5-Tier threat classification.
  17. Structured Section 25 evidence package.
  18. Arbitrary unverified input ("nceck") producing UNVERIFIED with 0 confidence.
  19. Provider failures returning honest unavailable status.

### Suite 6: Supabase Brand Persistence (`tests/supabase-brand-persistence.test.mjs`)
* **Scenarios covering:**
  1. Migration SQL schema integrity across all 7 tables.
  2. Foreign-key cascading deletes and indexing.
  3. Row Level Security (RLS) policies.
  4. Native PostgREST client health check.
  5. Provenance and status constraint validation.

---

## 4. Acceptance Criteria & Pass/Fail Thresholds

| Gate | Criterion | Target Threshold | Mandatory |
|---|---|:---:|:---:|
| **Unit & Integration** | Automated test suite execution | **100% Pass** (0 Failures, 0 Crashes) | Yes |
| **Linting** | ESLint 9 code quality check | **0 Errors** | Yes |
| **Compilation** | Next.js production build (`next build`) | **Exit code 0** (28/28 routes compiled) | Yes |
| **SSRF Defense** | Private CIDR & Loopback probe rejection | **100% Blocked** | Yes |
| **Secret Hygiene** | Credential leakage in client bundles | **0 Secrets Exposed** | Yes |
| **Data Honesty** | Fabricated scores / mock data in live mode | **0% Fabricated Telemetry** | Yes |
