import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

/**
 * 메인 앱 컴포넌트
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        {/* 추후 추가될 라우트 */}
        {/* <Route path="hosts" element={<HostList />} /> */}
        {/* <Route path="tickets" element={<TicketList />} /> */}
        {/* <Route path="terminal/:hostId" element={<Terminal />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
