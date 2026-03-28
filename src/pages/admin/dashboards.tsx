import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { dashboardsApi, accountsApi, authApi, type Dashboard, type Account, type UsageData, type AccessLog } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logotype } from '@/components/logotype';
import { toast } from 'sonner';
import {
    Trash2Icon, PlusIcon, PencilIcon, XIcon, CheckIcon,
    LayoutDashboardIcon, ArrowLeftIcon, UsersIcon, CopyIcon, KeyRoundIcon,
    BarChart3Icon, ScrollTextIcon,
} from 'lucide-react';

function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '@#$!&';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    pw += specials[Math.floor(Math.random() * specials.length)];
    pw += Math.floor(Math.random() * 10);
    return pw;
}

type Tab = 'dashboards' | 'users' | 'usage' | 'logs';

export default function AdminDashboardsPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('dashboards');
    const [dashboards, setDashboards] = useState<(Dashboard & { user_email?: string })[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [usageData, setUsageData] = useState<UsageData[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

    // Dashboard form
    const [showDashForm, setShowDashForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formUserId, setFormUserId] = useState('');

    // User form
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('client');
    const [generatedPassword, setGeneratedPassword] = useState('');

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            navigate('/not-authorized');
        }
    }, [user, loading, navigate]);

    const fetchData = useCallback(async () => {
        setLoadingData(true);
        try {
            const accs = await accountsApi.list();
            setAccounts(accs);
            const all = await dashboardsApi.listAll();
            const emailMap = new Map(accs.map(a => [a.id, a.email]));
            setDashboards(all.map(d => ({ ...d, user_email: emailMap.get(d.user_id) || d.user_id })));
            const usage = await dashboardsApi.listUsageData();
            setUsageData(usage);
            const logs = await dashboardsApi.listAccessLogs();
            setAccessLogs(logs);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar dados');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user, fetchData]);

    // === Dashboard handlers ===
    const resetDashForm = () => {
        setFormName(''); setFormUrl(''); setFormUserId('');
        setEditingId(null); setShowDashForm(false);
    };

    const handleDashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formUrl || !formUserId) { toast.error('Preencha todos os campos'); return; }
        try {
            if (editingId) {
                await dashboardsApi.update(editingId, { name: formName, iframe_url: formUrl, user_id: formUserId });
                toast.success('Dashboard atualizado');
            } else {
                await dashboardsApi.create({ name: formName, iframe_url: formUrl, user_id: formUserId });
                toast.success('Dashboard criado');
            }
            resetDashForm(); fetchData();
        } catch (error: any) { toast.error(error.message || 'Erro ao salvar'); }
    };

    const handleDashEdit = (d: Dashboard) => {
        setEditingId(d.id); setFormName(d.name); setFormUrl(d.iframe_url);
        setFormUserId(d.user_id); setShowDashForm(true);
    };

    const handleDashDelete = async (id: string) => {
        try { await dashboardsApi.remove(id); toast.success('Dashboard removido'); fetchData(); }
        catch (error: any) { toast.error(error.message || 'Erro ao remover'); }
    };

    // === User handlers ===
    const resetUserForm = () => {
        setUserEmail(''); setUserRole('client'); setGeneratedPassword('');
        setEditingUserId(null); setShowUserForm(false);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userEmail) { toast.error('Informe o email'); return; }

        if (editingUserId) {
            // Editing existing user
            try {
                await accountsApi.update(editingUserId, { email: userEmail, role: userRole });
                toast.success('Usuário atualizado');
                resetUserForm(); fetchData();
            } catch (error: any) { toast.error(error.message || 'Erro ao atualizar'); }
        } else {
            // Creating new user
            const pw = generatePassword();
            try {
                await authApi.register(userEmail, pw, userRole);
                setGeneratedPassword(pw);
                toast.success('Usuário criado com sucesso');
                fetchData();
            } catch (error: any) { toast.error(error.message || 'Erro ao criar usuário'); }
        }
    };

    const handleUserEdit = (a: Account) => {
        setEditingUserId(a.id); setUserEmail(a.email); setUserRole(a.role);
        setGeneratedPassword(''); setShowUserForm(true);
    };

    const handleResetPassword = async (a: Account) => {
        const pw = generatePassword();
        try {
            await accountsApi.update(a.id, { password: pw });
            setEditingUserId(a.id); setUserEmail(a.email);
            setGeneratedPassword(pw); setShowUserForm(true);
            toast.success('Nova senha gerada');
        } catch (error: any) { toast.error(error.message || 'Erro ao gerar senha'); }
    };

    const handleUserDelete = async (id: string) => {
        if (id === user?.id) { toast.error('Você não pode remover sua própria conta'); return; }
        try { await accountsApi.remove(id); toast.success('Usuário removido'); fetchData(); }
        catch (error: any) { toast.error(error.message || 'Erro ao remover'); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado para a área de transferência');
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Logotype className="h-8 w-auto" />
                        <h1 className="text-lg font-semibold dark:text-white">Painel Admin</h1>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-1">
                    <button
                        onClick={() => setTab('dashboards')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            tab === 'dashboards'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        Dashboards ({dashboards.length})
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            tab === 'users'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <UsersIcon className="h-4 w-4" />
                        Usuários ({accounts.length})
                    </button>
                    <button
                        onClick={() => setTab('usage')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            tab === 'usage'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <BarChart3Icon className="h-4 w-4" />
                        Uso ({usageData.length})
                    </button>
                    <button
                        onClick={() => setTab('logs')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            tab === 'logs'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <ScrollTextIcon className="h-4 w-4" />
                        Logs ({accessLogs.length})
                    </button>
                </div>

                {/* === DASHBOARDS TAB === */}
                {tab === 'dashboards' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold dark:text-white">Dashboards</h2>
                            {!showDashForm && (
                                <Button onClick={() => setShowDashForm(true)}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Novo Dashboard
                                </Button>
                            )}
                        </div>

                        {showDashForm && (
                            <form onSubmit={handleDashSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
                                <h3 className="font-semibold dark:text-white">
                                    {editingId ? 'Editar Dashboard' : 'Novo Dashboard'}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                                    <Input placeholder="Ex: Dashboard de Vendas" value={formName} onChange={e => setFormName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Embedded (iframe)</label>
                                    <Input placeholder="https://app.powerbi.com/view?r=..." value={formUrl} onChange={e => setFormUrl(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atribuir a</label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        value={formUserId} onChange={e => setFormUserId(e.target.value)} required
                                    >
                                        <option value="">Selecione um usuário</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.email} ({a.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit"><CheckIcon className="h-4 w-4 mr-2" />{editingId ? 'Salvar' : 'Criar'}</Button>
                                    <Button type="button" variant="ghost" onClick={resetDashForm}><XIcon className="h-4 w-4 mr-2" />Cancelar</Button>
                                </div>
                            </form>
                        )}

                        {dashboards.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                                <LayoutDashboardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Nenhum dashboard cadastrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboards.map(d => (
                                    <div key={d.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h3 className="font-medium dark:text-white truncate">{d.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{d.iframe_url}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Atribuído a: {d.user_email || d.user_id}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => handleDashEdit(d)}><PencilIcon className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDashDelete(d.id)}><Trash2Icon className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* === USERS TAB === */}
                {tab === 'users' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold dark:text-white">Usuários</h2>
                            {!showUserForm && (
                                <Button onClick={() => { setShowUserForm(true); setGeneratedPassword(''); }}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Novo Usuário
                                </Button>
                            )}
                        </div>

                        {showUserForm && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
                                {generatedPassword ? (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-green-600 dark:text-green-400">
                                            {editingUserId ? 'Nova senha gerada!' : 'Usuário criado com sucesso!'}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Copie as credenciais abaixo e envie ao usuário. A senha não poderá ser visualizada novamente.
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 space-y-2 font-mono text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="dark:text-gray-200"><strong>Email:</strong> {userEmail}</span>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userEmail)}>
                                                    <CopyIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="dark:text-gray-200"><strong>Senha:</strong> {generatedPassword}</span>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedPassword)}>
                                                    <CopyIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button onClick={resetUserForm}>Fechar</Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUserSubmit} className="space-y-4">
                                        <h3 className="font-semibold dark:text-white">
                                            {editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
                                        </h3>
                                        {!editingUserId && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                A senha será gerada automaticamente.
                                            </p>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <Input type="email" placeholder="usuario@email.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
                                            <select
                                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                value={userRole} onChange={e => setUserRole(e.target.value)}
                                            >
                                                <option value="client">Cliente</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit">
                                                <CheckIcon className="h-4 w-4 mr-2" />
                                                {editingUserId ? 'Salvar' : 'Criar Usuário'}
                                            </Button>
                                            <Button type="button" variant="ghost" onClick={resetUserForm}>
                                                <XIcon className="h-4 w-4 mr-2" />Cancelar
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {accounts.map(a => (
                                <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium dark:text-white">{a.email}</h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                                a.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            }`}>
                                                {a.role}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {a.id !== user?.id && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleUserEdit(a)} title="Editar">
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleResetPassword(a)} title="Gerar nova senha">
                                                    <KeyRoundIcon className="h-4 w-4 text-amber-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleUserDelete(a.id)} title="Remover">
                                                    <Trash2Icon className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* === USAGE DATA TAB === */}
                {tab === 'usage' && (
                    <>
                        <h2 className="text-lg font-bold dark:text-white mb-4">Dados de Uso</h2>
                        {usageData.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                                <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Nenhum dado de uso registrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {usageData.map(u => {
                                    const userEmail = accounts.find(a => a.id === u.user_id)?.email || u.user_id;
                                    const dashName = dashboards.find(d => d.id === u.dashboard_id)?.name || u.dashboard_id;
                                    return (
                                        <div key={u.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                    {u.event_type}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(u.event_time).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <strong>Usuário:</strong> {userEmail}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <strong>Dashboard:</strong> {dashName}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate">
                                                {u.event_data}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* === ACCESS LOGS TAB === */}
                {tab === 'logs' && (
                    <>
                        <h2 className="text-lg font-bold dark:text-white mb-4">Logs de Acesso</h2>
                        {accessLogs.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                                <ScrollTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Nenhum log de acesso registrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {accessLogs.map(log => {
                                    const userEmail = accounts.find(a => a.id === log.user_id)?.email || log.user_id;
                                    const dashName = dashboards.find(d => d.id === log.dashboard_id)?.name || log.dashboard_id;
                                    const minutes = Math.floor(log.duration / 60);
                                    const seconds = log.duration % 60;
                                    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                                    return (
                                        <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <h3 className="font-medium dark:text-white">{dashName}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Date(log.accessed_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                    {durationStr}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
