import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthConfirmPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');

        if (oobCode) {
            if (mode === 'resetPassword') {
                navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
                return;
            } else if (mode === 'verifyEmail') {
                navigate('/login?verified=true', { replace: true });
                return;
            }
        }

        navigate('/', { replace: true });
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <p className="mt-2 text-gray-700 dark:text-gray-300">Redirecionando...</p>
            </div>
        </div>
    );
}
