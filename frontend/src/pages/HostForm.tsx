import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'
import { createHost, updateHost, getHost, type HostRequest } from '../api/hosts'

export default function HostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState<HostRequest>({
    name: '',
    description: '',
    connectionType: 'SSH',
    sshConfig: {
      host: '',
      port: 22,
      username: 'root',
    },
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 수정 모드: 기존 데이터 로드
  const { data: existingHost, isLoading } = useQuery({
    queryKey: ['host', id],
    queryFn: () => getHost(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existingHost) {
      setFormData({
        name: existingHost.name,
        description: existingHost.description || '',
        connectionType: existingHost.connectionType,
        sshConfig: existingHost.sshConfig || { host: '', port: 22, username: 'root' },
        tags: existingHost.tags || [],
      })
    }
  }, [existingHost])

  const createMutation = useMutation({
    mutationFn: createHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
      navigate('/hosts')
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error.message })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: HostRequest) => updateHost(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
      queryClient.invalidateQueries({ queryKey: ['host', id] })
      navigate(`/hosts/${id}`)
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
    if (!formData.name.trim()) {
      newErrors.name = '호스트 이름은 필수입니다'
    }
    if (formData.connectionType === 'SSH' && !formData.sshConfig?.host) {
      newErrors.sshHost = 'SSH 호스트 주소는 필수입니다'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isEdit) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    })
  }

  if (isEdit && isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? '호스트 수정' : '새 호스트 등록'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? '호스트 정보를 수정합니다' : '관리 대상 서버를 등록합니다'}
          </p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              호스트 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: web-prod-01"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="호스트에 대한 설명"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연결 유형
            </label>
            <select
              value={formData.connectionType}
              onChange={(e) => setFormData({ ...formData, connectionType: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SSH">SSH</option>
              <option value="HTTPS">HTTPS</option>
              <option value="AGENT">Agent</option>
            </select>
          </div>

          {/* SSH 설정 */}
          {formData.connectionType === 'SSH' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">SSH 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">호스트 주소 *</label>
                  <input
                    type="text"
                    value={formData.sshConfig?.host || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      sshConfig: { ...formData.sshConfig!, host: e.target.value }
                    })}
                    placeholder="10.0.0.1"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      errors.sshHost ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.sshHost && <p className="mt-1 text-sm text-red-500">{errors.sshHost}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">포트</label>
                  <input
                    type="number"
                    value={formData.sshConfig?.port || 22}
                    onChange={(e) => setFormData({
                      ...formData,
                      sshConfig: { ...formData.sshConfig!, port: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">사용자명</label>
                <input
                  type="text"
                  value={formData.sshConfig?.username || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    sshConfig: { ...formData.sshConfig!, username: e.target.value }
                  })}
                  placeholder="root"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="태그 입력 후 Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
