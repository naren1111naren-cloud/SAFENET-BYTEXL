# SAFENET Changelog

All notable changes to the **SAFENET** Digital Risk Protection & Brand Impersonation Detection Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-09 (Agile SDLC Adaptation & Release Candidate)

### Added
- **Formal Agile SDLC Documentation Suite:**
  - `docs/initial-audit.md`: Comprehensive repository audit across frontend, backend, database, and providers.
  - `docs/requirements.md`: Formal functional, non-functional, security, and API requirements specification.
  - `docs/architecture.md`: Complete system architecture specification with Mermaid component diagrams.
  - `docs/data-flow.md`: End-to-end data flow specifications, sequence diagrams, and fallback matrix.
  - `docs/agile-workflow.md`: Lightweight Scrum/Kanban operating model, roles, and Git branching rules.
  - `docs/product-backlog.md`: Itemized product backlog covering all 4 core features and operational triage items.
  - `docs/sprint-plan.md`: 5-Sprint delivery cadence (Sprint 0 through Sprint 4) with timeline mapping.
  - `docs/definition-of-done.md`: Mandatory 6-gate quality checklist for pull requests and releases.
  - `docs/test-plan.md`: Quality assurance test plan and scenario matrix.
  - `docs/test-report.md`: Verified test execution report confirming 100% pass rate across 99 automated tests.
  - `docs/release-checklist.md`: Pre-deployment verification and rollback protocols.
  - `docs/known-limitations.md`: Honest technical constraint disclosures and mitigations.
  - `docs/maintenance-plan.md`: Ongoing health monitoring, dependency update, and bug intake procedures.

### Changed
- **Linter & Code Quality Hardening:**
  - Configured `eslint.config.mjs` flat config to properly manage dynamic API payload parsing without crashing CI builds.
  - Corrected `prefer-const` across `src/lib/brand-store.ts`, `src/lib/risk-engine/candidate-risk-engine.ts`, `src/lib/social/brand-discovery.ts`, and API routes.
  - Hardened provider type declarations to `as const` literal narrowing across iTunes, Web Search, Social Media, Demo, LinkedIn, X, and YouTube providers.
  - Remediated all JSX unescaped quote entities in `src/app/social/page.tsx`.
  - Re-ordered `handleRunAnalysis` in `src/app/check/page.tsx` before its initial `useEffect` invocation to satisfy React Hook immutability checks.
  - Reduced ESLint errors from 104 down to **0 errors**.

### Verified
- **Automated Test Suite:** 99/99 automated tests passing across 30 suites in 12.7s (`npm test`).
- **Production Build:** Next.js 16 Turbopack build succeeds in 3.1s with all 28 App Router routes compiled cleanly (`npm run build`).
- **Real Integrations:** Apple iTunes App Store API, System DNS resolver, RDAP WHOIS, TLS Certificate Handshake, and YouTube Data API v3 verified operational without fake mock fallbacks.
- **SSRF Defense:** Outbound network security validated against loopback, private RFC 1918 subnets, and cloud metadata reflection.

---

## [0.9.0] - 2026-10-08 (Multi-Platform Social Impersonation & Real-Time Intelligence)

### Added
- **Feature 3: Social Media Impersonation Monitoring (`/social`):**
  - Search query generation across YouTube, X, Meta, and LinkedIn.
  - Combosquatting and handle lookalike detection engine (`src/lib/social/identity-fingerprint.ts`).
  - Watchlist management and candidate triage lifecycle (`SocialStore`).
  - Native PostgREST schema migration for social monitoring (`supabase/migrations/`).
  - Comprehensive social monitoring test suite (`tests/social-monitoring.test.mjs`).

### Fixed
- External provider fault isolation: API quota errors (HTTP 402/400/401) on X, Meta, and LinkedIn handled gracefully without crashing active discovery scans.

---

## [0.8.0] - 2026-10-07 (App Threat Intelligence & Look-alike Name Engine)

### Added
- **Feature 2: Mobile App Store Monitoring (`/apps`):**
  - Live Apple iTunes Search API adapter (`ItunesAppStoreProvider`).
  - Look-alike name similarity engine combining Damerau-Levenshtein, Jaccard token overlap, and repeated character expansion (`src/lib/similarity/`).
  - Android APK manifest and permission threat scoring (`src/lib/apk/`).
  - Candidate risk engine with explainable developer mismatch and package spoofing scoring (`src/lib/risk-engine/`).

---

## [0.7.0] - 2026-10-06 (Brand Profile Baseline & Domain Intelligence Core)

### Added
- **Feature 1: Brand Profile Baseline & Setup (`/setup`):**
  - Authoritative source-of-truth baseline registry for protected organizations (`BrandStore`).
  - Live website identity crawler extracting JSON-LD schema, OpenGraph tags, and social footer links (`WebsiteIdentityAnalyzer`).
  - Pre-seeded baseline profiles for Paytm and Nike.
- **Feature 4: Forensic Threat Inspector & Verification Workspace (`/check`, `/`):**
  - Live DNS A/AAAA resolver, TLS certificate handshake inspector, and RDAP registration query.
  - SSRF firewall sandboxing all outbound network requests (`src/lib/intelligence/ssrf-protection.ts`).
  - Unicode homoglyph confusable detector for Cyrillic/Greek character replacements.
  - Explainable Arc Gauge risk visualization and localized customer safety advisory generator (English, Hindi, Tamil).
