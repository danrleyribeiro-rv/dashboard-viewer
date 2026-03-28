import LoginForm from '@/components/auth/login-form';
import { Logotype } from '@/components/logotype';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (!loading && user && !isRedirecting) {
            setIsRedirecting(true);
            navigate(user.role === 'admin' ? '/admin/dashboards' : '/dashboard');
        }
    }, [user, loading, navigate, isRedirecting]);

    if (loading || isRedirecting) {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Logotype className="h-20 w-auto mr-4 dark:filter-none" />
                </div>
                <h1 className="text-2xl font-semibold text-center mb-4 dark:text-white">Login</h1>
                <LoginForm />
            </div>
        </div>
    );
}
