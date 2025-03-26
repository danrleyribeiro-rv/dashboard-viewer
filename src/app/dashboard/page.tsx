// src/app/dashboard/page.tsx
"use client";

import BIViewer from '../_components/dashboard/dashboard-viewer';
import { useState } from 'react';

export default function DashboardPage() {
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
        <div>
            <BIViewer dashboardUrl={dashboardUrl} />
        </div>
    );
}