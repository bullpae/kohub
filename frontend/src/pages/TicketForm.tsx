import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { createTicket, type TicketRequest } from '../api/tickets'
import { Card, Button } from '../components/common'

export default function TicketForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<TicketRequest>({
    title: '',
    description: '',
    source: 'MANUAL',
    priority: 'MEDIUM',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/tickets/${data.id}`)
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error.message })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = '티켓 제목은 필수입니다'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[var(--kecp-gray-100)] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--kecp-gray-500)]" />
        </button>
        <div>
          <h1 className="kecp-section-title">새 티켓 생성</h1>
          <p className="kecp-section-subtitle">장애 또는 요청 티켓을 수동으로 생성합니다</p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          <div className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 서버 응답 지연"
                className={`kecp-input ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="문제 상황에 대한 상세 설명"
                rows={5}
                className="kecp-input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                  우선순위
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="kecp-select w-full"
                >
                  <option value="CRITICAL">Critical - 서비스 전면 장애</option>
                  <option value="HIGH">High - 주요 기능 장애</option>
                  <option value="MEDIUM">Medium - 일부 기능 장애</option>
                  <option value="LOW">Low - 경미한 이슈</option>
                </select>
              </div>

              {/* 소스 */}
              <div>
                <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                  소스
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                  className="kecp-select w-full"
                >
                  <option value="MANUAL">수동 생성</option>
                  <option value="CUSTOMER_REQUEST">고객 요청</option>
                </select>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[var(--kecp-gray-200)]">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={createMutation.isPending}
            >
              티켓 생성
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
