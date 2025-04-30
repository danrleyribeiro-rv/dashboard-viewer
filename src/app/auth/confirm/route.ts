// src/app/auth/confirm/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

// This route handles Firebase authentication redirects
export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const next = searchParams.get('next') ?? '/';

  // Handle different Firebase auth actions
  if (oobCode) {
    if (mode === 'resetPassword') {
      // Redirect to the reset password page with the code
      return NextResponse.redirect(new URL(`/reset-password?oobCode=${oobCode}`, request.url));
    } else if (mode === 'verifyEmail') {
      // Email verification flow
      // You could handle email verification here if needed
      return NextResponse.redirect(new URL(`/login?verified=true`, request.url));
    }
  }

  // Fallback, redirect to home
  return NextResponse.redirect(new URL(next, request.url));
}