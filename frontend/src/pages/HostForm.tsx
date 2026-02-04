import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { createHost, updateHost, getHost, type HostRequest } from '../api/hosts'
import { Card, Loading, Button } from '../components/common'

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
      <div className="p-6 flex justify-center items-center min-h-96">
        <Loading size="lg" text="호스트 정보를 불러오는 중..." />
      </div>
    )
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
          <h1 className="kecp-section-title">
            {isEdit ? '호스트 수정' : '새 호스트 등록'}
          </h1>
          <p className="kecp-section-subtitle">
            {isEdit ? '호스트 정보를 수정합니다' : '관리 대상 서버를 등록합니다'}
          </p>
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
            {/* 호스트 이름 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                호스트 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: web-prod-01"
                className={`kecp-input ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="호스트에 대한 설명"
                rows={3}
                className="kecp-input resize-none"
              />
            </div>

            {/* 연결 유형 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">
                연결 유형
              </label>
              <select
                value={formData.connectionType}
                onChange={(e) => setFormData({ ...formData, connectionType: e.target.value as any })}
                className="kecp-select w-full"
              >
                <option value="SSH">SSH</option>
                <option value="HTTPS">HTTPS</option>
                <option value="AGENT">Agent</option>
              </select>
            </div>

            {/* SSH 설정 */}
            {formData.connectionType === 'SSH' && (
              <div className="p-4 bg-[var(--kecp-gray-50)] rounded-xl space-y-4">
                <h3 className="font-medium text-[var(--kecp-gray-900)]">SSH 설정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--kecp-gray-600)] mb-1">호스트 주소 *</label>
                    <input
                      type="text"
                      value={formData.sshConfig?.host || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        sshConfig: { ...formData.sshConfig!, host: e.target.value }
                      })}
                      placeholder="10.0.0.1"
                      className={`kecp-input ${errors.sshHost ? 'border-red-500' : ''}`}
                    />
                    {errors.sshHost && <p className="mt-1 text-xs text-red-500">{errors.sshHost}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--kecp-gray-600)] mb-1">포트</label>
                    <input
                      type="number"
                      value={formData.sshConfig?.port || 22}
                      onChange={(e) => setFormData({
                        ...formData,
                        sshConfig: { ...formData.sshConfig!, port: parseInt(e.target.value) }
                      })}
                      className="kecp-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--kecp-gray-600)] mb-1">사용자명</label>
                  <input
                    type="text"
                    value={formData.sshConfig?.username || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      sshConfig: { ...formData.sshConfig!, username: e.target.value }
                    })}
                    placeholder="root"
                    className="kecp-input"
                  />
                </div>
              </div>
            )}

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-2">태그</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="태그 입력 후 Enter"
                  className="kecp-input flex-1"
                />
                <Button type="button" variant="secondary" icon={Plus} onClick={handleAddTag}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--kecp-primary-light)] text-[var(--kecp-primary)] rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[var(--kecp-primary-dark)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
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
              icon={Save}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              저장
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
