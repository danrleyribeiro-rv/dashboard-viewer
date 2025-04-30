// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Skip middleware for static assets and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/auth', '/not-authorized', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  // For public routes, just continue
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check for Firebase auth token
  const session = request.cookies.get('__session');
  const fbToken = request.cookies.get('firebase-token');
  
  // If no auth cookie found, redirect to login
  if (!session && !fbToken) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }
  
  // Auth cookie exists, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};