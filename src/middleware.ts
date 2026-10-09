/**
 * SAFENET - Authentication & Session Protection Middleware
 * Implements server-side session validation using @supabase/ssr.
 * Protects application routes and ensures unauthenticated visitors are redirected to Login.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  // If Supabase environment is not configured, pass through with warning in development
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid using getSession() in middleware because it doesn't validate token with server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected application routes that strictly require authentication
  const protectedRoutes = [
    '/overview',
    '/dashboard',
    '/monitoring',
    '/apps',
    '/social',
    '/check',
    '/investigate',
    '/reports',
    '/campaigns',
    '/incidents',
    '/setup',
    '/guide',
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isLoginRoute = pathname === '/login';
  const isRootRoute = pathname === '/';

  // 1. Unauthenticated user attempting to access protected route -> Redirect to Login
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Authenticated user visiting Login route -> Redirect to Dashboard
  if (user && (isLoginRoute || isRootRoute)) {
    const targetUrl = request.nextUrl.clone();
    const destination = request.nextUrl.searchParams.get('redirect') || '/overview';
    targetUrl.pathname = destination;
    targetUrl.searchParams.delete('redirect');
    return NextResponse.redirect(targetUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets like icons, logos, manifests (.svg, .png, .jpg, .webp, .ico)
     * - API routes (/api/*) so internal automation/healthchecks remain functional
     * - Auth callback route (/auth/callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/|auth/callback).*)',
  ],
};
