// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Toaster } from "@/components/ui/sonner";
import ClientSideWrapper from './client-wrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Usar getUser() em vez de getSession() para maior segurança
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }
  
  // Usar a função RPC que ignora RLS
  const { data: clients, error } = await supabase.rpc('get_all_clients');
  
  // Verificar se o usuário está na lista
  const userExists = Array.isArray(clients) && clients.some(client => 
    client.id === user.id
  );

  
  if (error || !userExists) {
    console.log('User not authorized:', user.id);
    redirect('/not-authorized');
  }
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
      <ClientSideWrapper userId={user.id} />
      <Toaster />
    </div>
  );
}