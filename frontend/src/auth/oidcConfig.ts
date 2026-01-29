/**
 * OIDC (Keycloak) 설정
 * 
 * 환경 변수:
 * - VITE_KEYCLOAK_URL: Keycloak 서버 URL
 * - VITE_KEYCLOAK_REALM: Realm 이름
 * - VITE_KEYCLOAK_CLIENT_ID: Client ID
 * - VITE_SSO_ENABLED: SSO 활성화 여부
 */

import type { AuthProviderProps } from 'react-oidc-context';

export const oidcConfig: AuthProviderProps = {
  authority: `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}`,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'k-ecp-kohub',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  loadUserInfo: true,
};

/**
 * SSO 활성화 여부
 */
export const isSSOEnabled = (): boolean => {
  return import.meta.env.VITE_SSO_ENABLED === 'true';
};
