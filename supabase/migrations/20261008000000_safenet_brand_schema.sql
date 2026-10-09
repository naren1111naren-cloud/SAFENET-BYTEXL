-- ==============================================================================
-- SAFENET Digital Risk Protection - Supabase Core Schema Migration
-- Migration: 20261008000000_safenet_brand_schema.sql
-- Description: Creates authoritative brand ground truth tables, analysis runs,
-- evidence logs, relationships, indexes, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Extension setup for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Authoritative Brands Table
-- Ground truth identity of protected brands.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'monitoring')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure domains are uniquely registered per active brand
CREATE UNIQUE INDEX IF NOT EXISTS uq_brands_domain ON public.brands (LOWER(domain));
CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands (name);
CREATE INDEX IF NOT EXISTS idx_brands_status ON public.brands (status);

-- ==============================================================================
-- 3. Brand Domains Table
-- Authoritative and discovered domains associated with the brand.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('official', 'discovered', 'unverified', 'suspicious')),
    source TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_brand_domain_pair UNIQUE (brand_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_brand_domains_brand_id ON public.brand_domains(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_domains_domain ON public.brand_domains(LOWER(domain));
CREATE INDEX IF NOT EXISTS idx_brand_domains_status ON public.brand_domains(status);

-- ==============================================================================
-- 4. Brand Social Profiles Table
-- Verified and discovered social media handles with provenance and status.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_social_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    username TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('official', 'discovered', 'unverified', 'suspicious')),
    source TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_brand_social_pair UNIQUE (brand_id, platform, username)
);

CREATE INDEX IF NOT EXISTS idx_brand_social_profiles_brand_id ON public.brand_social_profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_social_profiles_platform_username ON public.brand_social_profiles(platform, username);
CREATE INDEX IF NOT EXISTS idx_brand_social_profiles_status ON public.brand_social_profiles(status);

-- ==============================================================================
-- 5. Brand Mobile Applications Table
-- Authoritative and discovered application store listings.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    store TEXT NOT NULL,
    store_url TEXT NOT NULL,
    package_id TEXT,
    developer TEXT,
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('official', 'discovered', 'unverified', 'suspicious')),
    source TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_applications_brand_id ON public.brand_applications(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_package_id ON public.brand_applications(package_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON public.brand_applications(status);

-- ==============================================================================
-- 6. Brand Aliases & Trademarks Table
-- Legal names, alternate spellings, and acronyms.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    source TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_brand_alias_pair UNIQUE (brand_id, alias)
);

CREATE INDEX IF NOT EXISTS idx_brand_aliases_brand_id ON public.brand_aliases(brand_id);

-- ==============================================================================
-- 7. Brand Analysis Runs Table
-- Auditable record of live website inspection executions.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    target_website TEXT NOT NULL,
    brand_name_query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    provider_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_analysis_runs_brand_id ON public.brand_analysis_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_analysis_runs_status ON public.brand_analysis_runs(status);

-- ==============================================================================
-- 8. Brand Evidence Table
-- Granular evidence items linked to brands and inspection runs.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brand_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    analysis_run_id UUID REFERENCES public.brand_analysis_runs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value TEXT,
    source_url TEXT,
    source_type TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_evidence_brand_id ON public.brand_evidence(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_evidence_run_id ON public.brand_evidence(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_brand_evidence_type ON public.brand_evidence(type);

-- ==============================================================================
-- 9. Row Level Security (RLS) Configuration
-- Enforce RLS on all tables with explicit read/write access policies.
-- ==============================================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_evidence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow read access to brands" ON public.brands;
    DROP POLICY IF EXISTS "Allow insert to brands" ON public.brands;
    DROP POLICY IF EXISTS "Allow update to brands" ON public.brands;

    DROP POLICY IF EXISTS "Allow read access to brand_domains" ON public.brand_domains;
    DROP POLICY IF EXISTS "Allow insert to brand_domains" ON public.brand_domains;
    DROP POLICY IF EXISTS "Allow update to brand_domains" ON public.brand_domains;

    DROP POLICY IF EXISTS "Allow read access to brand_social_profiles" ON public.brand_social_profiles;
    DROP POLICY IF EXISTS "Allow insert to brand_social_profiles" ON public.brand_social_profiles;
    DROP POLICY IF EXISTS "Allow update to brand_social_profiles" ON public.brand_social_profiles;

    DROP POLICY IF EXISTS "Allow read access to brand_applications" ON public.brand_applications;
    DROP POLICY IF EXISTS "Allow insert to brand_applications" ON public.brand_applications;
    DROP POLICY IF EXISTS "Allow update to brand_applications" ON public.brand_applications;

    DROP POLICY IF EXISTS "Allow read access to brand_aliases" ON public.brand_aliases;
    DROP POLICY IF EXISTS "Allow insert to brand_aliases" ON public.brand_aliases;

    DROP POLICY IF EXISTS "Allow read access to brand_analysis_runs" ON public.brand_analysis_runs;
    DROP POLICY IF EXISTS "Allow insert to brand_analysis_runs" ON public.brand_analysis_runs;

    DROP POLICY IF EXISTS "Allow read access to brand_evidence" ON public.brand_evidence;
    DROP POLICY IF EXISTS "Allow insert to brand_evidence" ON public.brand_evidence;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Public / Authenticated read policies
CREATE POLICY "Allow read access to brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow insert to brands" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to brands" ON public.brands FOR UPDATE USING (true);

CREATE POLICY "Allow read access to brand_domains" ON public.brand_domains FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_domains" ON public.brand_domains FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to brand_domains" ON public.brand_domains FOR UPDATE USING (true);

CREATE POLICY "Allow read access to brand_social_profiles" ON public.brand_social_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_social_profiles" ON public.brand_social_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to brand_social_profiles" ON public.brand_social_profiles FOR UPDATE USING (true);

CREATE POLICY "Allow read access to brand_applications" ON public.brand_applications FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_applications" ON public.brand_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to brand_applications" ON public.brand_applications FOR UPDATE USING (true);

CREATE POLICY "Allow read access to brand_aliases" ON public.brand_aliases FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_aliases" ON public.brand_aliases FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access to brand_analysis_runs" ON public.brand_analysis_runs FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_analysis_runs" ON public.brand_analysis_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access to brand_evidence" ON public.brand_evidence FOR SELECT USING (true);
CREATE POLICY "Allow insert to brand_evidence" ON public.brand_evidence FOR INSERT WITH CHECK (true);
