import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword as changePasswordApi } from '../api/auth'
import Logo from '../components/Logo'

/**
 * 자체 로그인 페이지
 * - Keycloak Direct Access Grants를 통한 아이디/비밀번호 로그인
 * - 비밀번호 변경 필요 시 변경 폼 표시
 */
export default function Login() {
  const navigate = useNavigate()
  const { loginWithCredentials } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 비밀번호 변경 상태
  const [passwordChangeMode, setPasswordChangeMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('아이디를 입력해주세요.')
      return
    }
    if (!form.password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      await loginWithCredentials(form.username, form.password)
      navigate('/')
    } catch (err: any) {
      // 비밀번호 변경 필요 감지
      if (err.passwordChangeRequired) {
        setPasswordChangeMode(true)
        setError('')
      } else {
        setError(err.message || '아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }
    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    try {
      const response = await changePasswordApi(form.username, form.password, newPassword)
      if (response.success) {
        // 비밀번호 변경 성공 → 자동 로그인
        setSuccessMessage('비밀번호가 변경되었습니다. 로그인합니다...')
        setTimeout(async () => {
          try {
            await loginWithCredentials(form.username, newPassword)
            navigate('/')
          } catch {
            setPasswordChangeMode(false)
            setSuccessMessage('')
            setError('자동 로그인에 실패했습니다. 새 비밀번호로 다시 로그인해주세요.')
          }
        }, 1000)
      } else {
        setError(response.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '비밀번호 변경에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setPasswordChangeMode(false)
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--kecp-gray-50)] to-[var(--kecp-gray-100)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 + 제목 */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-block">
            <Logo size="default" showSubtitle />
          </Link>
          <p className="mt-3 text-[var(--kecp-gray-600)]">MSP 통합 운영 플랫폼</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--kecp-gray-200)] p-8">
          {passwordChangeMode ? (
            /* ===== 비밀번호 변경 폼 ===== */
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                  <KeyRound className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-[var(--kecp-gray-900)]">비밀번호 변경</h2>
                <p className="text-sm text-[var(--kecp-gray-500)] mt-1">
                  보안을 위해 비밀번호를 변경해주세요.
                </p>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* 현재 계정 표시 */}
                <div className="p-3 bg-[var(--kecp-gray-50)] rounded-lg">
                  <p className="text-xs text-[var(--kecp-gray-500)]">로그인 계정</p>
                  <p className="text-sm font-medium text-[var(--kecp-gray-900)]">{form.username}</p>
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">새 비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 (8자 이상)"
                      className="w-full pl-10 pr-12 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)]"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">비밀번호 확인</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="w-full pl-10 pr-4 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                {/* 변경 버튼 */}
                <button
                  type="submit"
                  disabled={loading || !!successMessage}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--kecp-primary)] text-white rounded-lg font-medium hover:bg-[var(--kecp-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      비밀번호 변경
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4">
                <button
                  onClick={handleBackToLogin}
                  className="w-full text-center text-sm text-[var(--kecp-gray-500)] hover:text-[var(--kecp-gray-700)] transition-colors"
                >
                  로그인 화면으로 돌아가기
                </button>
              </div>
            </>
          ) : (
            /* ===== 로그인 폼 ===== */
            <>
              <h2 className="text-xl font-bold text-[var(--kecp-gray-900)] mb-6 text-center">로그인</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 아이디 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">아이디</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="아이디를 입력하세요"
                      className="w-full pl-10 pr-4 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                {/* 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full pl-10 pr-12 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--kecp-primary)] text-white rounded-lg font-medium hover:bg-[var(--kecp-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      로그인
                    </>
                  )}
                </button>
              </form>

              {/* 안내 문구 */}
              <div className="mt-6 text-center text-sm text-[var(--kecp-gray-500)]">
                <p>계정이 없으신 경우 시스템 관리자에게 문의하세요.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
