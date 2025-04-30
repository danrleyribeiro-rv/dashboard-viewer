// src/app/_components/dashboard/dashboard-selector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboardIcon } from "lucide-react";
import { getDashboardsByUserId } from '@/lib/firebase/firestore';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/context/auth-context';
import { type Dashboard } from '@/lib/firebase/firestore';

interface DashboardSelectorProps {
    onDashboardChange: (url: string, dashboardName: string) => void;
    onDashboardNameChange?: (dashboardName: string) => void;
}

export default function DashboardSelector({ onDashboardChange, onDashboardNameChange }: DashboardSelectorProps) {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchDashboards = async () => {
            setLoading(true);
            try {
                if (user) {
                    const dashboardData = await getDashboardsByUserId(user.uid);
                    
                    if (dashboardData.length > 0) {
                        setDashboards(dashboardData);
                        const firstDashboard = dashboardData[0];
                        setSelectedDashboard(firstDashboard);

                        if (onDashboardChange && firstDashboard) {
                            onDashboardChange(firstDashboard.iframe_url, firstDashboard.name);
                        }
                        if (onDashboardNameChange && firstDashboard) {
                            onDashboardNameChange(firstDashboard.name);
                        }
                    } else {
                        toast.error("Não há dashboards disponíveis");
                    }
                }
            } catch (error: any) {
                console.error("Erro ao buscar dashboards:", error);
                toast.error("Ocorreu um erro ao buscar os dashboards");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboards();
        } else {
            setLoading(false);
        }
    }, [user, onDashboardChange, onDashboardNameChange]);

    const handleDashboardChange = (dashboard: Dashboard) => {
        setSelectedDashboard(dashboard);
        if (onDashboardChange) {
            onDashboardChange(dashboard.iframe_url, dashboard.name);
        }
        if (onDashboardNameChange) {
            onDashboardNameChange(dashboard.name);
        }
    };

    if (loading) {
        return <Skeleton className="h-10 w-32" />;
    }

    if (dashboards.length === 0) {
        return (
            <Button variant="outline" className="gap-2" disabled>
                <LayoutDashboardIcon className="h-4 w-4" />
                Sem Dashboards
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <LayoutDashboardIcon className="h-4 w-4" />
                    {selectedDashboard?.name || 'Select Dashboard'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                {dashboards.map((dashboard) => (
                    <DropdownMenuItem
                        key={dashboard.id}
                        onSelect={() => handleDashboardChange(dashboard)}
                        className={selectedDashboard?.id === dashboard.id ? "bg-gray-100 dark:bg-gray-800" : ""}
                    >
                        {dashboard.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}