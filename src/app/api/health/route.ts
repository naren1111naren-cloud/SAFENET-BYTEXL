import { NextResponse } from 'next/server';
import { globalProviderRegistry } from '@/lib/providers/registry';
import { supabaseClient } from '@/lib/supabase/client';
import dns from 'dns/promises';

export async function GET() {
  const startedAt = Date.now();

  // Test DNS resolver
  let dnsStatus = 'connected';
  let dnsLatencyMs = 0;
  try {
    const dnsStart = Date.now();
    await dns.resolve4('dns.google');
    dnsLatencyMs = Date.now() - dnsStart;
  } catch {
    dnsStatus = 'error';
  }

  // Test configured providers
  const providerHealth = await globalProviderRegistry.checkAllHealth();

  // Test Gemini LLM configuration
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const llmStatus = geminiKey && geminiKey.length >= 20 ? 'connected' : 'not_configured';

  // Test Supabase Database configuration & connectivity
  const supabaseHealth = await supabaseClient.checkHealth();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    totalLatencyMs: Date.now() - startedAt,
    providers: {
      dns: {
        name: 'System DNS Resolver',
        type: 'dns',
        status: dnsStatus,
        latencyMs: dnsLatencyMs,
        testedAt: new Date().toISOString(),
      },
      llm: {
        name: 'Google Gemini 1.5 Flash',
        type: 'llm',
        status: llmStatus,
        message: llmStatus === 'connected' ? undefined : 'GEMINI_API_KEY is not configured in .env.local',
        testedAt: new Date().toISOString(),
      },
      database: {
        name: 'Supabase PostgreSQL',
        type: 'database',
        status: supabaseHealth.connected ? (supabaseHealth.schemaStatus === 'migrated' ? 'connected' : 'pending_migration') : 'not_configured',
        authStatus: supabaseHealth.authStatus,
        schemaStatus: supabaseHealth.schemaStatus,
        message: supabaseHealth.message,
        tablesFound: supabaseHealth.tablesFound,
        testedAt: new Date().toISOString(),
      },
      ...providerHealth,
    },
  });
}
