// src/app/not-authorized/page.tsx
import Link from 'next/link';
import { Logotype } from '@/components/logotype';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Not Authorized - Dashboard Viewer',
    description: 'You are not authorized to access this page.',
};

export default function NotAuthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-12 w-auto dark:filter-none" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Usuário não autorizado</h1>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                Seu usuário não está autorizado a acessar o painel. Entre em contato com seu administrador.
                </p>
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    Retornar ao Login
                </Link>
            </div>
        </div>
    );
}