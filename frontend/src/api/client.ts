import axios from 'axios'

const TOKEN_KEY = 'kohub_access_token'

/**
 * localStorage에서 액세스 토큰 가져오기
 */
function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
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
    if (error.response?.status === 401) {
      console.warn('API 401 Unauthorized - 토큰 만료 가능성')
      // 토큰이 만료되면 로그인 페이지로 리다이렉트
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('kohub_refresh_token')
      localStorage.removeItem('kohub_token_expires_at')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { apiClient as api }
export default apiClient
