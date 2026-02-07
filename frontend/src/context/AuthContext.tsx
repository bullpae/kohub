import { createContext, useContext, useMemo, useState, useCallback, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, refreshAccessToken } from '../api/auth'
import { jwtDecode } from 'jwt-decode'

// localStorage 키
const TOKEN_KEY = 'kohub_access_token'
const REFRESH_KEY = 'kohub_refresh_token'
const EXPIRES_KEY = 'kohub_token_expires_at'

// 역할별 메뉴 설정
interface MenuItem {
  path: string
  label: string
  icon: string
}

const roleMenus: Record<string, MenuItem[]> = {
  admin: [
    { path: '/', label: '대시보드', icon: 'LayoutDashboard' },
    { path: '/operations', label: '운영 관리', icon: 'Settings' },
    { path: '/monitoring', label: '모니터링', icon: 'Activity' },
    { path: '/users', label: '사용자 관리', icon: 'Users' },
  ],
  operator: [
    { path: '/', label: '대시보드', icon: 'LayoutDashboard' },
    { path: '/operations', label: '운영 관리', icon: 'Settings' },
    { path: '/monitoring', label: '모니터링', icon: 'Activity' },
  ],
  member: [
    { path: '/', label: '대시보드', icon: 'LayoutDashboard' },
    { path: '/my-resources', label: '내 리소스', icon: 'Server' },
  ],
}

// JWT 디코딩 결과 타입
interface JwtPayload {
  sub?: string
  preferred_username?: string
  name?: string
  email?: string
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  exp?: number
}

// AuthContext 타입
interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  roleLabel: string
  roles?: string[]
}

interface AuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  currentUser: User | null
  users: User[]
  login: () => void
  logout: () => void
  switchUser: (userId: string) => void
  loginWithCredentials: (username: string, password: string) => Promise<void>
  getMenus: () => MenuItem[]
  isAdmin: () => boolean
  isOperator: () => boolean
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * JWT 토큰에서 사용자 정보를 추출
 */
function extractUserFromToken(token: string): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const realmRoles = decoded.realm_access?.roles || []

    // Keycloak 역할 → 앱 역할 매핑
    let role = 'member'
    if (realmRoles.includes('admin')) role = 'admin'
    else if (realmRoles.includes('operator')) role = 'operator'

    return {
      id: decoded.sub || '',
      username: decoded.preferred_username || '',
      name: decoded.name || decoded.preferred_username || '',
      email: decoded.email || '',
      role,
      roleLabel: role.charAt(0).toUpperCase() + role.slice(1),
      roles: realmRoles,
    }
  } catch {
    return null
  }
}

/**
 * 토큰 기반 인증 Provider (자체 로그인)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_KEY))
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number>(() => {
    const stored = localStorage.getItem(EXPIRES_KEY)
    return stored ? parseInt(stored, 10) : 0
  })
  const [isLoading, setIsLoading] = useState(false)

  // 토큰 저장
  const saveTokens = useCallback((loginResponse: { accessToken: string; refreshToken: string; expiresIn: number }) => {
    const expiresAt = Date.now() + loginResponse.expiresIn * 1000
    localStorage.setItem(TOKEN_KEY, loginResponse.accessToken)
    localStorage.setItem(REFRESH_KEY, loginResponse.refreshToken)
    localStorage.setItem(EXPIRES_KEY, expiresAt.toString())
    setAccessToken(loginResponse.accessToken)
    setRefreshToken(loginResponse.refreshToken)
    setTokenExpiresAt(expiresAt)
  }, [])

  // 토큰 삭제
  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    setAccessToken(null)
    setRefreshToken(null)
    setTokenExpiresAt(0)
  }, [])

  // 로그인
  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password)
    if (response.passwordChangeRequired) {
      // 비밀번호 변경 필요 → Login.tsx에서 처리하도록 특수 에러 throw
      const err = new Error(response.message || '비밀번호 변경이 필요합니다.') as any
      err.passwordChangeRequired = true
      throw err
    }
    if (!response.success) {
      throw new Error(response.message || '로그인에 실패했습니다.')
    }
    saveTokens(response)
  }, [saveTokens])

  // 자동 토큰 갱신
  useEffect(() => {
    if (!refreshToken || !tokenExpiresAt) return

    // 만료 60초 전에 갱신
    const timeUntilRefresh = tokenExpiresAt - Date.now() - 60000
    if (timeUntilRefresh <= 0) {
      // 이미 만료되었거나 곧 만료 - 즉시 갱신 시도
      refreshAccessToken(refreshToken)
        .then(response => {
          if (response.success) {
            saveTokens(response)
          } else {
            clearTokens()
          }
        })
        .catch(() => clearTokens())
      return
    }

    const timer = setTimeout(() => {
      if (refreshToken) {
        refreshAccessToken(refreshToken)
          .then(response => {
            if (response.success) {
              saveTokens(response)
            } else {
              clearTokens()
            }
          })
          .catch(() => clearTokens())
      }
    }, timeUntilRefresh)

    return () => clearTimeout(timer)
  }, [refreshToken, tokenExpiresAt, saveTokens, clearTokens])

  // 현재 사용자 정보
  const currentUser = useMemo(() => {
    if (!accessToken) return null
    return extractUserFromToken(accessToken)
  }, [accessToken])

  const isAuthenticated = !!accessToken && !!currentUser

  const value = useMemo<AuthContextType>(() => ({
    isLoading,
    isAuthenticated,
    currentUser,
    users: [],
    login: () => navigate('/login'),
    logout: () => {
      clearTokens()
      navigate('/login')
    },
    switchUser: () => {},
    loginWithCredentials,
    getMenus: () => roleMenus[currentUser?.role || 'member'] || roleMenus.member,
    isAdmin: () => currentUser?.roles?.includes('admin') || false,
    isOperator: () => currentUser?.roles?.includes('operator') || currentUser?.roles?.includes('admin') || false,
    getAccessToken: () => accessToken,
  }), [isLoading, isAuthenticated, currentUser, accessToken, loginWithCredentials, clearTokens, navigate])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
