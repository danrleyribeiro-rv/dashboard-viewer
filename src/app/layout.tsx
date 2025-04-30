// src/app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Lince - Dashviewer',
    description: 'BI Dashboard Viewer Application from Lince',
    icons: {icon: './favicon.ico'}
}

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <AuthProvider>
                        {children}
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}