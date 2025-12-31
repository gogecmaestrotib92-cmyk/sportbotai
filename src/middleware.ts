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
  
  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
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
  
  // Redirect to analyzer if accessing auth route while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/analyzer', request.url));
  }
  
  // Geo-based language redirect (only for homepage)
  if (pathname === '/') {
    // Check if user has a preferred locale cookie
    const preferredLocale = request.cookies.get('preferred-locale')?.value;
    
    if (preferredLocale) {
      // User has already chosen a language, respect it
      if (preferredLocale === 'sr') {
        return NextResponse.redirect(new URL('/sr', request.url));
      }
      // If English, stay on /
      return NextResponse.next();
    }
    
    // No preference cookie - check geo location
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || '';
    
    if (SERBIAN_COUNTRIES.includes(country)) {
      // Set cookie to remember this choice and redirect to Serbian
      const response = NextResponse.redirect(new URL('/sr', request.url));
      response.cookies.set('preferred-locale', 'sr', {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      return response;
    }
    
    // Set English as default for non-Serbian countries
    const response = NextResponse.next();
    response.cookies.set('preferred-locale', 'en', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
  ],
};
