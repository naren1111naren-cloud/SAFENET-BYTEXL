# SAFENET Implementation Plan: Trusted Brand Identity + Impersonation Discovery Engine

## 1. Current Architecture Overview

SAFENET is an enterprise Digital Risk Protection platform built with:
- **Frontend:** Next.js 16.3.8 (App Router, Turbopack), React 19, Tailwind CSS v4, Lucide React icons.
- **Backend:** Next.js Route Handlers (`src/app/api/...`), TypeScript server runtime.
- **Data Persistence:** Supabase PostgreSQL with Row Level Security (`supabase/migrations/`) combined with native in-memory/localStorage fault-tolerant coordinators (`src/lib/social/social-store.ts`, `src/lib/brand-store.ts`).
- **Design System:** Tactical intelligence console aesthetic (`#0A0D12` background, slate-900/950 containers, emerald/amber/rose/purple risk badges, monospace typography for telemetry, AppShell layout).

---

## 2. Existing Reusable Components & Subsystems

1. **URL & Domain Intelligence Engine:**
   - `src/lib/analyzers/domain-analyzer.ts`: Parses hostnames, TLDs, SLDs, runs DNS lookups (`lookupDns`), checks official registries, computes lookalike risk, homoglyphs, and high-risk TLD penalties.
   - `src/lib/intelligence/url-normalizer.ts`: Multi-part public suffix calculation (`co.uk`, `co.in`), canonical domain extraction.
   - `src/lib/intelligence/safe-target.ts`: Server-Side Request Forgery (SSRF) boundary validation.
2. **Deterministic Similarity Engines:**
   - `src/lib/similarity/levenshtein.ts`: Levenshtein & Damerau-Levenshtein edit distance, prefix/suffix combosquatting analysis (`analyzePrefixSuffixAdditions`).
   - `src/lib/similarity/homoglyphs.ts`: Unicode confusable and Cyrillic/Greek IDN substitution analyzer (`analyzeHomoglyphs`).
   - `src/lib/similarity/lookalike-engine.ts`: Token Jaccard similarity, repeated character detection (`detectRepeatedCharacters`), lookalike scoring (`evaluateLookalikeMatch`).
3. **Authoritative Website Identity Extraction:**
   - `src/lib/analyzers/website-identity-analyzer.ts`: Parses JSON-LD Organization schemas, `sameAs` social arrays, OpenGraph assets, and legal names.
4. **Social Provider Adapters:**
   - `src/lib/social/providers/`: YouTube, X, Meta (Instagram & Facebook), LinkedIn, and Demo sandbox adapters.
5. **UI Shell & Navigation:**
   - `src/components/AppShell.tsx` and `src/components/Navbar.tsx`: Standardized console layout with `Social & Brand` route.

---

## 3. Existing Social Monitoring Functionality

- Provider config inspection (`src/lib/social/config.ts`) recognizing `YOUTUBE_API_KEY`, `X_BEARER_TOKEN`, `META_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`.
- Providers implement independent error isolation (`AbortSignal.timeout(6000)`).
- Candidate normalization into `SocialCandidate`.
- Multi-factor identity analysis in `src/lib/social/identity-analyzer.ts`.
- External URL analysis reusing `domain-analyzer.ts` in `src/lib/social/url-analyzer.ts`.

---

## 4. Missing Pieces & Enhancements Required

1. **Zero-Configuration User Input Flow ("Just Enter Brand Name"):**
   - Current flow requires or expects users to know and input official websites and social handles.
   - **Required:** The primary experience must allow the user to simply enter `"Nike"`, click `[ Investigate Brand ]`, and let SAFENET autonomously discover the trusted identity.
2. **Brand Discovery & Official Identity Verification Service:**
   - Need an autonomous **Brand Discovery Engine** (`src/lib/social/brand-discovery.ts`).
   - Automatically searches web/APIs for official brand website and handles.
   - Computes multi-signal **Official Identity Confidence** (0–100%) using:
     - Name similarity
     - Username similarity
     - Cross-platform consistency
     - Domain authority
     - Description / branding keywords
     - Evidence attribution behind the confidence score.
3. **Trusted Brand Profile & Identity Fingerprint Engine:**
   - Need `src/lib/social/identity-fingerprint.ts` creating the normalized `BrandIdentityFingerprint`:
     `{ brandName, aliases, officialDomains, officialUsernames, officialSocialAccounts, knownKeywords, knownExternalLinks, visualIdentity, officialProfiles, confidence, evidence }`.
