# ByteXL Challenge Requirement Mapping

**Project:** SAFENET (Digital Risk Protection Platform)  
**Evaluation Rubric:** ByteXL Cyber Challenge Architecture  
**Status:** 100% Implemented & Verified with Zero Simulated Data Fallbacks

---

## Weightage Breakdown & Feature Mapping

| Rubric Category | Weight | SAFENET Implementation | Verification Evidence |
|---|---|---|---|
| **App Store Monitoring** | **30%** | **Real Apple iTunes Search API Provider** (`ItunesAppStoreProvider`) querying software catalogs via legitimate, keyless, rate-tolerant public APIs. Extracts live application titles, authorized bundle IDs, developer identities, ratings, and artwork. Correlates against official developers and registered package IDs. Detects developer mismatches, package spoofing, and unauthorized clones. | `src/lib/providers/apps/itunes-provider.ts`<br>`src/lib/risk-engine/candidate-risk-engine.ts`<br>`tests/real-intelligence-pipeline.test.mjs` (Scenarios 1, 8, 9) |
| **Social Media Monitoring** | **30%** | **Real Multi-Platform Social Intelligence Provider** (`SocialMediaProvider`). Generates targeted search queries (`site:twitter.com`, `site:t.me`, `site:instagram.com`, `site:linkedin.com/company`) across brand variants ("Support", "Official", "Help", "India"). Extracts genuine public candidate handles, profile URLs, and bios. Compares against official Brand Profile handle allowlists. | `src/lib/providers/social/social-provider.ts`<br>`src/lib/similarity/lookalike-engine.ts`<br>`src/app/api/investigate/route.ts`<br>`tests/real-intelligence-pipeline.test.mjs` (Scenarios 3, 6) |
| **Brand Profile Baseline** | **15%** | **Authoritative Source of Truth** (`BrandProfile` & `/setup`). Manages verified brand identity: primary domain, official domain allowlist (`officialDomains`), verified social handles, authorized mobile app bundle IDs (`authorizedAppIds`), authorized corporate developers (`officialDevelopers`), keywords, and support channels. Acts as the baseline against which all discovered candidates are compared. | `src/types/brand.ts`<br>`src/lib/brand-store.ts`<br>`src/app/setup/page.tsx` |
| **User Experience & Telemetry** | **15%** | **Honest Operational Experience** (Command Center `/overview`, Forensic Dossier `/investigate`, Incident Queue `/incidents`). No arbitrary timer simulations. Direct state-driven status transitions (`INVESTIGATING`, `DISCOVERING`, `ANALYZING`, `COMPLETED`, `NO_RESULTS`, `PROVIDER_UNAVAILABLE`). Dynamic severity distribution and genuine temporal velocity calculation. | `src/app/overview/page.tsx`<br>`src/app/investigate/page.tsx`<br>`src/app/check/page.tsx`<br>`src/app/incidents/page.tsx` |
| **Presentation & Live Demo** | **10%** | **Evidence-First Investigation Trail**. Detailed forensic dossiers explaining *Why SAFENET flagged this* with itemized risk breakdowns (0–100), transparent signal contributions, raw evidence links, and multi-language customer safety advisories. Clean active organization switcher (Nike / Paytm) without polluting production telemetry. | `src/app/investigate/page.tsx`<br>`src/lib/advisory/customer-advisory.ts`<br>`src/lib/takedown/takedown-generator.ts` |
| **Bonus: Look-alike Name Detection** | **Bonus** | **Deterministic Look-alike & Squatting Engine** (`lookalike-engine.ts`). Combines Damerau-Levenshtein edit distance, Token Jaccard similarity, Combosquatting affix analysis, Homoglyph Unicode confusables, repeated character expansion (e.g. `payttm`, `examplle`), and delimiter variations. Generates brand variants deterministically. | `src/lib/similarity/lookalike-engine.ts`<br>`src/lib/similarity/levenshtein.ts`<br>`src/lib/similarity/homoglyphs.ts`<br>`tests/real-intelligence-pipeline.test.mjs` (Scenarios 4, 5, 6, 7) |

