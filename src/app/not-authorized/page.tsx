// src/app/not-authorized/page.tsx
import Link from 'next/link';
import { Logotype } from '@/components/logotype';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { logoutAction } from '../actions/auth';

export const metadata: Metadata = {
    title: 'Não Autorizado - Lince Dashviewer',
    description: 'Você não está autorizado a entrar nessa página.',
};

export default async function NotAuthorizedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is not logged in, redirect to login
    if (!user) {
        redirect('/login');
    }
        
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-12 w-auto dark:filter-none" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso não autorizado</h1>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Seu usuário ({user.email}) não está cadastrado na base de clientes. 
                    Entre em contato com o administrador para solicitar acesso.
                </p>
                <div className="flex justify-center">
                    <form action={logoutAction}>
                        <Button type="submit" variant="outline">
                            Retornar ao Login
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}