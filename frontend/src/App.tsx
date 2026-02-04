import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { isSSOEnabled } from './auth/oidcConfig'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'
import HostList from './pages/HostList'
import HostForm from './pages/HostForm'
import HostDetail from './pages/HostDetail'
import TicketList from './pages/TicketList'
import TicketForm from './pages/TicketForm'
import TicketDetail from './pages/TicketDetail'

/**
 * 메인 앱 컴포넌트
 */
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* SSO Callback - Keycloak 로그인 후 리다이렉트 */}
        {isSSOEnabled() && <Route path="/callback" element={<Callback />} />}
        
        <Route path="/" element={<Layout />}>
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
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
