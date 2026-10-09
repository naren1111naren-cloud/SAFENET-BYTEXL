/**
 * SAFENET API Route: GET /api/social/providers
 * Returns health, configuration, and enabled status for all supported social networks.
 * Strictly never exposes API keys or bearer tokens to the response.
 */

import { NextResponse } from 'next/server';
import { getProviderStatuses, getSocialMonitoringConfig } from '@/lib/social/config';

export async function GET() {
  try {
    const config = getSocialMonitoringConfig();
    const statuses = getProviderStatuses();

    return NextResponse.json({
      success: true,
      monitoringEnabled: config.enabled,
      demoMode: config.demoMode,
      providers: statuses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to inspect provider configurations.' },
      { status: 500 }
    );
  }
}
