// src/app/reset-password/page.tsx
import ResetPasswordForm from '../_components/auth/reset-password-form';
import { Logotype } from '@/components/logotype';
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reset Password - Dashboard Viewer',
    description: 'Set your new password for the BI Dashboard Viewer',
};


export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-12 w-auto dark:filter-none" />
                </div>
                <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">Adicione sua nova senha</h1>
                <ResetPasswordForm />
            </div>
          <Toaster />
        </div>
    );
}