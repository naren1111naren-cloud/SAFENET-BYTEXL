-- ==============================================================================
-- SAFENET Migration: Social Media & Brand Impersonation Monitoring Schema
-- Migration ID: 20261008000001_safenet_social_monitoring.sql
-- Enables brand identity profiles, social candidates, scans, and evidence attribution.
-- ==============================================================================

-- 1. Table: brand_monitors
CREATE TABLE IF NOT EXISTS public.brand_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL,
    official_domain TEXT NOT NULL,
    official_urls TEXT[] DEFAULT '{}',
    official_social_handles JSONB DEFAULT '{}',
    aliases TEXT[] DEFAULT '{}',
    logo_url TEXT,
    brand_keywords TEXT[] DEFAULT '{}',
    known_domains TEXT[] DEFAULT '{}',
    official_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: social_scans
CREATE TABLE IF NOT EXISTS public.social_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brand_monitors(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'running', 'completed', 'failed'
    query_variants TEXT[] DEFAULT '{}',
    total_candidates INT DEFAULT 0,
    high_critical_count INT DEFAULT 0,
    providers_used JSONB DEFAULT '{}',
    execution_ms INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Table: social_candidates
CREATE TABLE IF NOT EXISTS public.social_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brand_monitors(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES public.social_scans(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'youtube', 'twitter', 'instagram', 'facebook', 'linkedin'
    candidate_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile_url TEXT NOT NULL,
    profile_image_url TEXT,
    description TEXT,
    external_urls TEXT[] DEFAULT '{}',
    followers INT,
    verification_status TEXT DEFAULT 'unknown',
    source TEXT NOT NULL, -- 'YouTube Data API v3', 'X API v2', 'SAFENET DEMO DATA'
    is_demo_data BOOLEAN DEFAULT FALSE,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    confidence INT NOT NULL DEFAULT 70,
    identity_score INT DEFAULT 0,
    domain_risk_score INT DEFAULT 0,
    name_similarity INT DEFAULT 0,
    username_similarity INT DEFAULT 0,
    branding_similarity INT DEFAULT 0,
    status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'watchlist', 'confirmed_threat'
    reasons TEXT[] DEFAULT '{}',
    raw_metadata JSONB DEFAULT '{}',
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_social_candidate UNIQUE (brand_id, platform, username)
);

-- 4. Table: social_evidence
CREATE TABLE IF NOT EXISTS public.social_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.social_candidates(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    value TEXT,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_monitors_domain ON public.brand_monitors(official_domain);
CREATE INDEX IF NOT EXISTS idx_social_scans_brand_id ON public.social_scans(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_candidates_brand_id ON public.social_candidates(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_candidates_platform ON public.social_candidates(platform);
CREATE INDEX IF NOT EXISTS idx_social_candidates_risk ON public.social_candidates(risk_level);
CREATE INDEX IF NOT EXISTS idx_social_candidates_status ON public.social_candidates(status);
CREATE INDEX IF NOT EXISTS idx_social_evidence_candidate_id ON public.social_evidence(candidate_id);

-- Row Level Security (RLS)
ALTER TABLE public.brand_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_evidence ENABLE ROW LEVEL SECURITY;

-- Permissive development policies for authenticated/anon access
CREATE POLICY "Public Read Brand Monitors" ON public.brand_monitors FOR SELECT USING (true);
CREATE POLICY "Public Write Brand Monitors" ON public.brand_monitors FOR ALL USING (true);

CREATE POLICY "Public Read Social Scans" ON public.social_scans FOR SELECT USING (true);
CREATE POLICY "Public Write Social Scans" ON public.social_scans FOR ALL USING (true);

CREATE POLICY "Public Read Social Candidates" ON public.social_candidates FOR SELECT USING (true);
CREATE POLICY "Public Write Social Candidates" ON public.social_candidates FOR ALL USING (true);

CREATE POLICY "Public Read Social Evidence" ON public.social_evidence FOR SELECT USING (true);
CREATE POLICY "Public Write Social Evidence" ON public.social_evidence FOR ALL USING (true);
