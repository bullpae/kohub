import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Server, 
  TicketCheck, 
  Terminal,
  Settings,
  Menu,
  X,
  Bell,
  ChevronDown,
  ExternalLink,
  User,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '호스트', href: '/hosts', icon: Server },
  { name: '티켓', href: '/tickets', icon: TicketCheck },
  { name: '터미널', href: '/terminal', icon: Terminal },
  { name: '설정', href: '/settings', icon: Settings },
]

/**
 * K-ECP 스타일 메인 레이아웃
 */
export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { currentUser, logout } = useAuth()

  // 사용자 표시 정보
  const userName = currentUser?.name || '사용자'
  const userRoleLabel = currentUser?.roleLabel || 'Member'

  return (
    <div className="min-h-screen bg-[var(--kecp-gray-50)]">
      {/* Top Bar */}
      <div className="bg-[var(--kecp-gray-900)] text-white hidden lg:block">
        <div className="max-w-full mx-auto px-4 lg:px-6 h-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <a href="https://kecp.kdn.com" target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-1 hover:text-[var(--kecp-secondary)] transition-colors">
              K-ECP 메인 <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[var(--kecp-gray-500)]">|</span>
            <a href="/kusthub" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-[var(--kecp-secondary)] transition-colors">
              고객센터 (KustHub) <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--kecp-gray-400)]">운영센터 운영시간: 24/7</span>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[var(--kecp-gray-200)]
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:fixed lg:top-8
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 로고 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--kecp-gray-200)]">
          <Link to="/" className="flex items-center">
            <Logo size="default" showSubtitle />
          </Link>
          <button 
            className="lg:hidden p-2 text-[var(--kecp-gray-500)] hover:text-[var(--kecp-gray-700)] hover:bg-[var(--kecp-gray-100)] rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' 
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* 사이드바 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--kecp-gray-200)]">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--kecp-gray-50)]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--kecp-primary)] to-[var(--kecp-secondary)] flex items-center justify-center text-white font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--kecp-gray-900)] truncate">{userName}</p>
              <p className="text-xs text-[var(--kecp-gray-500)]">{userRoleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="lg:pl-64 lg:pt-8">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-[var(--kecp-gray-200)] lg:px-6">
          <button 
            className="lg:hidden p-2 -ml-2 text-[var(--kecp-gray-500)] hover:text-[var(--kecp-gray-700)] hover:bg-[var(--kecp-gray-100)] rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* 모바일 로고 */}
          <div className="lg:hidden flex-1 flex justify-center">
            <Link to="/">
              <Logo size="sm" />
            </Link>
          </div>
          
          {/* 데스크톱 빈 공간 */}
          <div className="hidden lg:block flex-1" />
          
          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            {/* 알림 */}
            <button className="p-2 rounded-lg hover:bg-[var(--kecp-gray-100)] relative">
              <Bell className="w-5 h-5 text-[var(--kecp-gray-500)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* 사용자 메뉴 */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--kecp-gray-100)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--kecp-primary)] to-[var(--kecp-secondary)] flex items-center justify-center text-white text-sm font-bold">
                  {userName.charAt(0)}
                </div>
                <span className="hidden md:block text-sm font-medium text-[var(--kecp-gray-700)]">
                  {userName}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--kecp-gray-400)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 드롭다운 */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--kecp-gray-200)] overflow-hidden z-50">
                    <div className="p-3 bg-gradient-to-r from-[var(--kecp-primary)] to-[var(--kecp-secondary)] text-white">
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-white/80">{userRoleLabel}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-[var(--kecp-gray-100)]">
                        <User className="w-4 h-4 text-[var(--kecp-gray-500)]" />
                        <span className="text-sm text-[var(--kecp-gray-700)]">프로필 설정</span>
                      </button>
                      <button 
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-red-50 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">로그아웃</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

        {/* 푸터 */}
        <footer className="hidden lg:block bg-[var(--kecp-gray-900)] text-white mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo size="sm" />
                <span className="text-sm text-[var(--kecp-gray-400)]">MSP 통합 운영 플랫폼</span>
              </div>
              <p className="text-sm text-[var(--kecp-gray-500)]">
                &copy; 2026 kohub. Powered by K-ECP.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
