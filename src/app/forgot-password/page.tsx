// src/app/forgot-password/page.tsx
import ForgotPasswordForm from '../_components/auth/forgot-password-form';
import { Logotype } from '@/components/logotype';
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reset de Senha - Lince Dashviewer',
    description: 'Realize a sua mudança de senha.',
};

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-12 w-auto dark:filter-none" />
                </div>
                <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">Redefina sua senha</h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Adicione seu endereço de e-mail e estaremos enviando um link para resetar a sua senha.
                </p>
                <ForgotPasswordForm />
            </div>
            <Toaster />
        </div>
    );
}