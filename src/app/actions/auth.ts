// src/app/actions/auth.ts
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function logoutAction() {
  // Clear the auth cookie
  (await cookies()).delete('__session');
  
  // Redirect to login page
  redirect('/login');
}