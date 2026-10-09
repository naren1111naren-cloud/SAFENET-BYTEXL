# SAFENET Release Readiness Checklist (Phase 7)

**Document Version:** 1.0.0  
**Status:** Pre-Release Quality Gate  
**Target Release:** SAFENET v1.0.0 (Hackathon Release Candidate)  

---

## 1. Pre-Deployment Verification Checklist

Before deploying SAFENET to staging or production environments, the Release Lead and Security Engineer must verify every gate:

### 1.1. Build & Code Quality
- [x] **Linting Gate:** `npm run lint` executes with **0 errors**.
- [x] **Production Build:** `npm run build` succeeds cleanly with Turbopack in < 15 seconds.
- [x] **TypeScript Integrity:** All 28 Next.js App Router routes compile with zero type errors.
- [x] **Dependency Check:** No duplicate or orphaned packages; `package.json` lockfile is consistent.

### 1.2. Automated Testing
- [x] **Test Suite Execution:** `npm test` runs all 6 test suites and reports **99/99 passed (100%)**.
- [x] **SSRF Regression Probes:** Loopback, RFC 1918, and cloud metadata probes are blocked.
- [x] **Provider Resilience:** Unconfigured or rate-limited external APIs degrade gracefully without unhandled exceptions.

### 1.3. Environment Configuration & Secret Hygiene
- [x] `.env.example` provides comprehensive documentation for all configuration variables.
- [x] `.env.local` is strictly excluded from version control via `.gitignore`.
- [x] No hardcoded keys, bearer tokens, or database passwords exist in source files or client bundles.
- [x] Client-facing environment variables use only safe `NEXT_PUBLIC_` prefixes where appropriate (`NEXT_PUBLIC_APP_URL`).

### 1.4. Operational Baseline Verification
- [x] Preset brand baseline profiles (**Paytm** and **Nike**) are verified and pre-seeded.
- [x] Website crawler operational for custom brand domain onboarding on `/setup`.
- [x] Local storage fallback active so analysts can operate without mandatory Supabase keys.

---

## 2. Step-by-Step Deployment Procedure

### 2.1. Local / Demonstration Deployment
```bash
# 1. Clone repository
git clone <repository-url>
cd SAFENET

# 2. Install dependencies
npm install

# 3. Configure environment (optional external keys)
cp .env.example .env.local

# 4. Verify code quality & tests
npm run lint
npm test

# 5. Build production bundle
npm run build

# 6. Start production server
npm start
# -> Access application at http://localhost:3000
```

### 2.2. Containerized / Cloud Deployment (Docker / Vercel)
* **Vercel / Cloud Run:** Set Root Directory to `./`, configure Node.js `20.x`, add optional environment variables (`GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
* **Health Check Probe:** Configure health check against `GET /api/health` (returns `status: "healthy"` and per-provider latency).

---

## 3. Rollback & Emergency Recovery Protocol

In the event of a deployment failure or unexpected runtime regression:
1. **Instant Rollback:** Redeploy the previous verified commit tag (e.g. `git checkout v0.9.x`).
2. **Provider Isolation:** If an external third-party API is experiencing an outage or generating high latency, disable that provider via environment variable (e.g., `SOCIAL_PROVIDER_X_ENABLED=false`). The pipeline automatically isolates the failure.
3. **Database Fallback:** If Supabase PostgreSQL becomes unreachable, the client-side `BrandStore` and `SocialStore` continue functioning seamlessly in LocalStorage sandbox mode without user downtime.
