import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export default function PrivatePage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
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

    return <p>Hello {user?.email}</p>;
}
