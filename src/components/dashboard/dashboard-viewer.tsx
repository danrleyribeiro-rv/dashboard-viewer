import React, { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { AlertCircleIcon } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { dashboardsApi } from '@/lib/api/client';

interface BIViewerProps {
    dashboardUrl: string | null;
}

interface MouseActivityEvent {
    x: number;
    y: number;
    type: string;
    timestamp: number;
}

export default function BIViewer({ dashboardUrl }: BIViewerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentIframeUrl, setCurrentIframeUrl] = useState<string | null>(dashboardUrl);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [dashboardId, setDashboardId] = useState<string | null>(null);
    const [mouseActivity, setMouseActivity] = useState<MouseActivityEvent[]>([]);
    const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<boolean>(false);
    const { user } = useAuth();
    const inactivityThreshold = 60000;

    useEffect(() => {
        if (dashboardUrl && dashboardUrl !== currentIframeUrl) {
            setCurrentIframeUrl(dashboardUrl);
            setIsLoading(true);
            setLoadError(false);
        }
    }, [dashboardUrl, currentIframeUrl]);

    const throttledMouseTrack = useCallback((event: MouseEvent) => {
        setLastActiveTime(Date.now());
        if (!dashboardId) return;

        const eventData: MouseActivityEvent = {
            x: event.clientX,
            y: event.clientY,
            type: event.type,
            timestamp: Date.now()
        };

        setMouseActivity(prevActivity => {
            const newActivity = [...prevActivity, eventData];
            if (newActivity.length > 100) {
                return newActivity.slice(-100);
            }
            return newActivity;
        });
    }, [dashboardId]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setLoadError(true);
        toast.error("Falha ao carregar o dashboard");
    };

    const sendUsageData = useCallback(async (eventType: string, eventData: unknown) => {
        if (!dashboardId || !user) return;
        try {
            await dashboardsApi.addUsageData(dashboardId, eventType, eventData);
        } catch (error: any) {
            console.error("Erro ao enviar dados de uso:", error);
        }
    }, [dashboardId, user]);

    const sendAccessLog = useCallback(async (duration: number) => {
        if (!dashboardId || !user) return;
        try {
            await dashboardsApi.addAccessLog(dashboardId, duration);
        } catch (error: any) {
            console.error("Erro ao enviar logs de acesso:", error);
        }
    }, [dashboardId, user]);

    useEffect(() => {
        const fetchDashboardId = async () => {
            try {
                if (user && currentIframeUrl) {
                    const dashboards = await dashboardsApi.listMine();
                    const match = dashboards.find(d => d.iframe_url === currentIframeUrl);
                    setDashboardId(match?.id ?? null);
                }
            } catch (error: any) {
                console.error("Erro ao buscar dashboard por URL:", error);
            }
        };

        fetchDashboardId();
        setStartTime(Date.now());
        setMouseActivity([]);

        return () => {
            if (startTime && dashboardId) {
                const duration = Math.round((Date.now() - startTime) / 1000);
                sendAccessLog(duration);
                if (mouseActivity.length > 0) {
                    sendUsageData('mouse_heatmap', mouseActivity);
                }
            }
        };
    }, [user, currentIframeUrl]);

    useEffect(() => {
        const inactivityInterval = setInterval(() => {
            if (Date.now() - lastActiveTime > inactivityThreshold) {
                sendUsageData('inactivity', { duration: inactivityThreshold });
                setLastActiveTime(Date.now());
            }
        }, 10000);

        let throttleTimer: ReturnType<typeof setTimeout> | null = null;
        const throttledHandler = (event: MouseEvent) => {
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    throttledMouseTrack(event);
                    throttleTimer = null;
                }, 100);
            }
        };

        window.addEventListener('mousemove', throttledHandler as EventListener);
        window.addEventListener('click', throttledMouseTrack as EventListener);

        return () => {
            window.removeEventListener('mousemove', throttledHandler as EventListener);
            window.removeEventListener('click', throttledMouseTrack as EventListener);
            clearInterval(inactivityInterval);
        };
    }, [throttledMouseTrack, lastActiveTime, inactivityThreshold, sendUsageData]);

    return (
        <div
            className="flex flex-col items-center justify-center relative h-full w-full overflow-hidden"
            onContextMenu={(e) => e.preventDefault()}
            style={{ height: 'calc(100vh - 70px)' }}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">Carregando dashboard...</p>
                    </div>
                </div>
            )}

            {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                    <div className="flex flex-col items-center text-center p-6">
                        <AlertCircleIcon className="h-12 w-12 text-red-500 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Falha ao carregar dashboard</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Houve um erro ao carregar esse Dashboard. Por favor entre em contado com o suporte.
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full h-full">
                <iframe
                    ref={iframeRef}
                    {...(currentIframeUrl ? { src: currentIframeUrl } : {})}
                    title="BI Dashboard"
                    className="w-full h-full border-0"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    loading="eager"
                />
            </div>
        </div>
    );
}
