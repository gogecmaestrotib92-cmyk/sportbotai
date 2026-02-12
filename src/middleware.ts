import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Auth routes - redirect to analyzer if already logged in.
 */
const authRoutes = ['/login', '/register'];

/**
 * Serbian-speaking countries for geo-detection
 * RS = Serbia, BA = Bosnia, ME = Montenegro, HR = Croatia, MK = North Macedonia, XK = Kosovo
 */
const SERBIAN_COUNTRIES = ['RS', 'BA', 'ME', 'HR', 'MK', 'XK'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always add pathname header for locale detection in layout
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  
  // Skip rest of middleware for API routes, static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response;
  }
  
  // For Serbian routes, just return with the pathname header
  if (pathname.startsWith('/sr')) {
    return response;
  }
  
  // Get JWT token (works with jwt session strategy)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const isLoggedIn = !!token;
  
  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect to matches if accessing auth route while logged in
  if (isAuthRoute && isLoggedIn) {
    const redirectResponse = NextResponse.redirect(new URL('/matches', request.url));
    redirectResponse.headers.set('x-pathname', pathname);
    return redirectResponse;
  }
  
  // Geo-based language redirect (only for homepage)
  if (pathname === '/') {
    try {
      // Check if user has a preferred locale cookie
      const preferredLocale = request.cookies.get('preferred-locale')?.value;
      
      if (preferredLocale) {
        // User has already chosen a language, respect it
        if (preferredLocale === 'sr') {
          const redirectResponse = NextResponse.redirect(new URL('/sr', request.url));
          redirectResponse.headers.set('x-pathname', '/sr');
          return redirectResponse;
        }
        // If English, stay on /
        return response;
      }
      
      // No preference cookie - check geo location
      const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || '';
      
      if (SERBIAN_COUNTRIES.includes(country)) {
        // Set cookie to remember this choice and redirect to Serbian
        const redirectResponse = NextResponse.redirect(new URL('/sr', request.url));
        redirectResponse.headers.set('x-pathname', '/sr');
        redirectResponse.cookies.set('preferred-locale', 'sr', {
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/',
          sameSite: 'lax',
        });
        return redirectResponse;
      }
      
      // Set English as default for non-Serbian countries
      response.cookies.set('preferred-locale', 'en', {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      });
      return response;
    } catch (error) {
      // If geo-detection fails, just serve English homepage
      console.error('Middleware geo-detection error:', error);
      return response;
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$).*)',
  ],
};
