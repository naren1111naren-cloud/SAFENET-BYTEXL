-- ==============================================================================
-- SAFENET Migration: Look-alike Detection & False-Positive Reviews Schema
-- Migration ID: 20261009000000_safenet_lookalike_detection.sql
-- Enables analyst review decisions, false-positive mitigation, and custom allowlists.
-- ==============================================================================

-- 1. Table: lookalike_reviews
CREATE TABLE IF NOT EXISTS public.lookalike_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    platform TEXT,
    profile_url TEXT,
    decision TEXT NOT NULL, -- 'legitimate', 'suspicious', 'confirmed_impersonation'
    similarity_score INT NOT NULL DEFAULT 0,
    risk_score INT NOT NULL DEFAULT 0,
    variation_type TEXT NOT NULL,
    notes TEXT,
    reviewed_by TEXT NOT NULL DEFAULT 'Analyst',
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: brand_allowlists
CREATE TABLE IF NOT EXISTS public.brand_allowlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'handle', 'domain', 'url', 'package_id', 'developer', 'name'
    value TEXT NOT NULL,
    notes TEXT,
    created_by TEXT DEFAULT 'Analyst',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lookup performance
CREATE INDEX IF NOT EXISTS idx_lookalike_reviews_brand ON public.lookalike_reviews(brand_name);
CREATE INDEX IF NOT EXISTS idx_lookalike_reviews_candidate ON public.lookalike_reviews(candidate_name);
CREATE INDEX IF NOT EXISTS idx_lookalike_reviews_decision ON public.lookalike_reviews(decision);
CREATE INDEX IF NOT EXISTS idx_brand_allowlists_brand_id ON public.brand_allowlists(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_allowlists_value ON public.brand_allowlists(value);

-- Row Level Security (RLS)
ALTER TABLE public.lookalike_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_allowlists ENABLE ROW LEVEL SECURITY;

-- Permissive development policies for authenticated/anon access
CREATE POLICY "Public Read Lookalike Reviews" ON public.lookalike_reviews FOR SELECT USING (true);
CREATE POLICY "Public Write Lookalike Reviews" ON public.lookalike_reviews FOR ALL USING (true);

CREATE POLICY "Public Read Brand Allowlists" ON public.brand_allowlists FOR SELECT USING (true);
CREATE POLICY "Public Write Brand Allowlists" ON public.brand_allowlists FOR ALL USING (true);
