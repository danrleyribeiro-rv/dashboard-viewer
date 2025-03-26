// src/app/dashboard/client-wrapper.tsx
"use client";
import { useState } from 'react';
import DashboardHeader from '../_components/dashboard/dashboard-header';
import BIViewer from '../_components/dashboard/dashboard-viewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'BI - Lince Dashviewer',
    description: 'Visualizador de Dashboards.',
};

export default function ClientSideWrapper({ userId }: { userId: string }) {
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [selectedDashboardName, setSelectedDashboardName] = useState<string | null>(null);

  const handleDashboardChange = (url: string, name: string) => {
    setDashboardUrl(url);
    setSelectedDashboardName(name);
  };

  return (
    <>
      <DashboardHeader
        onDashboardChange={handleDashboardChange}
        selectedDashboardName={selectedDashboardName}
      />
      <div className="flex-1 overflow-hidden">
        <BIViewer dashboardUrl={dashboardUrl} />
      </div>
    </>
  );
}