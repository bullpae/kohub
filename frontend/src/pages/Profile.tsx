import { useState, FormEvent } from 'react'
import { User, Mail, Shield, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/auth'

/**
 * 프로필 설정 페이지
 * - 사용자 정보 표시
 * - 비밀번호 변경 기능
 */
export default function Profile() {
  const { currentUser } = useAuth()

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const userName = currentUser?.name || '사용자'
  const userEmail = currentUser?.email || '-'
  const userRole = currentUser?.roleLabel || 'Member'
  const userRoles = currentUser?.roles?.filter(r => !r.startsWith('default-')) || []

  const roleDisplayMap: Record<string, string> = {
    admin: '시스템 관리자',
    operator: '운영자',
    partner: '파트너(담당자)',
    customer_admin: '고객 관리자',
    member: '일반 회원',
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword.trim()) {
      setError('현재 비밀번호를 입력해주세요.')
      return
    }
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
    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
      return
    }

    setLoading(true)
    try {
      const username = currentUser?.email || currentUser?.name || ''
      const response = await changePassword(username, currentPassword, newPassword)
      if (response.success) {
        setSuccess('비밀번호가 변경되었습니다.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--kecp-gray-900)]">프로필 설정</h1>
        <p className="text-sm text-[var(--kecp-gray-500)] mt-1">계정 정보를 확인하고 비밀번호를 변경할 수 있습니다.</p>
      </div>

      {/* 사용자 정보 카드 */}
      <div className="bg-white rounded-xl border border-[var(--kecp-gray-200)] overflow-hidden">
        {/* 프로필 헤더 */}
        <div className="bg-gradient-to-r from-[var(--kecp-primary)] to-[var(--kecp-secondary)] p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold border-2 border-white/40">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-white/80 text-sm">{userRole}</p>
            </div>
          </div>
        </div>

        {/* 정보 목록 */}
        <div className="divide-y divide-[var(--kecp-gray-100)]">
          <div className="flex items-center gap-3 px-6 py-4">
            <User className="w-5 h-5 text-[var(--kecp-gray-400)]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--kecp-gray-500)]">이름</p>
              <p className="text-sm font-medium text-[var(--kecp-gray-900)]">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Mail className="w-5 h-5 text-[var(--kecp-gray-400)]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--kecp-gray-500)]">이메일</p>
              <p className="text-sm font-medium text-[var(--kecp-gray-900)]">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Shield className="w-5 h-5 text-[var(--kecp-gray-400)]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--kecp-gray-500)]">역할</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {userRoles.map(role => (
                  <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--kecp-primary-light)] text-[var(--kecp-primary)]">
                    {roleDisplayMap[role] || role}
                  </span>
                ))}
                {userRoles.length === 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--kecp-gray-100)] text-[var(--kecp-gray-600)]">
                    {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 카드 */}
      <div className="bg-white rounded-xl border border-[var(--kecp-gray-200)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--kecp-gray-100)]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--kecp-gray-700)]" />
            <h3 className="text-lg font-semibold text-[var(--kecp-gray-900)]">비밀번호 변경</h3>
          </div>
          <p className="text-sm text-[var(--kecp-gray-500)] mt-1">보안을 위해 주기적으로 비밀번호를 변경해주세요.</p>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">현재 비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                className="w-full pl-10 pr-12 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)]"
              >
                {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">새 비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (8자 이상)"
                className="w-full pl-10 pr-12 py-3 border border-[var(--kecp-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kecp-primary)] focus:border-transparent text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)]"
              >
                {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">새 비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
              <input
                type={showNewPw ? 'text' : 'password'}
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
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--kecp-primary)] text-white rounded-lg font-medium hover:bg-[var(--kecp-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  비밀번호 변경
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
