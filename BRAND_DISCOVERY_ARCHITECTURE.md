# SAFENET: Brand Discovery & Impersonation Engine Architecture

## 1. Architectural Mission

The SAFENET **Brand Discovery & Impersonation Engine** implements an autonomous, evidence-driven Digital Risk Protection (DRP) workflow. 

Rather than requiring security analysts to manually hunt across APIs, memorize syntax, or configure social handles by hand, SAFENET establishes a zero-configuration investigation workflow:

```
USER ENTERS BRAND (e.g. "Nike")
        ↓
BRAND DISCOVERY ENGINE
        ↓
ESTABLISH TRUSTED OFFICIAL IDENTITY (Multi-signal confidence scoring 0-100%)
        ↓
BUILD BRAND IDENTITY FINGERPRINT (Canonical baseline & whitelisted entities)
        ↓
SEARCH FOR SIMILAR / SUSPICIOUS ENTITIES (Dynamic lookalike variant generator)
        ↓
ANALYZE IDENTITY + BRANDING + LINKS (Reusing existing SAFENET domain engine)
        ↓
CALCULATE EXPLAINABLE RISK (5-tier threat classification & structured evidence)
        ↓
THREAT LANDSCAPE & INVESTIGATION CONSOLE
```

---

## 2. Brand Discovery Service

### Workflow & Discovery Inputs
The user inputs only a brand name:
```
[ Nike ]   [ Investigate Brand ]
```
*(Optional website or handles can be provided, but are completely optional).*

The `BrandDiscoveryService` (`src/lib/social/brand-discovery.ts`) initiates discovery by:
1. **Authoritative Enterprise Baselines**: Checks known enterprise registries for top monitored entities (Nike, Paytm, HDFC Bank, PayPal, Microsoft) providing deterministic canonical references.
2. **Authoritative Domain & Schema Discovery**:
   - Resolves canonical brand domain (`nike.com`).
   - Fetches live website homepage via `inspectHttpEndpoint` with strict SSRF controls.
   - Extracts JSON-LD `Organization` schemas and `sameAs` attributes containing verified official social links (`x.com/nike`, `youtube.com/@nike`, `instagram.com/nike`, `linkedin.com/company/nike`).
3. **Platform Canonical Handle Synthesis**:
   - Assembles canonical handles across 5 major networks: YouTube, X, Instagram, Facebook, and LinkedIn.
4. **Multi-Signal Confidence Evaluation**:
   - Every candidate profile is evaluated across 6 deterministic technical signals before being labeled official.

---

## 3. Official Identity Verification Engine

Official identity is **never** determined by name similarity alone. SAFENET evaluates an explainable multi-signal confidence model:

$$\text{Confidence} = \sum (\text{Signal Weight} \times \text{Match Ratio})$$

### Evaluated Signals & Weighting

| Signal | Description | Weight |
|---|---|---|
| **A. Brand Name Similarity** | Levenshtein & token alignment between query and profile display name. | 15% |
| **B. Username Similarity** | Normalized handle overlap with canonical brand identifier. | 20% |
| **C. Website Relationship** | Profile links directly to official domain OR verified via website `sameAs` JSON-LD schema. | 25% |
| **D. Cross-Platform Consistency** | Handle matches identical identity across multiple official social profiles. | 15% |
| **E. Branding Consistency** | Brand keywords, slogans ("Just Do It"), and corporate descriptions present in bio. | 10% |
| **F. Platform Verification Badge** | Provider-confirmed verified badge or partner credential. | 15% |

### Candidate Confidence Example: Nike

```json
{
  "platform": "youtube",
  "name": "Nike",
  "username": "@nike",
  "url": "https://www.youtube.com/@nike",
  "confidence": 98,
  "verificationReason": "Authenticated handle directly linked to official domain nike.com.",
  "signals": {
    "nameSimilarity": 100,
    "usernameSimilarity": 100,
    "websiteRelationship": true,
    "crossPlatformConsistency": true,
    "brandingConsistency": 100,
    "isVerifiedBadge": true
  },
  "isPrimaryOfficial": true
}
```

---

## 4. Brand Identity Fingerprint

Upon discovery completion, SAFENET builds a standardized **Brand Identity Fingerprint** (`src/lib/social/identity-fingerprint.ts`) stored in the database as the reference baseline:

```typescript
export interface BrandIdentityFingerprint {
  brandName: string;
  aliases: string[];
  officialDomains: string[];        // ['nike.com', 'www.nike.com', '*.nike.com']
  officialUsernames: string[];      // ['nike', 'snkrs', 'nikestore']
  officialSocialAccounts: Partial<Record<SocialPlatform, string>>;
  knownKeywords: string[];          // ['Nike', 'Just Do It', 'Air Jordan']
  knownExternalLinks: string[];     // ['https://www.nike.com']
  visualIdentity?: string;          // 'Nike Swoosh logo'
  officialProfiles: OfficialProfileCandidate[];
  confidence: number;               // 95-98%
  evidence: EvidenceItem[];
  generatedAt: string;
}
```

---

## 5. Threat Lookalike Variant Generator

To detect potential impersonators, phishing campaigns, and combosquatting schemes, SAFENET automatically generates targeted queries and lookalike mutations without combinatorial explosion:

1. **Brand Aliases & Primary Names**: Canonical brand variants.
2. **Authority & Combosquatting Suffixes**:
   - `_support`, `-support`, `_helpdesk`, `_care`, `_official`, `_store`, `_india`, `_global`
