// src/components/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from 'react';
import { ThemeProviderProps } from 'next-themes';
import { ReactNode } from 'react';

interface CustomThemeProviderProps extends ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}