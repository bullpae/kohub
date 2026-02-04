import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { Loading } from '../components/common'

/**
 * SSO 콜백 페이지
 * Keycloak 로그인 후 리다이렉트되는 페이지
 */
export default function Callback() {
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        // 로그인 성공 → 대시보드로 이동
        navigate('/', { replace: true })
      } else if (auth.error) {
        // 로그인 실패 → 에러 표시
        console.error('Login failed:', auth.error)
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, navigate])

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--kecp-gray-50)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">로그인 오류</h1>
          <p className="text-[var(--kecp-gray-600)] mb-4">{auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="kecp-btn-primary"
          >
            다시 로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kecp-gray-50)]">
      <Loading size="lg" text="로그인 중..." />
    </div>
  )
}
