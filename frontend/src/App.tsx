import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import HostList from './pages/HostList'
import HostForm from './pages/HostForm'
import HostDetail from './pages/HostDetail'
import TicketList from './pages/TicketList'
import TicketForm from './pages/TicketForm'
import TicketDetail from './pages/TicketDetail'
import MonitoringPage from './pages/MonitoringPage'
import TerminalPage from './pages/TerminalPage'
import SettingsPage from './pages/SettingsPage'
import Profile from './pages/Profile'

/**
 * 인증 필요 라우트 보호 컴포넌트
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--kecp-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * 메인 앱 컴포넌트
 */
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 로그인 페이지 (비인증 접근 가능) */}
        <Route path="/login" element={<Login />} />

        {/* 인증 필요 라우트 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />

          {/* Host 라우트 */}
          <Route path="hosts" element={<HostList />} />
          <Route path="hosts/new" element={<HostForm />} />
          <Route path="hosts/:id" element={<HostDetail />} />
          <Route path="hosts/:id/edit" element={<HostForm />} />

          {/* Ticket 라우트 */}
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<TicketForm />} />
          <Route path="tickets/:id" element={<TicketDetail />} />

          {/* 모니터링/터미널/설정 */}
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="terminal" element={<TerminalPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* 프로필 */}
          <Route path="profile" element={<Profile />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
