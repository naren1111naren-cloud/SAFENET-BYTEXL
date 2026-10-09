# SAFENET — Look-alike Name Detection and False-Positive Reduction
## Phase 1 Audit & Implementation Plan

### 1. Existing System Audit Findings
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide icons.
- **Backend**: Next.js Route Handlers (`src/app/api/*`), Node.js runtime.
- **Database**: Supabase PostgREST client (`src/lib/supabase/client.ts`), PostgreSQL migrations in `supabase/migrations/`, dual-mode fallback to in-memory/localStorage (`BrandStore`, `SocialStore`).
- **Existing Similarity Code**: `src/lib/similarity/` contains `levenshtein.ts`, `homoglyphs.ts`, and `lookalike-engine.ts`. Currently lacks Jaro-Winkler, adaptive length thresholds, comprehensive confusable scripts, dictionary protection, and explicit allowlist registry.
- **Risk Scoring**: `candidate-risk-engine.ts` and `explainable-risk-engine.ts`. We need a unified look-alike risk scoring engine with the four specified bands (0–29 Low concern, 30–59 Needs review, 60–79 Suspicious, 80–100 High priority) that separates name similarity from threat risk.
- **Integrations**: Social monitoring (`/social`), App threat intelligence (`/apps`), Threat inspector (`/check`), Brand configuration (`/setup`). All 101 existing unit tests currently pass.

### 2. Implementation Architecture
1. **Detection Engine (`src/lib/similarity/`)**:
   - `jaro-winkler.ts`: Jaro and Jaro-Winkler distance and similarity implementation.
   - `unicode-normalizer.ts`: Safe NFKC normalization, whitespace/delimiter stripping, confusable character mapping with mixed-script detection and safeguards against indiscriminate normalization.
   - `keywords.ts`: Added-word and suspicious affix analyzer (Support, Official, Help, Security, Customer Care, etc.).
   - `lookalike-engine.ts`: Upgraded with Damerau-Levenshtein, Jaro-Winkler, length-adaptive thresholds, variation classification, and 100% backward compatibility for existing callers.
2. **False-Positive Reduction & Registry (`src/lib/similarity/`)**:
   - `legitimate-registry.ts`: Explicit brand asset registry supporting official handles, profile URLs, domains, aliases, package IDs, and authorized developers.
   - Dictionary protection for short brand names (<= 4 chars) and common English words (preventing false alerts on words like "bike" vs "nike").
   - `lookalike-risk-engine.ts`: Multi-factor 0–100 risk scoring with independent contextual evidence, capping similarity-only signals, and applying the 4 calibrated bands.
   - `review-store.ts`: Feedback and review decision persistence (Legitimate, Suspicious, Confirmed Impersonation) with Supabase + localStorage dual-layer support.
3. **API & Monitoring Integrations**:
   - `src/app/api/lookalike/route.ts`: Dedicated Look-alike detection endpoint.
   - `src/app/api/lookalike/review/route.ts`: Review decision persistence.
   - Integration with `/api/check`, `/api/social/candidates`, and app monitoring.
4. **User Interface (`src/app/check/page.tsx`)**:
   - Interactive Look-alike Name Detection workbench with brand selection, candidate input, optional platform/URL, real-time comparison, distinct similarity vs risk gauges, variation badges, allowlist status, and review decision actions.
5. **Database Migration**:
   - `supabase/migrations/20261009000000_safenet_lookalike_detection.sql`: Tables for `lookalike_reviews` and `brand_allowlists`.
6. **Automated Testing & Documentation**:
   - `tests/lookalike-detection.test.mjs`: Comprehensive suite testing exact matches, character operations, confusables, short names, allowlisting, missing data, and precision/recall calculations on a benchmark dataset.
   - `LOOKALIKE_DETECTION_REPORT.md`: Comprehensive final engineering report.
