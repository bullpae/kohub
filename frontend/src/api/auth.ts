import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface LoginResponse {
  success: boolean
  message: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  passwordChangeRequired: boolean
}

/**
 * 아이디/비밀번호 로그인 (Keycloak Direct Access Grants)
 */
export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${API_BASE}/api/v1/auth/login`, {
    username,
    password,
  })
  return res.data
}

/**
 * 비밀번호 변경 (초기 비밀번호 변경)
 */
export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${API_BASE}/api/v1/auth/change-password`, {
    username,
    currentPassword,
    newPassword,
  })
  return res.data
}

/**
 * 리프레시 토큰으로 액세스 토큰 갱신
 */
export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${API_BASE}/api/v1/auth/refresh`, {
    refreshToken,
  })
  return res.data
}
