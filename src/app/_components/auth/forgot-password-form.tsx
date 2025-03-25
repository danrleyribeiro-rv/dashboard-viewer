// src/app/_components/auth/forgot-password-form.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from 'next/link';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const supabase = createClient();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error("Adicione um email válido;");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast.error(`Forgot Password Error: ${error.message}`);
                console.error("Forgot Password Error:", error);
            } else {
                toast.success("E-mail para reset de senha foi enviado. Verifique a sua caixa de entrada.");
                setEmail('');
                router.push('/login');
            }
        } catch (error: any) {
            toast.error(`Ocorreu um erro inesperado: ${error.message}`);
            console.error("Erro inesperado:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                </label>
                <div className="mt-1">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="Seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex flex-col space-y-4">
                <Button type="submit" className="w-full justify-center" disabled={loading}>
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Sending...
                        </>
                    ) : (
                        'Redefinir Senha'
                    )}
                </Button>

                <div className="text-center">
                    <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Retornar ao Login
                    </Link>
                </div>
            </div>
        </form>
    );
}