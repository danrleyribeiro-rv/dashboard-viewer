// src/app/not-authorized/page.tsx
"use client";

import Link from 'next/link';
import { Logotype } from '@/components/logotype';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

export default function NotAuthorizedPage() {
    const { user, userRole, isClient, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    
    useEffect(() => {
        // If no user is logged in, redirect to login
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">Carregando...</p>
                </div>
            </div>
        );
    }

    // Determine the reason for not being authorized
    let unauthorizedReason = "";
    if (userRole !== 'client') {
        unauthorizedReason = "Sua conta não possui o perfil adequado para acessar o sistema.";
    } else if (!isClient) {
        unauthorizedReason = "Seu usuário não está cadastrado na base de clientes.";
    } else {
        unauthorizedReason = "Você não tem permissão para acessar esta página.";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-12 w-auto dark:filter-none" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso não autorizado</h1>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Seu usuário ({user?.email}) não tem acesso a esta área. 
                    <br /><br />
                    <span className="font-semibold">{unauthorizedReason}</span>
                    <br /><br />
                    Entre em contato com o administrador para solicitar acesso.
                </p>
                <div className="flex justify-center">
                    <Button 
                        onClick={handleLogout} 
                        disabled={isLoading} 
                        variant="outline"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Saindo...
                            </>
                        ) : (
                            'Retornar ao Login'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}