// src/app/_components/auth/logout-button-form.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

export default function LogoutButton() {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                toast.error(`Logout Error: ${error.message}`);
                console.error("Logout Error:", error);
            } else {
                // Clear all local storage to ensure session data is removed
                localStorage.clear();
                
                // Clear cookies
                document.cookie.split(";").forEach(function(c) {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                
                toast.success("Logout realizado com sucesso!");
                
                // Force reload page to clear any caches
                window.location.href = '/login';
            }
        } catch (error: any) {
            toast.error(`Um erro inesperado ocorreu: ${error.message}`);
            console.error("Erro inesperado:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2"
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
            ) : (
                <LogOutIcon className="h-4 w-4" />
            )}
            Sair
        </Button>
    );
}