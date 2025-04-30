// src/app/_components/auth/reset-password-form.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmResetPassword } from '@/lib/firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function ResetPasswordForm() {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode'); // Firebase's password reset code
    
    useEffect(() => {
        if (!oobCode) {
            toast.error("Link de redefinição de senha inválido ou expirado.");
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    }, [oobCode, router]);

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return "A senha deve ter pelo menos 8 caracteres";
        }
        return null;
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!oobCode) {
            toast.error("Link de redefinição de senha inválido ou expirado.");
            return;
        }

        const validationError = validatePassword(password);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);

        try {
            await confirmResetPassword(oobCode, password);
            toast.success("Sua senha foi atualizada com sucesso!");
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error: any) {
            console.error("Erro ao resetar senha:", error);
            
            if (error.code === 'auth/expired-action-code') {
                toast.error("Este link de redefinição de senha expirou.");
            } else if (error.code === 'auth/invalid-action-code') {
                toast.error("Este link de redefinição de senha é inválido.");
            } else if (error.code === 'auth/weak-password') {
                toast.error("Esta senha é muito fraca. Escolha uma senha mais forte.");
            } else {
                toast.error(`Um erro inesperado ocorreu: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nova Senha
                </label>
                <div className="mt-1 relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Nova senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pr-10"
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">No mínimo 8 caracteres</p>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirme sua nova senha
                </label>
                <div className="mt-1 relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pr-10"
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
            </div>

            <div>
                <Button type="submit" className="w-full justify-center" disabled={loading}>
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Atualizando...
                        </>
                    ) : (
                        'Atualizar Senha'
                    )}
                </Button>
            </div>
        </form>
    );
}