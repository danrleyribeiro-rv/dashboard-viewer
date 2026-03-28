import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import BIViewer from '@/components/dashboard/dashboard-viewer';

export default function DashboardPage() {
    const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
    const [selectedDashboardName, setSelectedDashboardName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user, userRole, isClient, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthorization = async () => {
            setIsLoading(true);

            if (!loading) {
                if (!user) {
                    navigate('/login');
                    return;
                }

                if (userRole !== 'client' && userRole !== 'admin') {
                    navigate('/not-authorized');
                    return;
                }

                setIsLoading(false);
            }
        };

        checkAuthorization();
    }, [user, userRole, isClient, loading, navigate]);

    const handleDashboardChange = (url: string, name: string) => {
        setDashboardUrl(url);
        setSelectedDashboardName(name);
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
            <DashboardHeader
                onDashboardChange={handleDashboardChange}
                selectedDashboardName={selectedDashboardName}
            />
            <div className="flex-1 overflow-hidden">
                <BIViewer dashboardUrl={dashboardUrl} />
            </div>
        </div>
    );
}
