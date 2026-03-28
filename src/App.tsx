import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth-context'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'
import ForgotPasswordPage from '@/pages/forgot-password'
import ResetPasswordPage from '@/pages/reset-password'
import NotAuthorizedPage from '@/pages/not-authorized'
import PrivatePage from '@/pages/private'
import AuthConfirmPage from '@/pages/auth-confirm'
import AdminDashboardsPage from '@/pages/admin/dashboards'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="/private" element={<PrivatePage />} />
          <Route path="/auth/confirm" element={<AuthConfirmPage />} />
          <Route path="/admin/dashboards" element={<AdminDashboardsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
