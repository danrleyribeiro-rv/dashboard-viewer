// src/app/_components/dashboard/dashboard-selector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboardIcon } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Dashboard {
    id: number;
    name: string;
    iframe_url: string;
}

interface DashboardSelectorProps {
    onDashboardChange: (url: string, dashboardName: string) => void; // Modified onDashboardChange to include dashboardName
    onDashboardNameChange?: (dashboardName: string) => void; // Optional callback to pass dashboard name up
}

export default function DashboardSelector({ onDashboardChange, onDashboardNameChange }: DashboardSelectorProps) {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
    const [session, setSession] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchSession = async () => {
            const currentSession = await supabase.auth.getSession();
            setSession(currentSession.data.session);
        };
        fetchSession();
    }, []);

    useEffect(() => {
        const fetchDashboards = async () => {
            setLoading(true);
            try {
                if (session?.user) {
                    const { data, error } = await supabase
                        .from('dashboards')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .order('name', { ascending: true });

                    if (error) {
                        console.error("Error fetching dashboards:", error);
                        toast.error("Error fetching dashboards");
                    } else if (data && data.length > 0) {
                        setDashboards(data);
                        const firstDashboard = data[0];
                        setSelectedDashboard(firstDashboard);

                        if (onDashboardChange && firstDashboard) {
                            onDashboardChange(firstDashboard.iframe_url, firstDashboard.name); // Pass dashboard name here
                        }
                        if (onDashboardNameChange && firstDashboard) {
                            onDashboardNameChange(firstDashboard.name); // Initialize dashboard name in header
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

        if (session) {
            fetchDashboards();
        } else {
            setLoading(false);
        }
    }, [supabase, onDashboardChange, session, onDashboardNameChange]);

    const handleDashboardChange = (dashboard: Dashboard) => {
        setSelectedDashboard(dashboard);
        if (onDashboardChange) {
            onDashboardChange(dashboard.iframe_url, dashboard.name); // Pass dashboard name here
        }
        if (onDashboardNameChange) {
            onDashboardNameChange(dashboard.name); // Update dashboard name in header
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