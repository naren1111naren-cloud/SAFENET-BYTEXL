/**
 * SAFENET - Middleware
 * Authentication check is bypassed: demo mode is enabled with instant access to all routes.
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to proceed directly without blocking or redirecting
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and icons
     */
    '/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
