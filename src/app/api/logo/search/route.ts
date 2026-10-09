/**
 * SAFENET API - POST /api/logo/search
 * 
 * Multipart image upload handler for Logo Check.
 * Enforces magic bytes verification, 4 MB payload limit, in-memory rate limiting,
 * Gemini Vision OCR extraction, reverse search, and brand risk classification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processLogoCheck } from '@/lib/logo-detector/logo-orchestrator';
import { validateImageMagicBytes, MAX_UPLOAD_BYTES } from '@/lib/logo-detector/image-utils';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile } from '@/types/brand';

// In-memory sliding window rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetInSec: Math.round(RATE_LIMIT_WINDOW_MS / 1000) };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetInSec: Math.max(1, Math.round((entry.resetTime - now) / 1000)) };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
    resetInSec: Math.max(1, Math.round((entry.resetTime - now) / 1000)),
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip.split(',')[0].trim());

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Maximum 20 logo analysis requests per minute.',
          resetInSec: rateCheck.resetInSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSec),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const brandName = formData.get('brandName') as string | null;
    const brandDomain = formData.get('brandDomain') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided in form-data field "image".' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Size Limit
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Image exceeds maximum allowed size of 4 MB (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
        },
        { status: 400 }
      );
    }

    // 4. Magic Bytes Validation
    const magic = validateImageMagicBytes(buffer);
    if (!magic.valid) {
      return NextResponse.json(
        {
          success: false,
          error: magic.error || 'Invalid file format. Only PNG, JPEG, and WebP images are allowed.',
          detectedFormat: magic.format,
        },
        { status: 400 }
      );
    }

    // 5. Determine Active Brand Profile
    let brandProfile: BrandProfile = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    if (brandName && PRESET_BRANDS[brandName]) {
      brandProfile = PRESET_BRANDS[brandName];
    } else if (brandName) {
      brandProfile = {
        ...brandProfile,
        name: brandName,
        domain: brandDomain || brandProfile.domain,
      };
    }

    // 6. Run Orchestration
    const report = await processLogoCheck(buffer, brandProfile);

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Logo check execution error: ${err?.message || err}`,
      },
      { status: 500 }
    );
  }
}
