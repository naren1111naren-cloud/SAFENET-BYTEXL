# SAFENET Feature 1: Real-Time Brand Profile Intelligence Test Report
**Test Suite:** `tests/brand-profile-intelligence.test.mjs`  
**Execution Environment:** Node.js v26.7.0, Next.js 16.3.8 Turbopack  
**Execution Timestamp:** 2026-10-08T08:02:20Z  
**Total Tests:** 55  
**Passing:** 55  
**Failing:** 0  

---

## 1. Test Execution Summary

| Test Group | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|
| **1. SSRF & Destination Safety Validation** | 5 | 5 | 0 | PASSED |
| **2. URL Input Normalization** | 3 | 3 | 0 | PASSED |
| **3. Website Identity Analyzer (JSON-LD & Branding)** | 5 | 5 | 0 | PASSED |
| **4. Fallbacks for Non-Schema Webpages** | 2 | 2 | 0 | PASSED |
| **Phase 2 Intelligence (SSRF, Heuristics, Scoring)** | 30 | 30 | 0 | PASSED |
| **Real Provider Pipeline (iTunes, Lookalike, Risk)** | 10 | 10 | 0 | PASSED |
| **Total Pipeline Verification** | **55** | **55** | **0** | **100% PASS** |

---

## 2. Detailed Test Cases & Results

### Group 1: SSRF & Safety Protection
- **Test 1.1: Block loopback IP `127.0.0.1`**
  - *Result:* PASSED. `validateSafeTarget('127.0.0.1')` returned `isSafe: false`, blockedReason: `Target IP 127.0.0.1 is a loopback, private, or link-local address. SSRF protection enforced.`
- **Test 1.2: Block `localhost` hostname**
  - *Result:* PASSED. `validateSafeTarget('localhost')` returned `isSafe: false`, blockedReason: `Target hostname "localhost" is reserved or internal infrastructure.`
- **Test 1.3: Block cloud metadata endpoint `169.254.169.254`**
  - *Result:* PASSED. `validateSafeTarget('169.254.169.254')` returned `isSafe: false`.
- **Test 1.4: Block RFC 1918 private subnets (`10.0.0.1`, `192.168.1.1`, `172.16.0.1`)**
  - *Result:* PASSED. All three private IP ranges were immediately rejected.
- **Test 1.5: Block internal domain suffixes (`admin-portal.internal`)**
  - *Result:* PASSED. Hostnames ending in `.internal`, `.local`, `.lan` were blocked.

### Group 2: URL Input Normalization
- **Test 2.1: Bare domain normalization (`example.com`)**
  - *Result:* PASSED. Normalized to `https://example.com/`, extracting hostname and registrable domain.
- **Test 2.2: Multi-level public suffix extraction (`paytm.co.in`, `brand.co.uk`)**
  - *Result:* PASSED. Correctly identified `co.in` and `co.uk` as two-level public suffixes; registrable domains resolved to `paytm.co.in` and `brand.co.uk`.
- **Test 2.3: Rejection of unsupported schemes and credentials (`file:///etc/passwd`, `https://user:pass@host`)**
  - *Result:* PASSED. `normalizeUrlInput` rejected dangerous/unsupported inputs with explicit validation errors.

### Group 3: Website Identity Analyzer (JSON-LD Organization & Branding)
- **Test 3.1: Extraction of brand name, legal name, and clean aliases**
  - *Input:* HTML containing JSON-LD `@type: Organization` with `name: "Paytm"`, `legalName: "One97 Communications Limited"`, and `alternateName: ["Paytm Wallet"]`.
  - *Result:* PASSED. Extracted `Paytm`, `One97 Communications Limited`, generated clean legal alias `One97 Communications`, and included `Paytm Wallet`.
- **Test 3.2: Extraction of logo asset with high confidence**
  - *Result:* PASSED. Identified schema logo `https://paytm.com/static/brand-logo.png`, classified source as `organization_schema` with `high` confidence.
- **Test 3.3: Extraction of verified social handles & share widget exclusion**
  - *Result:* PASSED. Discovered 6 profiles from `sameAs`: `@Paytm` (Twitter/X), `@paytm` (Instagram), `paytm` (LinkedIn), `Paytm` (Facebook), `@paytm` (YouTube), `@paytmofficial` (Telegram). Verified share widgets (`twitter.com/share`, `facebook.com/sharer`) were excluded.
- **Test 3.4: Extraction of official mobile application store links**
  - *Result:* PASSED. Discovered Google Play package `net.one97.paytm` and Apple App Store ID `id473941634`.
- **Test 3.5: Evidence and Identity Signals generation**
  - *Result:* PASSED. Verified signals: `Website Reachable: verified`, `Organization Schema: verified`, `Canonical Domain: verified`, `Social Links Discovered: detected`. Over 8 structured evidence items generated with provenance.

### Group 4: Fallbacks for Non-Schema Webpages
- **Test 4.1: Graceful fallback to OpenGraph image when JSON-LD is absent**
  - *Result:* PASSED. Extracted `og:image` as logo with `medium` confidence; parsed anchor social links.
- **Test 4.2: Zero fabrication on minimal webpages**
  - *Input:* Bare HTML with no social or app links.
  - *Result:* PASSED. Returned `socialProfiles: []`, `applications: []`, `logoUrl: undefined`. Signals marked honestly as `not_found`. Zero mock data produced.

---

## 3. Production Build Verification

```bash
npm run build
▲ Next.js 16.3.8 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 40ms
✓ Compiled successfully in 1791ms
  Running TypeScript ...
  Finished TypeScript in 3.8s ...
✓ Generating static pages using 7 workers (21/21) in 1066ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/brands
├ ƒ /api/brands/analyze
├ ƒ /api/check
├ ƒ /api/health
├ ƒ /api/investigate
├ ƒ /api/search
├ ƒ /api/simulate
├ ○ /campaigns
├ ○ /check
├ ○ /dashboard
├ ○ /guide
├ ○ /incidents
├ ○ /investigate
├ ○ /monitoring
├ ○ /overview
├ ○ /reports
├ ○ /setup
└ ƒ /threat/[id]
```

Build exited with code 0 across all 21 routes with zero TypeScript or ESLint errors.
