# 🛡️ SAFENET — AI-Powered Digital Trust Platform

> **"Check before you trust."**  
> *Verify suspicious messages, claims, links, and media before you click, act, or share.*

---

## 📌 1. Product Positioning

**SAFENET** is an **AI-powered digital trust platform** that helps people verify suspicious online content before they click, act, or share.

The central problem SAFENET solves:
> **"I saw something online. Can I trust it?"**

SAFENET answers:
1. **What is being claimed?** (Claim extraction)
2. **What evidence supports it?** (Official sources, fact-checking, domain intelligence)
3. **What risk signals were detected?** (Urgency coercion, brand mimicry, credential harvesting, suspicious links)
4. **How trustworthy is the information?** (Calibrated risk level & confidence)
5. **What should the user do next?** (Direct action guidance: `DO NOT CLICK`, `VERIFY FIRST`, `SAFE TO PROCEED`, `WAIT FOR CONFIRMATION`)

---

## 🔄 2. The Digital Trust Flow

```text
ENCOUNTER
   ↓
VERIFY
   ↓
UNDERSTAND
   ↓
DECIDE
```

1. **ENCOUNTER**: User receives a suspicious WhatsApp forward, SMS, bank KYC alert, lookalike URL, or viral screenshot.
2. **VERIFY**: User inputs the content into SAFENET's dominant verification workspace.
3. **UNDERSTAND**: SAFENET runs deterministic heuristics, domain intelligence, and Gemini AI semantic analysis to produce explainable risk signals and evidence citations.
4. **DECIDE**: User receives clear, unambiguous guidance on the next step to protect themselves.

---

## 🧭 3. Streamlined Navigation Architecture

```text
SAFENET
Digital Trust Platform

HOME
  └── / (Dominant Verification Workspace, Recent Checks, Your Activity, Evidence Sources)

VERIFY
  ├── Verify Content (/check)
  ├── URL Scanner (/check?tab=url)
  └── Media Check (/check?tab=media)

INVESTIGATE
  ├── My Checks (/monitoring)
  └── Saved Reports (/threat/check-001)

PROTECT
  ├── Risk Alerts (/monitoring?tab=alerts)
  └── Safety Guide (/guide)

SETTINGS
  └── /setup (Baseline Registry & Preferences)
```

---

## 🎨 4. Visual Design Language

- **Background**: `#111111` (Clean near-black)
- **Primary Surfaces**: `#181818`, `#1D1D1D`, `#141414`
- **Subtle Borders**: `#2A2A2A`, `#222222`
- **Primary Accent**: `#F38020` (SAFENET Warm Amber / Orange)
- **Status Colors**:
  - Restrained Green (`#00B37E`): `LOW RISK`, Trustworthy, Verified
  - Amber (`#F38020`): `MEDIUM RISK`, Unverified, Warning
  - Red (`#EB364B`): `HIGH RISK`, `CRITICAL`, Phishing, Malicious
- **Design Rule**: **NO CARD OVERLOAD**. Layout utilizes typography, whitespace, horizontal dividers (`border-[#2A2A2A]`), editorial checklists, tables, timelines, and inline indicators.

---

## 🔬 5. Core Verification Engines & APIs

### `/api/check` POST
Evaluates input across multiple detection engines:
- **Similarity & Edit Distance Engine**: Levenshtein ratio, prefix/suffix combosquatting detection.
- **Homoglyphs Analyzer**: Detects lookalike Unicode and Cyrillic character substitutions.
- **Scam Signal Detector**: Identifies urgency manipulation, UPI/VPA payment demands, lottery/grant lures.
- **Gemini AI Semantic Analyzer**: Generates contextual synthesis, explainability reasoning, and recommended action steps.
- **Brand Baseline Comparator**: Cross-references against registered authentic domains and handles.

### Local Verification Store (`src/lib/verification-store.ts`)
- Manages user checks locally in localStorage (`safenet_user_verifications`).
- Computes real personal activity stats (`totalChecks`, `trustworthyCount`, `attentionCount`, `unverifiedCount`).
- Pre-seeds authentic sample records (clearly marked as `Sample Result`).
- Powers search, filtering, and history management.

---

## 🛡️ 6. Consumer Safety Guide (`/guide`)
Provides practical consumer education:
1. **The 4-Step Verification Loop**
2. **High-Frequency Deception Patterns** (Bank KYC, Electricity Disconnection, Government Grants, Courier Delivery)
3. **Technical Rules for URL Inspection** (Combosquatting, unverified TLDs)
4. **Emergency Response Protocol** (Freeze cards, call 1930 Cyber Crime Helpline, change credentials within 60 minutes)
