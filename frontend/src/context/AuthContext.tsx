import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { isSSOEnabled } from '../auth/oidcConfig';

// 역할별 메뉴 설정
interface MenuItem {
  path: string;
  label: string;
  icon: string;
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
};

// 개발용 Mock 사용자
const mockUsers = [
  { id: '1', name: '관리자', email: 'admin@kohub.io', role: 'admin', roleLabel: 'Admin' },
  { id: '2', name: '운영자', email: 'operator@kohub.io', role: 'operator', roleLabel: 'Operator' },
  { id: '3', name: '사용자', email: 'user@kohub.io', role: 'member', roleLabel: 'Member' },
];

// AuthContext 타입
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  roles?: string[];
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  login: () => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  getMenus: () => MenuItem[];
  isAdmin: () => boolean;
  isOperator: () => boolean;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * SSO 인증 Provider (Keycloak 연동)
 */
function SSOAuthProvider({ children }: { children: ReactNode }) {
  const oidcAuth = useOIDCAuth();

  const value = useMemo<AuthContextType>(() => {
    // 로딩 중
    if (oidcAuth.isLoading) {
      return {
        isLoading: true,
        isAuthenticated: false,
        currentUser: null,
        users: [],
        login: () => {},
        logout: () => {},
        switchUser: () => {},
        getMenus: () => [],
        isAdmin: () => false,
        isOperator: () => false,
        getAccessToken: () => null,
      };
    }

    // 인증되지 않음
    if (!oidcAuth.isAuthenticated || !oidcAuth.user) {
      return {
        isLoading: false,
        isAuthenticated: false,
        currentUser: null,
        users: [],
        login: () => oidcAuth.signinRedirect(),
        logout: () => {},
        switchUser: () => {},
        getMenus: () => roleMenus.member,
        isAdmin: () => false,
        isOperator: () => false,
        getAccessToken: () => null,
      };
    }

    // 인증됨 - Keycloak 토큰에서 사용자 정보 추출
    const profile = oidcAuth.user.profile;
    const realmAccess = profile?.realm_access as { roles?: string[] } | undefined;
    const realmRoles = realmAccess?.roles || [];

    // Keycloak 역할 → 앱 역할 매핑
    let role = 'member';
    if (realmRoles.includes('admin')) role = 'admin';
    else if (realmRoles.includes('operator')) role = 'operator';

    const currentUser: User = {
      id: profile.sub || '',
      email: profile.email || '',
      name: profile.name || profile.preferred_username || '',
      role,
      roleLabel: role.charAt(0).toUpperCase() + role.slice(1),
      roles: realmRoles,
    };

    return {
      isLoading: false,
      isAuthenticated: true,
      currentUser,
      users: [],
      login: () => oidcAuth.signinRedirect(),
      logout: () => oidcAuth.signoutRedirect(),
      switchUser: () => {},
      getMenus: () => roleMenus[role] || roleMenus.member,
      isAdmin: () => realmRoles.includes('admin'),
      isOperator: () => realmRoles.includes('operator') || realmRoles.includes('admin'),
      getAccessToken: () => oidcAuth.user?.access_token || null,
    };
  }, [oidcAuth.isLoading, oidcAuth.isAuthenticated, oidcAuth.user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Mock 인증 Provider (개발용)
 */
function MockAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);

  const switchUser = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const value: AuthContextType = {
    isLoading: false,
    isAuthenticated: true,
    currentUser,
    users: mockUsers,
    login: () => {},
    logout: () => {},
    switchUser,
    getMenus: () => roleMenus[currentUser.role] || roleMenus.member,
    isAdmin: () => currentUser.role === 'admin',
    isOperator: () => ['admin', 'operator'].includes(currentUser.role),
    getAccessToken: () => null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 통합 AuthProvider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (isSSOEnabled()) {
    return <SSOAuthProvider>{children}</SSOAuthProvider>;
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
