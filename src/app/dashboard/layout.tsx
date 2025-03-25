// src/app/dashboard/layout.tsx
"use client";

import DashboardHeader from '../_components/dashboard/dashboard-header';
import BIViewer from '../_components/dashboard/dashboard-viewer';
import { Toaster } from "@/components/ui/sonner";
import { ReactNode, useState } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
    const [selectedDashboardName, setSelectedDashboardName] = useState<string | null>(null); // State for dashboard name

    const handleDashboardChange = (url: string, name: string) => {
        setDashboardUrl(url);
        setSelectedDashboardName(name); // Update dashboard name when dashboard changes
    };

    const handleDashboardNameChange = (name: string) => {
        setSelectedDashboardName(name); // Callback to set initial dashboard name
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <DashboardHeader
                onDashboardChange={handleDashboardChange}
                selectedDashboardName={selectedDashboardName} // Pass selected dashboard name to header
            />
            <main className="py-10 px-4 sm:px-6 lg:px-8">
                <BIViewer dashboardUrl={dashboardUrl} /> { /* BIViewer is now rendered here to receive dashboardUrl */ }
                {children}
            </main>
            <Toaster />
        </div>
    );
}