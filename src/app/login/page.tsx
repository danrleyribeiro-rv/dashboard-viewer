// src/app/login/page.tsx
import LoginForm from '@/app/_components/auth/login-form';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';
import { Logotype } from '@/components/logotype';
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - Lince Dashviewer',
    description: 'Login para acessar o Dashviewer.',
};

export default async function LoginPage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        redirect('/dashboard');
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-20 w-auto mr-4 dark:filter-none" />
                </div>
                <h1 className="text-2xl font-semibold text-center mb-4 dark:text-white">Login</h1>
                <LoginForm />
            </div>
            <Toaster />
        </div>
    );
}