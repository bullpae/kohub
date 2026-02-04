import axios from 'axios'
import { User } from 'oidc-client-ts'
import { isSSOEnabled } from '../auth/oidcConfig'

/**
 * OIDC 스토리지에서 토큰 가져오기
 */
function getAccessToken(): string | null {
  if (!isSSOEnabled()) {
    return null // Mock 모드에서는 토큰 없음
  }
  
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'k-ecp'
  const authority = `${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'}/realms/${realm}`
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'k-ecp-kohub'
  
  // OIDC 라이브러리가 사용하는 키 형식
  const storageKey = `oidc.user:${authority}:${clientId}`
  const userJson = localStorage.getItem(storageKey)
  
  if (userJson) {
    try {
      const user = User.fromStorageString(userJson)
      return user.access_token
    } catch {
      return null
    }
  }
  return null
}

/**
 * API 클라이언트
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 (인증 토큰 추가)
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && isSSOEnabled()) {
      // 인증 만료 시 - OIDC가 자동 갱신 처리
      console.warn('API 401 Unauthorized - 토큰 만료 가능성')
    }
    return Promise.reject(error)
  }
)

export { apiClient as api }
export default apiClient
