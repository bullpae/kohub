/**
 * Keycloak 설정 (참조용)
 * 자체 로그인 방식으로 전환되어 OIDC 리다이렉트는 사용하지 않음.
 * Backend가 Keycloak Direct Access Grants로 토큰을 발급하며,
 * Frontend는 해당 JWT 토큰을 localStorage에 저장하여 사용.
 */
export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'k-ecp-kohub',
}
