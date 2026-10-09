# SAFENET: Social Media & Brand Impersonation Monitoring

## 1. Architectural Overview

SAFENET's **Social Media & Brand Impersonation Monitoring** capability protects organizations against brand identity cloning, executive and customer support scams, unauthorized company pages, and lookalike phishing links distributed across major social networks.

The system is engineered as an **evidence-based, API-first threat intelligence pipeline** that never fabricates data or outputs unexplainable "AI says this is fake" claims.

### End-to-End Intelligence Pipeline

```
+-------------------------------------------------------------------+
|                     1. LEGITIMATE BRAND BASELINE                   |
|  - Brand Name & Aliases                                           |
|  - Official Domain & Subdomains                                   |
|  - Whitelisted Official Handles (@X, @IG, YouTube, LinkedIn, FB)   |
|  - Brand Keywords & Authority Terminology                         |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               2. CONTROLLED DISCOVERY QUERY GENERATOR             |
|  - Generates max 8 targeted intent queries per brand:             |
|    "{Brand}", "{Brand} Support", "{Brand} Customer Care",         |
|    "{Brand} Official", "{Brand} Help"                             |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                3. MULTI-SOURCE PROVIDER ADAPTERS                  |
|  - YouTube Data API v3 Adapter                                    |
|  - X (Twitter) API v2 Adapter                                     |
|  - Meta Graph API (Instagram & Facebook) Adapter                  |
|  - LinkedIn Community API Adapter                                 |
|  - SAFENET Synthetic Demo Generator (Strictly marked [DEMO DATA])  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                    4. CANDIDATE NORMALIZATION                     |
|  - Normalized Candidate Schema (Handle, Name, URL, Bio, ExtLinks) |
|  - Cross-platform Deduplication by Handle & Platform Key          |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|            5. IDENTITY & COMBOSQUATTING ANALYSIS ENGINE           |
|  - Damerau-Levenshtein & Token Jaccard String Similarity          |
|  - Combosquatting Affix Detection (_support, -official, _care)    |
|  - Unicode Homoglyph & Confusable Character Scanner               |
|  - Support Scam & Urgent Reversal Bio Intent Extraction          |
|  - Whitelist Handle Verification (Matches official handle -> safe)|
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|      6. REUSED SAFENET DOMAIN INTELLIGENCE ENGINE (url-analyzer)  |
|  - Live DNS Resolution (A, AAAA, MX records)                      |
|  - Official Domain Match vs Unauthorized Destination              |
|  - Lookalike & Combosquatting Domain Scoring                      |
|  - High-Risk TLD Detection (.top, .xyz, .online, .help)           |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                 7. EXPLAINABLE RISK SCORING ENGINE                |
|  - Composite Impersonation Score (0 to 100)                        |
|  - Severity Classification: LOW, MEDIUM, HIGH, CRITICAL          |
|  - Signal-Coverage Confidence Score (0 to 100%)                   |
|  - Concrete Technical Evidence Attribution                        |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|          8. TACTICAL INVESTIGATION CONSOLE & WATCHLIST            |
|  - Interactive Identity Breakdown & External Domain Deep-Dive     |
|  - Watchlist & Triage State Tracking (New, Watchlist, Reviewed)   |
+-------------------------------------------------------------------+
```

---

## 2. Supported Sources & Provider Adapters

SAFENET architects native adapters for 5 major platforms, plus a development sandbox generator:

| Provider | Supported Networks | Adapter Class | Status Indication in UI |
|---|---|---|---|
| **YouTube Data API v3** | YouTube Channels, Handles, Video bios | `YouTubeProvider` | `CONNECTED` or `NOT CONFIGURED` |
| **X (Twitter) API v2** | Twitter / X User Handles, Bios, Links | `XProvider` | `CONNECTED` or `NOT CONFIGURED` |
| **Meta Graph API** | Instagram Business, Facebook Public Pages | `MetaProvider` | `CONNECTED` or `NOT CONFIGURED` |
| **LinkedIn Community API** | LinkedIn Company Pages, Recruitment clones | `LinkedInProvider` | `CONNECTED` or `NOT CONFIGURED` |
| **SAFENET Synthetic Sandbox** | All platforms (local simulation) | `DemoSocialProvider` | `DEMO MODE ACTIVE` |

