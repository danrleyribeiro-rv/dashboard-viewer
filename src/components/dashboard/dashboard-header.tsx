import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../auth/logout-button-form';
import DashboardSelector from './dashboard-selector';
import { Logotype } from '@/components/logotype';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/auth-context';
import { SunIcon, MoonIcon, SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
    onDashboardChange?: (url: string, dashboardName: string) => void;
    clientName?: string | null;
    showSelector?: boolean;
    selectedDashboardName?: string | null;
}

const companyName = import.meta.env.VITE_COMPANY_NAME || "Dashboard";

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onDashboardChange, clientName, showSelector = true, selectedDashboardName }) => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-2 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <Logotype className="h-8 w-auto mr-4 dark:filter-none" />
                    <span className="text-lg font-semibold dark:text-white">{companyName}</span>
                </div>

                <div className="flex items-center flex-grow justify-center">
                    {showSelector && onDashboardChange && <DashboardSelector onDashboardChange={onDashboardChange} />}
                </div>

                <div className="flex items-center space-x-1">
                    {user?.role === 'admin' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin/dashboards')}
                            aria-label="Gerenciar Dashboards"
                        >
                            <SettingsIcon className="h-5 w-5" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Trocar tema"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="h-5 w-5" />
                        ) : (
                            <MoonIcon className="h-5 w-5" />
                        )}
                    </Button>

                    <LogoutButton />
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
