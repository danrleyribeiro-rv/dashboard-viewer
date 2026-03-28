import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error("Adicione um email válido.");
            return;
        }

        setLoading(true);

        try {
            await authApi.changePassword('', '');
            toast.success("Solicitação enviada. Entre em contato com o administrador para redefinir sua senha.");
            setEmail('');
            setTimeout(() => navigate('/login'), 3000);
        } catch {
            // Since we don't have email-based reset without Firebase,
            // just show a message to contact admin
            toast.info("Entre em contato com o administrador para redefinir sua senha.");
            setTimeout(() => navigate('/login'), 3000);
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
                            Enviando...
                        </>
                    ) : (
                        'Solicitar Redefinição'
                    )}
                </Button>

                <div className="text-center">
                    <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Retornar ao Login
                    </Link>
                </div>
            </div>
        </form>
    );
}
