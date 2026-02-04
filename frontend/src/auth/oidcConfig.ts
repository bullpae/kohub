import { WebStorageStateStore } from 'oidc-client-ts'

/**
 * OIDC 설정 (Keycloak k-ecp-kohub 클라이언트)
 */
export const oidcConfig = {
  authority: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}`,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'k-ecp-kohub',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  
  // Keycloak 특화 설정
  metadata: {
    issuer: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}`,
    authorization_endpoint: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}/protocol/openid-connect/auth`,
    token_endpoint: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}/protocol/openid-connect/token`,
    userinfo_endpoint: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}/protocol/openid-connect/userinfo`,
    end_session_endpoint: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}/protocol/openid-connect/logout`,
    jwks_uri: `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'}/protocol/openid-connect/certs`,
  },
}

/**
 * SSO 활성화 여부 (환경변수로 제어)
 */
export function isSSOEnabled(): boolean {
  return import.meta.env.VITE_SSO_ENABLED === 'true'
}

// 별칭 (호환성)
export const isSsoEnabled = isSSOEnabled()
