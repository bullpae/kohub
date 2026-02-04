import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { createTicket, type TicketRequest } from '../api/tickets'

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

    // 유효성 검사
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
    <div className="p-6 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 티켓 생성</h1>
          <p className="text-gray-500 mt-1">장애 또는 요청 티켓을 수동으로 생성합니다</p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 서버 응답 지연"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="문제 상황에 대한 상세 설명"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CRITICAL">Critical - 서비스 전면 장애</option>
                <option value="HIGH">High - 주요 기능 장애</option>
                <option value="MEDIUM">Medium - 일부 기능 장애</option>
                <option value="LOW">Low - 경미한 이슈</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소스
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MANUAL">수동 생성</option>
                <option value="CUSTOMER_REQUEST">고객 요청</option>
              </select>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {createMutation.isPending ? '생성 중...' : '티켓 생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
