// src/app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reset de Senha - Lince Dashviewer',
    description: 'Reset de senha para acessar o Dashviewer.',
};

export default async function Home() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        redirect('/dashboard');
    } else {
        redirect('/login');
    }

    return <div />;
}