### Fault Isolation Principle
Each provider executes independently with an isolated `AbortSignal.timeout(6000)` budget. If one provider encounters an API quota, missing token, or rate limit, **the remaining providers continue processing seamlessly**.

---

## 3. Environment Variables

All secrets are kept strictly server-side. **No secret API tokens are ever returned to the client or embedded in client bundles.**

```bash
# Master feature toggle
SOCIAL_MONITORING_ENABLED=true

# Development sandbox mode (serves marked [DEMO DATA] candidates for zero-key evaluation)
SOCIAL_MONITORING_DEMO_MODE=true

# 1. YouTube Data API v3
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
SOCIAL_PROVIDER_YOUTUBE_ENABLED=false

# 2. X (Twitter) API v2
X_BEARER_TOKEN=YOUR_X_BEARER_TOKEN
SOCIAL_PROVIDER_X_ENABLED=false

# 3. Meta Graph API
META_ACCESS_TOKEN=YOUR_META_ACCESS_TOKEN
SOCIAL_PROVIDER_META_ENABLED=false

# 4. LinkedIn Community API
LINKEDIN_ACCESS_TOKEN=YOUR_LINKEDIN_ACCESS_TOKEN
SOCIAL_PROVIDER_LINKEDIN_ENABLED=false
```

---

## 4. How to Obtain Credentials & Enable Providers

Adding credentials later is entirely configuration-driven. **No source code changes are required.**

### 1. YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your project and enable the **YouTube Data API v3**.
3. Under **APIs & Services > Credentials**, create an API Key.
4. Add to `.env.local`:
   ```bash
   YOUTUBE_API_KEY=AIzaSy...
   SOCIAL_PROVIDER_YOUTUBE_ENABLED=true
   ```

