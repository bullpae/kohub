import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Server, 
  TicketCheck, 
  Terminal,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '호스트', href: '/hosts', icon: Server },
  { name: '티켓', href: '/tickets', icon: TicketCheck },
  { name: '터미널', href: '/terminal', icon: Terminal },
  { name: '설정', href: '/settings', icon: Settings },
]

/**
 * 메인 레이아웃 컴포넌트
 */
export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 로고 */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900">kohub</span>
          </Link>
          <button 
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="lg:pl-64">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <button 
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1" />
          
          {/* 사용자 메뉴 (추후 구현) */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
