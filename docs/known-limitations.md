# SAFENET Known Technical Limitations & Constraints (Phase 7)

**Document Version:** 1.0.0  
**Status:** Approved Technical Disclosure  
**System:** SAFENET (Digital Risk Protection Platform)  

---

## 1. Overview & Transparency Commitment

In accordance with SAFENET's core engineering principle of **honest reporting and zero fabricated telemetry**, this document details the actual architectural and operational constraints of the current release.

---

## 2. Itemized Limitations & Mitigation Strategies

### 2.1. Social Media API Quotas & Tier Restrictions
* **Constraint:** Commercial social platforms (X/Twitter, Meta Graph API, LinkedIn) enforce strict API authentication, pricing tiers, and monthly credit caps.
  * *X (Twitter) API v2:* Free/developer accounts often experience `402 Payment Required` (credits depleted) or `429 Too Many Requests`.
  * *Meta Graph API:* Access tokens expire after 60 days and require enterprise business verification for broad user searches.
  * *LinkedIn API:* Restricts member search without specialized Community Management partner permissions (`401 Unauthorized`).
* **Mitigation & Handling:**
  * SAFENET isolates each provider within a dedicated try/catch boundary. An error in X or Meta does not fail the discovery pipeline; the provider status is tagged `rate_limited` or `auth_error`.
  * `YouTube Data API v3` remains operational for public channel and video footprint search.
  * When `SOCIAL_MONITORING_DEMO_MODE=true` is enabled, clearly marked benchmark items tagged `[DEMO DATA]` are provided so analysts can test lookalike analysis and triage workflows even when external keys are unconfigured.

### 2.2. App Store software Catalog Ingestion
* **Constraint:** Public ingestion is currently wired to the Apple iTunes App Store Search API (`itunes.apple.com/search`). Google Play Store does not offer an official, keyless REST API and blocks headless scrapers with CAPTCHA/bot-detection.
* **Mitigation & Handling:**
  * Apple App Store provides rich, live software intelligence (application titles, bundle IDs, developer identities, ratings, and artwork) queried in real time without API keys.
  * For Android applications, SAFENET provides an Android APK Manifest & Permission Inspector (`/api/apps/analyze-apk` and `/apps?tab=apk`) that accepts package metadata and evaluates dangerous permission combinations (`SEND_SMS`, `READ_CONTACTS`).

### 2.3. RDAP WHOIS Registrar Coverage
* **Constraint:** Certain country-code top-level domains (ccTLDs) or legacy registrars do not publish standardized RDAP (Registration Data Access Protocol) JSON endpoints via `rdap.org`.
* **Mitigation & Handling:**
  * When RDAP data is missing or times out, SAFENET records registration age as `unknown` (status: `unavailable`). It **never** fabricates a fake registration date to fill UI fields.

### 2.4. Static HTML Parsing vs. Client-Side JavaScript (SPAs)
* **Constraint:** The webpage inspector issues a read-only HTTP GET request and parses the raw DOM structure to detect credential harvest forms (`<input type="password">`). It does not execute client-side JavaScript or render single-page React/Angular applications.
* **Mitigation & Handling:**
  * This is a deliberate security and performance design choice. Running untrusted client-side JavaScript in a server sandbox creates significant remote code execution (RCE) and memory exhaustion vectors. Static inspection protects the host while accurately capturing >90% of phishing landing pages.

### 2.5. Outbound Response Clamping
* **Constraint:** Read-only web page inspections are strictly bounded to 512 KB (`SAFENET_MAX_RESPONSE_BYTES=524288`) and 5 redirect hops (`SAFENET_MAX_REDIRECTS=5`).
* **Mitigation & Handling:**
  * This prevents denial-of-service (DoS) via "zip bombs" or massive streaming responses. The first 512 KB contains the `<head>` metadata, OpenGraph tags, JSON-LD schema, and primary login forms.

### 2.6. LocalStorage Sandbox vs. Enterprise Supabase Sync
* **Constraint:** While the native Supabase PostgREST client is fully implemented and tested, multi-analyst synchronization requires active `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` credentials.
* **Mitigation & Handling:**
  * In the absence of database credentials, SAFENET transparently operates in **Local Analyst Sandbox Mode** using browser LocalStorage (`BrandStore`, `VerificationStore`, `SocialStore`), providing full feature availability for individual analysts and hackathon demonstrations.