4. **Enhanced Lookalike Threat Discovery Engine:**
   - Need `src/lib/social/threat-discovery.ts` generating comprehensive lookalike variants:
     - case variations, underscores, hyphens, prefixes, suffixes
     - support terms (`support`, `care`, `help`, `desk`)
     - location terms (`india`, `us`, `global`)
     - store/e-commerce terms (`store`, `shop`, `outlet`)
     - character substitutions, transpositions, and repeated chars.
5. **5-Tier Threat Classification & Evidence Model:**
   - Updating `src/lib/social/risk-engine.ts`:
     - GREEN: `Likely Official`
     - BLUE: `Related / Low Concern`
     - YELLOW: `Suspicious`
     - ORANGE: `High-Risk Potential Impersonation`
     - RED: `Critical Threat`
   - Explicit evidence schema: `{ signal, value, severity, source, explanation }`.
6. **Redesigned Investigation Experience in UI (`src/app/social/page.tsx`):**
   - Step 1: Single input: `[ Enter brand name: "Nike" ] [ Investigate Brand ]`
   - Step 2: Live multi-stage scan progress (Discovering Brand Identity -> Verifying Official Profiles -> Building Fingerprint -> Searching Lookalikes -> Analyzing Links -> Calculating Risk).
   - Step 3: Official Identity Section displaying confidence percentage, verification signals, and discovered official profiles.
   - Step 4: Threat Landscape Metrics & Filters (Likely Official, Low Concern, Suspicious, High Risk, Critical Threat).
   - Step 5: Investigation Feed with deep threat investigation drawer showing link intelligence and concrete evidence.

---

## 5. Exact Files That Will Be Modified

1. `src/lib/social/types.ts`: Extend with `BrandIdentityFingerprint`, `OfficialProfileCandidate`, `ThreatClassification`, and structured `EvidenceItem`.
2. `src/lib/social/discovery-engine.ts`: Refactor to coordinate two distinct phases: Phase 1 (Official Identity Discovery) and Phase 2 (Threat / Lookalike Discovery).
3. `src/lib/social/risk-engine.ts`: Implement 5-tier threat classification and structured evidence model.
4. `src/lib/social/social-store.ts`: Support storing `BrandIdentityFingerprint`, official profile confidence, and threat landscape statistics.
5. `src/app/api/social/brands/route.ts`: Support creating brands with single `brandName` input and auto-initiating discovery.
6. `src/app/api/social/brands/[id]/scan/route.ts`: Support two-phase execution: establishing trusted identity fingerprint followed by lookalike threat discovery.
7. `src/app/social/page.tsx`: Transform into the Digital Risk Investigation console matching Sections 19–24.
8. `tests/social-monitoring.test.mjs`: Add tests for brand discovery, identity confidence scoring, fingerprint generation, threat classification tiers, and single-input flow.

---

## 6. New Files Required

1. `src/lib/social/brand-discovery.ts`: Autonomous official brand identity discovery and confidence evaluation engine.
2. `src/lib/social/identity-fingerprint.ts`: Brand Identity Fingerprint builder and lookalike variant synthesizer.
3. `src/app/api/social/brands/[id]/discover/route.ts`: Dedicated API endpoint for discovering and scoring official digital identities.
4. `BRAND_DISCOVERY_ARCHITECTURE.md`: Complete documentation of the Brand Discovery & Official Identity Verification system.
5. `IMPLEMENTATION_REPORT.md`: Comprehensive audit report of all changes.

---

## 7. Implementation Execution Roadmap

- **Phase A:** Create `BrandIdentityFingerprint` and `OfficialProfileCandidate` types in `src/lib/social/types.ts`.
- **Phase B:** Implement `src/lib/social/brand-discovery.ts` (multi-signal confidence scoring).
- **Phase C:** Implement `src/lib/social/identity-fingerprint.ts` (fingerprint builder & lookalike generator).
- **Phase D:** Enhance `src/lib/social/risk-engine.ts` with 5-tier threat classification and evidence model.
- **Phase E:** Implement `/api/social/brands/[id]/discover` and update `/api/social/brands/[id]/scan`.
- **Phase F:** Redesign `src/app/social/page.tsx` for the single-input "Enter Brand Name" -> Official Identity -> Threat Landscape workflow.
- **Phase G:** Update tests in `tests/social-monitoring.test.mjs` and execute end-to-end verification for Nike.
- **Phase H:** Create documentation files (`BRAND_DISCOVERY_ARCHITECTURE.md`, `IMPLEMENTATION_REPORT.md`, update `SOCIAL_MONITORING.md`).
