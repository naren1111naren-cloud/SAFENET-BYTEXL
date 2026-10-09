/**
 * SAFENET API Route: POST /api/apps/analyze-apk
 * Static Android APK inspection and threat correlation.
 * Zero-execution static analysis extracting manifest, permissions, hashes,
 * comparing against Google Play via SerpApi, and checking embedded domains.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeApkStatic } from '@/lib/apk/apk-analyzer';
import { correlateApkThreat } from '@/lib/apps/threat-correlator';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let apkBuffer: Buffer;
    let fileName = 'application.apk';
    let targetBrand = 'PayPal';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const brandParam = formData.get('targetBrand') as string | null;
      if (brandParam) targetBrand = brandParam;

      if (!file) {
        return NextResponse.json({ error: 'No APK file provided in upload.' }, { status: 400 });
      }

      fileName = file.name || 'uploaded.apk';
      const arrayBuffer = await file.arrayBuffer();
      apkBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.targetBrand) targetBrand = body.targetBrand;

      if (body.apkBase64) {
        apkBuffer = Buffer.from(body.apkBase64, 'base64');
        fileName = body.fileName || 'uploaded.apk';
      } else {
        return NextResponse.json(
          { error: 'APK payload required as multipart file or base64 buffer.' },
          { status: 400 }
        );
      }
    }

    if (apkBuffer.length < 50) {
      return NextResponse.json({ error: 'Uploaded file is too small to be a valid APK.' }, { status: 400 });
    }

    // Maximum 50 MB protection limit
    if (apkBuffer.length > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'APK exceeds maximum inspection size (50 MB).' }, { status: 400 });
    }

    // 1. Static APK Extraction (Zero Execution)
    const staticResult = analyzeApkStatic(apkBuffer, fileName);

    // 2. Correlate with Google Play & Domain Intelligence
    const correlationReport = await correlateApkThreat(staticResult, targetBrand);

    return NextResponse.json(correlationReport);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API APK Analysis] Failure:', error);
    return NextResponse.json(
      { error: `Static APK analysis failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
