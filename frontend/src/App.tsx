import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { isSSOEnabled } from './auth/oidcConfig'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'

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
          {/* 추후 추가될 라우트 */}
          {/* <Route path="hosts" element={<HostList />} /> */}
          {/* <Route path="tickets" element={<TicketList />} /> */}
          {/* <Route path="terminal/:hostId" element={<Terminal />} /> */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