### 2. X (Twitter) API v2
1. Go to the [X Developer Portal](https://developer.x.com/).
2. Create a project and app with Read access.
3. Generate an **OAuth 2.0 Bearer Token**.
4. Add to `.env.local`:
   ```bash
   X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAA...
   SOCIAL_PROVIDER_X_ENABLED=true
   ```

### 3. Meta Graph API (Instagram & Facebook)
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a Business app and request `pages_read_engagement` and `instagram_basic` permissions.
3. Generate a System User Access Token.
4. Add to `.env.local`:
   ```bash
   META_ACCESS_TOKEN=EAA...
   SOCIAL_PROVIDER_META_ENABLED=true
   ```

### 4. LinkedIn Community API
1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2. Register your application and request the Community Management API product.
3. Generate an access token with `r_organization_social` scope.
4. Add to `.env.local`:
   ```bash
   LINKEDIN_ACCESS_TOKEN=AQ...
   SOCIAL_PROVIDER_LINKEDIN_ENABLED=true
   ```

---

## 5. Development Demo Mode & Synthetic Data Integrity

When `SOCIAL_MONITORING_DEMO_MODE=true` (or when no external social API keys are configured):
- The `DemoSocialProvider` generates realistic high-risk impersonation patterns (e.g. fake 24/7 refund desks, urgency KYC prompts, toll-free WhatsApp claims).
- **Integrity Guarantee:** Every mock candidate is flagged with `isDemoData: true`, `source: "SAFENET DEMO DATA"`, and display name prefix `[DEMO DATA]`.
- Synthetic data is **never** presented as real internet findings.

To disable demo mode once live API keys are added:
```bash
SOCIAL_MONITORING_DEMO_MODE=false
```

---

## 6. Explainable Risk Scoring Engine

The risk score is a deterministic composite scale from **0 to 100**:

$$\text{Risk Score} = 0.60 \times \text{Identity Mimicry} + 0.40 \times \text{Domain Risk} + \text{Penalties}$$

### Evaluation Factors
1. **Username Similarity (0-45 pts):** Levenshtein edit distance and token overlap against brand name and aliases.
2. **Display Name Mimicry (0-30 pts):** Direct brand name imitation.
3. **Combosquatting (+15 pts boost):** Appendices targeting consumer trust (`_support`, `-official`, `_helpdesk`, `_care`).
4. **Bio Intent & Authority Claims (0-25 pts):** Extraction of support scam keywords ("immediate reversal", "refund grievance", "urgent KYC", "toll-free whatsapp").
5. **External Domain Risk (0-40 pts):** Reuses SAFENET's domain analyzer for lookalike SLD, high-risk TLDs, and unauthorized hosting.
6. **Homoglyph Confusables (+15 pts penalty):** Unicode IDN substitution characters.
### 5-Tier Threat Classification & Severity
- **CRITICAL_THREAT (85 - 100) [Red]:** Immediate impersonation with malicious domain or active refund/credential harvesting.
- **HIGH_RISK (60 - 84) [Orange]:** Strong brand mimicry with unauthorized combosquatting or unverified support claims.
- **SUSPICIOUS (30 - 59) [Yellow]:** Similar branding or fan/recruiter community without direct malicious indicators.
- **LOW_CONCERN (12 - 29) [Blue]:** Benign mention, partner account, or fan community.
- **LIKELY_OFFICIAL (0 - 11) [Green]:** Whitelisted authentic brand asset (hard override to 3/100, confidence 98%).

---

## 7. Reused SAFENET Domain Intelligence

Candidate profiles linking to external websites are sent directly through SAFENET's domain intelligence pipeline (`src/lib/analyzers/domain-analyzer.ts`):
- Checks official domain list from protected brand profile.
- Executes real DNS queries (A, AAAA, MX).
- Analyzes lookalike SLDs and combosquatting patterns.
- Identifies high-risk TLDs (`.top`, `.xyz`, `.online`, `.click`, `.buzz`).
- Results feed directly into candidate evidence without code duplication.

---

## 8. Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/social/providers` | Inspects provider status, health, and demo mode flag |
| `GET` | `/api/social/brands` | Lists all monitored brand identity profiles |
| `POST` | `/api/social/brands` | Registers brand from simple name and auto-triggers discovery |
| `GET` | `/api/social/brands/[id]` | Retrieves brand profile and discovery metrics |
| `POST` | `/api/social/brands/[id]/discover` | Triggers autonomous brand identity & official profile discovery |
| `DELETE` | `/api/social/brands/[id]` | Deletes a monitored brand profile |
| `POST` | `/api/social/brands/[id]/scan` | Triggers perimeter discovery, candidate analysis, and risk scoring |
| `GET` | `/api/social/scans/[id]` | Retrieves historical scan execution report |
| `GET` | `/api/social/candidates` | Lists candidates with filtering (`brandId`, `platform`, `riskLevel`, `status`) |
| `GET` | `/api/social/candidates/[id]` | Retrieves deep candidate investigation evidence |
| `PATCH` | `/api/social/candidates/[id]` | Updates triage status (`new`, `watchlist`, `reviewed`) |

---

## 9. Database Architecture (Supabase & Fallback)

Schema migration: `supabase/migrations/20261008000001_safenet_social_monitoring.sql`

- **`public.brand_monitors`**: Monitored brands, official domains, whitelisted handles, keywords.
- **`public.social_scans`**: Historical scan executions, query variants, execution times, provider metrics.
- **`public.social_candidates`**: Discovered candidates with risk scores, platform handles, and status.
- **`public.social_evidence`**: Technical evidence attribution entries for auditability.
- **Zero-Downtime Fallback:** `src/lib/social/social-store.ts` includes an in-memory/localStorage coordinator, allowing immediate testing and local execution without requiring database setup.

---

## 10. Verification & Test Suite

All tests execute via the Node test runner:
```bash
npm test
```
Or run the dedicated social test suite:
```bash
npx tsx --test tests/social-monitoring.test.mjs
```

The test suite covers:
1. Brand profile creation & normalization
2. Controlled query variant generation
3. Handle normalization & whitespace trimming
4. Name and alias similarity calculations
5. Exact match with registered official handle is recognized and whitelisted (`LIKELY_OFFICIAL`, 3/100)
6. Missing API key handling (`not_configured` without throwing)
7. Pluggable logo analyzer integrity (`not_available` guarantee)
8. External URL & domain intelligence integration
9. Explainable risk engine scoring and evidence generation
10. Synthetic demo candidate tagging (`isDemoData: true`)
11. Candidate deduplication across search iterations
12. Store state & triage status transitions (`watchlist`, `reviewed`)
13. BrandDiscoveryService discovers Nike official identity with multi-signal confidence scoring
14. buildBrandIdentityFingerprint generates normalized authoritative fingerprint
15. generateThreatLookalikeVariants produces mutations without combinatorial explosion
16. Risk Engine assigns explainable 5-Tier Threat Classification
17. Risk assessment returns Section 25 structured evidence model items
