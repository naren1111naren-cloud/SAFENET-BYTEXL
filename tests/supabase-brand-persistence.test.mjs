import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local if present
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  }
} catch {}

import { supabaseClient } from '../src/lib/supabase/client.ts';

describe('SAFENET Supabase Database & Brand Persistence Suite', () => {

  describe('1. Migration SQL Schema Integrity', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20261008000000_safenet_brand_schema.sql');
    let sqlContent = '';

    test('migration SQL file exists and is non-empty', () => {
      assert.ok(fs.existsSync(migrationPath), 'Migration SQL file must exist');
      sqlContent = fs.readFileSync(migrationPath, 'utf-8');
      assert.ok(sqlContent.length > 500, 'Migration SQL file must contain schema definitions');
    });

    test('defines all 7 required SAFENET tables', () => {
      const requiredTables = [
        'public.brands',
        'public.brand_domains',
        'public.brand_social_profiles',
        'public.brand_applications',
        'public.brand_aliases',
        'public.brand_analysis_runs',
        'public.brand_evidence',
      ];

      for (const table of requiredTables) {
        assert.ok(
          sqlContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
          `Migration must declare table ${table}`
        );
      }
    });

    test('declares foreign-key relationships with cascading deletes', () => {
      assert.ok(
        sqlContent.includes('REFERENCES public.brands(id) ON DELETE CASCADE'),
        'Sub-tables must link to public.brands(id) with ON DELETE CASCADE'
      );
      assert.ok(
        sqlContent.includes('REFERENCES public.brand_analysis_runs(id) ON DELETE CASCADE'),
        'brand_evidence must link to brand_analysis_runs(id) with ON DELETE CASCADE'
      );
    });

    test('creates performance indexes on foreign keys and lookup attributes', () => {
      const expectedIndexes = [
        'idx_brands_name',
        'idx_brands_status',
        'idx_brand_domains_brand_id',
        'idx_brand_domains_domain',
        'idx_brand_social_profiles_brand_id',
        'idx_brand_social_profiles_platform_username',
        'idx_brand_applications_brand_id',
        'idx_brand_applications_package_id',
        'idx_brand_aliases_brand_id',
        'idx_brand_analysis_runs_brand_id',
        'idx_brand_evidence_brand_id',
        'idx_brand_evidence_run_id',
      ];

      for (const idx of expectedIndexes) {
        assert.ok(sqlContent.includes(idx), `Index ${idx} must be defined in migration`);
      }
    });

    test('enables Row Level Security (RLS) on every table', () => {
      const tablesWithRls = [
        'brands',
        'brand_domains',
        'brand_social_profiles',
        'brand_applications',
        'brand_aliases',
        'brand_analysis_runs',
        'brand_evidence',
      ];

      for (const t of tablesWithRls) {
        assert.ok(
          sqlContent.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`),
          `RLS must be enabled on table ${t}`
        );
      }
    });

    test('defines explicit RLS policies for read and write', () => {
      assert.ok(sqlContent.includes('CREATE POLICY "Allow read access to brands"'));
      assert.ok(sqlContent.includes('CREATE POLICY "Allow insert to brands"'));
      assert.ok(sqlContent.includes('CREATE POLICY "Allow read access to brand_domains"'));
      assert.ok(sqlContent.includes('CREATE POLICY "Allow read access to brand_social_profiles"'));
      assert.ok(sqlContent.includes('CREATE POLICY "Allow read access to brand_applications"'));
      assert.ok(sqlContent.includes('CREATE POLICY "Allow read access to brand_evidence"'));
    });
  });

  describe('2. Native PostgREST Client Architecture', () => {
    test('detects configuration status from environment', () => {
      const isConfigured = supabaseClient.getIsConfigured();
      assert.strictEqual(typeof isConfigured, 'boolean');
      const baseUrl = supabaseClient.getBaseUrl();
      assert.ok(baseUrl.startsWith('http'), 'Base URL must start with http');
    });

    test('health check returns structured status without crashing', async () => {
      const health = await supabaseClient.checkHealth();
      assert.ok(health);
      assert.strictEqual(typeof health.connected, 'boolean');
      assert.strictEqual(typeof health.message, 'string');
      assert.ok(Array.isArray(health.tablesFound));
      assert.ok(['operational', 'auth_error_401', 'unreachable', 'not_configured'].some((s) => health.authStatus.includes(s)));
    });
  });

  describe('3. Provenance and Status Guarantees', () => {
    test('enforces discovery status constraints in table schema', () => {
      const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20261008000000_safenet_brand_schema.sql');
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      // Check status ENUM / check constraints
      assert.ok(sql.includes("CHECK (status IN ('official', 'discovered', 'unverified', 'suspicious'))"));
      assert.ok(sql.includes("DEFAULT 'discovered'"));
      assert.ok(sql.includes("CHECK (confidence IN ('high', 'medium', 'low'))"));
    });
  });
});
