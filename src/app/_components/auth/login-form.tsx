// src/app/_components/auth/login-form.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function LoginForm() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const router = useRouter();

    const checkClientExists = async (userEmail: string, userId: string) => {
        try {
            // First check if the user has client role
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('email', '==', userEmail));
            const userSnapshot = await getDocs(userQuery);
            
            if (userSnapshot.empty) {
                return false;
            }
            
            const userData = userSnapshot.docs[0].data();
            if (userData.role !== 'client') {
                return false;
            }
            
            // Then check if the user exists in clients collection
            const clientsRef = collection(db, 'clients');
            const clientQuery = query(clientsRef, where('user_id', '==', userId));
            const clientSnapshot = await getDocs(clientQuery);
            
            return !clientSnapshot.empty;
        } catch (error) {
            console.error("Error checking client:", error);
            return false;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Por favor, insira email e senha.");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signIn(email, password);
            
            // Check if the email exists in the clients collection
            const isAuthorized = await checkClientExists(email, userCredential.user.uid);
            
            if (isAuthorized) {
                toast.success("Login realizado com sucesso!");
                router.push('/dashboard');
            } else {
                // Sign out the user if they're not authorized
                await signIn(email, password);
                toast.error("Usuário não autorizado. Por favor, entre em contato com o administrador.");
                router.push('/not-authorized');
            }
        } catch (error: any) {
            console.error("Erro ao fazer login:", error);
            
            // Handle specific Firebase auth errors
            if (error.code === 'auth/invalid-credential') {
                toast.error("Email ou senha inválidos.");
            } else if (error.code === 'auth/user-disabled') {
                toast.error("Este usuário está desativado.");
            } else if (error.code === 'auth/too-many-requests') {
                toast.error("Muitas tentativas de login. Tente novamente mais tarde.");
            } else {
                toast.error(`Erro ao fazer login: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
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

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                </label>
                <div className="mt-1 relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Sua senha"
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
            </div>
            <div>
                <Button type="submit" className="w-full justify-center" disabled={loading}>
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Entrando...
                        </>
                    ) : (
                        'Entrar'
                    )}
                </Button>
            </div>
            <div className="flex items-center justify-center space-x-2">
                <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Esqueceu sua senha?
                    </Link>
                </div>
            </div>
        </form>
    );
}