---

## Detailed Requirement Alignment

### 1. App Store Monitoring (30%)
- **Objective:** Discover rogue or clone mobile applications impersonating the protected brand.
- **Implementation:**
  - Real query engine hitting `https://itunes.apple.com/search` across query permutations: `"{Brand}"`, `"{Brand} Official"`, `"{Brand} Support"`, `"{Brand} Security"`, `"{Brand} Rewards"`.
  - Normalizes every discovered application to `DiscoveredCandidate`:
    - `appName`, `developerName`, `bundleId`, `storeUrl`, `description`, `iconUrl`, `rating`, `reviewCount`, `discoveredAt`.
  - Compares against Brand Profile `officialDevelopers` and `authorizedAppIds`.
  - Signals:
    - Title similarity: 0–20 points
    - Developer mismatch: 0–15 points (e.g. app called "Paytm Fast Cash" published by "Quick Loan LLC" receives +15 developer mismatch points)
    - Unregistered bundle ID: 0–15 points
    - Verified official app: 0 points (authenticated safe asset)
  - Zero fabricated applications: If none found, displays: *"No matching applications were discovered from the configured sources."*

### 2. Social Media Monitoring (30%)
- **Objective:** Detect fake customer service accounts, impersonation handles, and fraudulent support profiles.
- **Implementation:**
  - `SocialMediaProvider` supports search engine integration (`SERPER_API_KEY`, `TAVILY_API_KEY`, or `BRAVE_API_KEY`).
  - Generates targeted public footprint queries:
    - `(site:twitter.com OR site:x.com) "{Brand}" support`
    - `site:t.me "{Brand}"`
    - `site:instagram.com "{Brand}" support OR official`
    - `site:linkedin.com/company "{Brand}"`
  - Extracts verified candidate username (`@handle`), platform, bio snippet, and URL.
  - Compares extracted handle against registered `brand.handles`:
    - If present in registered inventory: authenticated as official asset (0 risk score).
    - If absent: flagged as unauthorized handle (+20 mismatch points).
  - Unconfigured state: When no search API key is configured, honestly reports `not_configured` without fabricating fake social accounts.

### 3. Brand Profile as Source of Truth (15%)
- **Objective:** Maintain authoritative baseline inventory.
- **Implementation:**
  - Full schema supporting `brandName`, `domain`, `officialDomains`, `handles` (Twitter, Telegram, Instagram, LinkedIn), `appPackageName`, `authorizedAppIds`, `officialDevelopers`, `brandKeywords`, and `officialSupportChannels`.
  - Provides two authoritative baseline profiles (Paytm and Nike) while supporting custom user organizations.
  - Dedicated "START INVESTIGATION" trigger on `/setup` executing real multi-provider discovery against the baseline.

### 4. User Experience & Honest States (15%)
- **Objective:** Professional cyber intelligence analyst workflow without simulated telemetry.
- **Implementation:**
  - Zero hardcoded fallback operators (`|| 8`, `|| 15`, `|| 47` eliminated).
  - Zero fake timer intervals (`setInterval` 280ms eliminated).
  - Hourly activity velocity derived dynamically from actual discovered entity timestamps.
  - Operational triage lifecycle (`New` → `Investigating` → `Confirmed` → `Contained` → `Resolved`).

### 5. Look-alike Name Detection (Bonus Credit)
- **Objective:** Deterministic, explainable detection of brand name mutations.
- **Implementation:**
  - Damerau-Levenshtein transposition distance (catches `pyatm` vs `paytm`).
  - Token Jaccard overlap (catches `Paytm Customer Care Help Desk`).
  - Combosquatting affix analysis (catches `paytm-kyc-verify.xyz`).
  - Homoglyph Unicode confusables (catches Cyrillic `pаytm.com`).
  - Repeated character expansion (catches `payttm`, `examplle`).
  - Delimiter / hyphen variations (catches `pay-tm`).
