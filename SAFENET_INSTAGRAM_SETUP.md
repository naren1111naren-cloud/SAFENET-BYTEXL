# SAFENET — Meta & Instagram Setup & Verification Guide

This guide details the step-by-step procedure to configure Meta Graph API credentials for authorized Instagram brand-impersonation monitoring in SAFENET, how to handle Meta Configuration IDs, and how to verify live scans.

---

## 1. Understanding Meta Credentials in SAFENET

| Credential Type | Variable Name | Purpose in SAFENET | Direct API Calls Possible? |
| :--- | :--- | :--- | :--- |
| **Meta Configuration ID** | `META_CONFIG_ID` | Groups permissions for Meta Login dialog (`config_id=...`) | ❌ No (Requires User OAuth Flow) |
| **Meta App ID** | `META_APP_ID` | Identifies your Meta Developer Application | ❌ No (Identifier only) |
| **Meta Access Token** | `META_ACCESS_TOKEN` | User, Page, or System User Bearer token | ✅ Yes (Queries Graph API & Business Discovery) |
| **Caller Instagram ID** | `META_INSTAGRAM_ACCOUNT_ID` | The ID of your connected Instagram Professional account | ✅ Yes (Target for Business Discovery) |

> [!IMPORTANT]
> If you only have a **Meta Configuration ID** (such as `2266934170818569`), SAFENET recognizes it and reports `config_id_only`. To execute live Meta Graph API queries, follow Section 2 below to generate an authorized access token.

---

## 2. Meta Dashboard Configuration (Step-by-Step)

### Step 2.1: Create or Open a Meta Developer App
1. Navigate to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **My Apps** > **Create App**.
3. Select **Business** as the App Type.
4. Set App Display Name (e.g. `SAFENET Brand Protection`).

### Step 2.2: Add Products to the App
1. In the App Dashboard left sidebar, click **Add Product**.
2. Add **Instagram Graph API** (or **Facebook Login for Business**).
3. If using Facebook Login for Business, create a **Configuration** under *Login for Business > Configurations* to obtain a `Configuration ID` (`config_id`).

### Step 2.3: Link Instagram Account to Facebook Page
1. Ensure you have an **Instagram Business or Creator Account**.
2. Open your Facebook Page Settings > **Linked Accounts** > **Instagram**.
3. Connect your Instagram Business Account to the Facebook Page.

### Step 2.4: Required Permissions
Your Meta App and Access Token require the following permissions:
* `instagram_basic` (Read basic profile information and metadata)
* `instagram_manage_insights` (Required for Instagram Business Discovery)
* `pages_show_list` (List Facebook Pages connected to the user)
* `pages_read_engagement` (Read Page and Instagram account associations)

### Step 2.5: Generate Access Token
You have two options for generating an Access Token:

#### Option A: Quick Testing via Graph API Explorer (60-Day Token)
1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App in the top dropdown.
3. In **User or Page Token**, select **User Token**.
4. Add permissions: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
5. Click **Generate Access Token** and approve the dialog.
6. To extend to a 60-day token:
   * Open [Access Token Tool / Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
   * Paste the short-lived token and click **Extend Access Token**.

#### Option B: Enterprise / Production System User Token (Never Expires)
1. In [Meta Business Suite / Business Settings](https://business.facebook.com/settings/), navigate to **Users** > **System Users**.
2. Click **Add** and create an Admin System User.
3. Click **Add Assets** to assign your Facebook Page and Instagram Account to the System User.
4. Click **Generate New Token**, select your App, and choose `instagram_basic`, `instagram_manage_insights`, `pages_show_list`.
5. Copy the generated permanent System User Token.

---

## 3. Environment Configuration (`.env.local`)

Create or update `.env.local` in your SAFENET root directory:

```env
# ==============================================================================
# SAFENET Social Media & Instagram Impersonation Monitoring
# ==============================================================================
SOCIAL_MONITORING_ENABLED=true
SOCIAL_MONITORING_DEMO_MODE=false

# 1. Meta Graph API Configuration
META_ACCESS_TOKEN=EAAB...your_authorized_access_token...
META_CONFIG_ID=2266934170818569
META_APP_ID=your_meta_app_id
META_INSTAGRAM_ACCOUNT_ID=your_connected_instagram_business_account_id
SOCIAL_PROVIDER_META_ENABLED=true

# 2. Public Candidate Discovery Search Fallback (Optional but Recommended)
# When configured, SAFENET searches public search engine indexes for Instagram lookalikes
SERPER_API_KEY=your_serper_api_key
# or TAVILY_API_KEY=your_tavily_api_key
# or SERPAPI_KEY=your_serpapi_key

# 3. Other Social Providers (Optional)
YOUTUBE_API_KEY=
X_BEARER_TOKEN=
LINKEDIN_ACCESS_TOKEN=
```

---

## 4. Verification & Testing Procedure

### 4.1 Automated Test Suite
Run the test suites from your terminal:
```bash
# Run specialized Instagram test suite
npx tsx --test tests/instagram-impersonation.test.mjs

# Run full social monitoring test suite
npx tsx --test tests/social-monitoring.test.mjs

# Run complete SAFENET verification
npm test
```

### 4.2 Endpoint Health & Readiness Check
Test credential readiness via HTTP:
```bash
curl http://localhost:3000/api/social/instagram/status
```
Expected response when Configuration ID only is configured:
```json
{
  "success": true,
  "readiness": {
    "status": "config_id_only",
    "isConnected": false,
    "hasAccessToken": false,
    "hasConfigId": true,
    "maskedConfigId": "...8569",
    "capabilities": {
      "businessDiscovery": false,
      "pageInspection": false,
      "searchFallbackAvailable": true
    },
    "message": "Meta Configuration ID is present, but no Meta User or Page Access Token is configured."
  }
}
```

### 4.3 Testing Live Discovery in SAFENET UI
1. Open SAFENET in your browser: `http://localhost:3000/social`.
2. Enter a monitored brand (e.g. `Nike`, `Paytm`, or your custom enterprise brand).
3. Click **Investigate Perimeter**.
4. Observe:
   * **Stage 1-3**: Brand Identity baseline & authoritative digital fingerprint.
   * **Stage 4-5**: Instagram candidate discovery via authorized Business Discovery & search engine fallback.
   * **Stage 6**: Multi-factor explainable risk scoring with 5-Tier Threat Classification (`LIKELY_OFFICIAL`, `LOW_CONCERN`, `SUSPICIOUS`, `HIGH_RISK`, `CRITICAL_THREAT`).
5. Click on any candidate card to view the **Deep Threat Drawer** detailing lexical similarity, combosquatting affixes, bio claims, external URL safety scores, and structured evidence.

---

## 5. Scope & Capabilities Boundary

* **Business Discovery Scope**: Meta's Instagram Business Discovery endpoint allows querying public Business and Creator accounts only. It cannot inspect private or personal accounts.
* **Public Search Indexing**: For broader lookalike detection, SAFENET leverages public search indexing (Google / Serper / Tavily / SerpApi) querying `site:instagram.com` without web scraping.
* **Screening Signal Context**: SAFENET risk scores represent technical screening indicators to prioritize analyst triage; they are not automated legal declarations of wrongdoing.