3. **Typosquatting & Transpositions**:
   - Character omission (e.g. `nik` for `nike`)
   - Character duplication (e.g. `nikke`, `payttm`)
   - Homoglyph / numeric leetspeak substitutions (`0` for `o`, `1` for `l` or `i`)
4. **Authority Prefixes**:
   - `official_`, `my_`, `get_`, `the_`

Bounded search sets guarantee that provider API limits and quotas are strictly respected.

---

## 6. Social Provider Adapters & Resilience

SAFENET interacts with external platforms through modular provider classes implementing `SocialProviderAdapter`:

- **YouTube Data API v3** (`YouTubeProvider`): Searches channels, parses custom URLs, extracts video description links and subscriber metrics.
- **X (Twitter) API v2** (`XProvider`): Searches user profiles, handles, bios, and t.co expanded URLs.
- **Meta Graph API** (`MetaProvider`): Queries permitted Instagram business accounts and public Facebook pages.
- **LinkedIn Community API** (`LinkedInProvider`): Queries public enterprise entities where permitted.
- **SAFENET Synthetic Sandbox** (`DemoSocialProvider`): High-fidelity benchmark simulator for security validation and offline demonstrations.

### Real Status Reporting
Provider status is strictly determined through live API handshakes:
- `CONNECTED` (HTTP 200 health check)
- `NOT_CONFIGURED` (Missing environment key)
- `RATE_LIMITED` (HTTP 429)
- `UNAUTHORIZED` (HTTP 401/403)
- `ERROR` (Network or parsing failure)

If any provider fails or hits a rate limit, **discovery continues across all remaining operational providers**.

---

## 7. Reused SAFENET Domain & URL Intelligence

When a discovered social candidate profile contains an external link in its bio, header, or pinned post:

```
Candidate: @nike_support_24x7
External URL: https://nike-refund-claim.xyz/verify
```

SAFENET passes the URL directly into the **existing core domain analyzer** (`src/lib/analyzers/domain-analyzer.ts` & `src/lib/intelligence/*`):
- **DNS Resolution**: Live lookup of A, AAAA, MX records to confirm host existence.
- **SSRF Protection**: `validateSafeTarget` blocks loopback, private IPv4/IPv6, and AWS/GCP metadata endpoints (`169.254.169.254`).
- **Domain Age & RDAP**: Flags newly registered domains (<30 days old).
- **Combosquatting & Levenshtein Distance**: Flags similarity to `nike.com` combined with suspicious keywords (`refund`, `kyc`, `login`).
- **Suspicious TLD Scoring**: Elevated risk contribution for `.xyz`, `.top`, `.online`, `.club`.

---

## 8. 5-Tier Threat Classification & Risk Scoring

Candidates are evaluated through an explainable multi-factor scoring model and classified into 5 discrete tiers:

| Score Range | Threat Classification | Badge Color | Interpretation |
|---|---|---|---|
| **0 – 11** | `LIKELY_OFFICIAL` | Green | Authenticated brand channel or whitelisted official profile. |
| **12 – 29** | `LOW_CONCERN` | Blue | Fan account, news aggregator, or partner with clear attribution. |
| **30 – 59** | `SUSPICIOUS` | Yellow | Unverified lookalike handle or brand mimicry without external malicious links. |
| **60 – 84** | `HIGH_RISK` | Orange | High name/handle mimicry + customer support intent + unverified credentials. |
| **85 – 100** | `CRITICAL_THREAT` | Red | Severe impersonation combining combosquatting handles with malicious external domains. |

---

## 9. Section 25 Structured Evidence Model

Every risk finding adheres to the Section 25 normalized evidence model:

```json
{
  "signal": "username_similarity",
  "value": "0.85",
  "severity": "HIGH",
  "source": "TWITTER Discovery",
  "explanation": "Username closely resembles the official brand identity \"Nike\" (85% similarity)."
}
```

Investigators can audit every technical signal in the Investigation Console drawer with full traceability.

---

## 10. Strict Evidence Baseline & Anti-Fabrication Guarantees

SAFENET enforces the core architectural invariant:

$$\text{USER INPUT} \neq \text{VERIFIED IDENTITY} \quad\wedge\quad \text{DISCOVERED RESULT} \neq \text{OFFICIAL ACCOUNT} \quad\wedge\quad \text{SIMILARITY} \neq \text{IMPERSONATION}$$

### Key Guarantees:
1. **No Assumptive Creation**: Arbitrary user inputs (e.g., `nceck`) are never assigned `.com` domains or `@brand` handles. If live DNS or verified registries cannot establish legitimate existence, identity status remains `UNVERIFIED` (0% confidence).
2. **Blocked Threat Discovery on Unverified Identities**: Lookalike discovery and threat scanning are strictly disabled when identity status is `UNVERIFIED`. The system displays:
   > *"SAFENET could not establish a trusted digital identity for this brand from the available sources."*
3. **No Fabricated Confidence**: Hardcoded 99% scores are completely eliminated. Verification confidence is calculated strictly from empirical signals (+25 official website, +25 cross-link, +20 reverse link, +15 platform badge, +10 business contact, +5 brand similarity).
4. **Honest Provider Failure Reporting**: Provider failures or missing credentials (Meta, X, LinkedIn) produce clear, honest statuses (`UNAUTHORIZED`, `CREDITS UNAVAILABLE`, `ACCESS NOT AVAILABLE`) without fabricating candidate accounts.
5. **Strict Demo Data Isolation**: Demo mode is disabled by default and only activates if `SOCIAL_MONITORING_DEMO_MODE=true` is explicitly provided. All synthetic data is permanently tagged with `isDemoData: true`, source `SAFENET DEMO DATA`, and visual `[DEMO DATA]` badges.

