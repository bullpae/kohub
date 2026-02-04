import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, Terminal, Server, Globe, Clock, Tag, Plus, Activity, AlertCircle, Link2, Unlink, X } from 'lucide-react'
import { useState } from 'react'
import { getHost, deleteHost, changeHostStatus, getHostAdapters, createHostAdapter, deleteHostAdapter, getTerminalUrl, HostAdapter, HostAdapterRequest } from '../api/hosts'
import { Card, CardHeader, StatusBadge, Loading, Button } from '../components/common'

// 어댑터 타입별 정보
const ADAPTER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'uptime-kuma': { name: 'Uptime Kuma', icon: '📊', color: 'bg-green-100 text-green-800' },
  'termix': { name: 'Termix', icon: '💻', color: 'bg-blue-100 text-blue-800' },
  'prometheus': { name: 'Prometheus', icon: '🔥', color: 'bg-orange-100 text-orange-800' },
}

export default function HostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddAdapter, setShowAddAdapter] = useState(false)
  const [newAdapterType, setNewAdapterType] = useState('uptime-kuma')
  const [newExternalId, setNewExternalId] = useState('')

  const { data: host, isLoading, error } = useQuery({
    queryKey: ['host', id],
    queryFn: () => getHost(id!),
    enabled: !!id,
  })

  const { data: adapters = [], isLoading: adaptersLoading } = useQuery({
    queryKey: ['host-adapters', id],
    queryFn: () => getHostAdapters(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
      navigate('/hosts')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeHostStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host', id] })
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
    },
  })

  const addAdapterMutation = useMutation({
    mutationFn: (request: HostAdapterRequest) => createHostAdapter(id!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-adapters', id] })
      setShowAddAdapter(false)
      setNewAdapterType('uptime-kuma')
      setNewExternalId('')
    },
  })

  const deleteAdapterMutation = useMutation({
    mutationFn: (adapterId: string) => deleteHostAdapter(id!, adapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-adapters', id] })
    },
  })

  const terminalMutation = useMutation({
    mutationFn: () => getTerminalUrl(id!),
    onSuccess: (data) => {
      // 새 창에서 터미널 열기
      window.open(data.url, '_blank', 'width=1024,height=768')
    },
    onError: () => {
      alert('터미널 URL 생성에 실패했습니다. Termix 연동이 필요합니다.')
    },
  })

  const handleDelete = () => {
    if (confirm(`"${host?.name}" 호스트를 삭제하시겠습니까?`)) {
      deleteMutation.mutate()
    }
  }

  const handleAddAdapter = () => {
    addAdapterMutation.mutate({
      adapterType: newAdapterType,
      externalId: newExternalId || undefined,
    })
  }

  const handleDeleteAdapter = (adapter: HostAdapter) => {
    if (confirm(`"${ADAPTER_INFO[adapter.adapterType]?.name || adapter.adapterType}" 연동을 해제하시겠습니까?`)) {
      deleteAdapterMutation.mutate(adapter.id)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <Loading size="lg" text="호스트 정보를 불러오는 중..." />
      </div>
    )
  }

  if (error || !host) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">호스트 정보를 불러오는데 실패했습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/hosts')}
            className="p-2 hover:bg-[var(--kecp-gray-100)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--kecp-gray-500)]" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--kecp-primary)] to-[var(--kecp-secondary)] flex items-center justify-center">
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--kecp-gray-900)]">{host.name}</h1>
                <StatusBadge status={host.status} />
              </div>
              {host.description && (
                <p className="text-[var(--kecp-gray-500)] mt-1">{host.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="primary"
            icon={Terminal}
            onClick={() => terminalMutation.mutate()}
            loading={terminalMutation.isPending}
          >
            터미널
          </Button>
          <Link to={`/hosts/${id}/edit`}>
            <Button variant="secondary" icon={Edit}>
              수정
            </Button>
          </Link>
          <Button variant="danger" icon={Trash2} onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 호스트 정보 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="연결 정보" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">연결 유형</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--kecp-gray-400)]" />
                  <span className="text-[var(--kecp-gray-900)] font-medium">{host.connectionType}</span>
                </div>
              </div>
              {host.sshConfig && (
                <>
                  <div>
                    <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">SSH 주소</p>
                    <p className="text-[var(--kecp-gray-900)] font-mono">
                      {host.sshConfig.host}:{host.sshConfig.port}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">사용자</p>
                    <p className="text-[var(--kecp-gray-900)] font-mono">{host.sshConfig.username}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="시간 정보" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">생성일</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--kecp-gray-400)]" />
                  <span className="text-[var(--kecp-gray-900)]">
                    {new Date(host.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">수정일</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--kecp-gray-400)]" />
                  <span className="text-[var(--kecp-gray-900)]">
                    {new Date(host.updatedAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 태그 */}
          {host.tags && host.tags.length > 0 && (
            <Card>
              <CardHeader title="태그" />
              <div className="flex flex-wrap gap-2">
                {host.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--kecp-primary-light)] text-[var(--kecp-primary)] rounded-full text-sm font-medium"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* 연동 도구 */}
          <Card>
            <CardHeader 
              title="연동 도구" 
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Plus}
                  onClick={() => setShowAddAdapter(true)}
                >
                  연동 추가
                </Button>
              }
            />
            
            {/* 어댑터 추가 폼 */}
            {showAddAdapter && (
              <div className="mb-4 p-4 bg-[var(--kecp-gray-50)] rounded-lg border border-[var(--kecp-gray-200)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[var(--kecp-gray-900)]">새 도구 연동</h4>
                  <button onClick={() => setShowAddAdapter(false)} className="text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">도구 선택</label>
                    <select
                      value={newAdapterType}
                      onChange={(e) => setNewAdapterType(e.target.value)}
                      className="kecp-select w-full"
                    >
                      <option value="uptime-kuma">Uptime Kuma (모니터링)</option>
                      <option value="termix">Termix (터미널)</option>
                      <option value="prometheus">Prometheus (모니터링)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">
                      외부 ID <span className="text-[var(--kecp-gray-400)] font-normal">(선택)</span>
                    </label>
                    <input
                      type="text"
                      value={newExternalId}
                      onChange={(e) => setNewExternalId(e.target.value)}
                      placeholder="예: Uptime Kuma Monitor ID"
                      className="kecp-input w-full"
                    />
                    <p className="mt-1 text-xs text-[var(--kecp-gray-500)]">
                      외부 시스템의 ID를 입력하면 자동 매핑됩니다.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowAddAdapter(false)}>
                      취소
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleAddAdapter}
                      loading={addAdapterMutation.isPending}
                    >
                      연동
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 어댑터 목록 */}
            {adaptersLoading ? (
              <div className="py-4 text-center">
                <Loading size="sm" />
              </div>
            ) : adapters.length === 0 ? (
              <div className="py-8 text-center">
                <Link2 className="w-10 h-10 mx-auto text-[var(--kecp-gray-300)] mb-2" />
                <p className="text-[var(--kecp-gray-500)]">연동된 도구가 없습니다</p>
                <p className="text-sm text-[var(--kecp-gray-400)]">
                  Uptime Kuma, Termix 등을 연동하세요
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {adapters.map((adapter) => {
                  const info = ADAPTER_INFO[adapter.adapterType] || { name: adapter.adapterType, icon: '🔌', color: 'bg-gray-100 text-gray-800' }
                  return (
                    <div
                      key={adapter.id}
                      className="flex items-center justify-between p-3 bg-[var(--kecp-gray-50)] rounded-lg border border-[var(--kecp-gray-200)] hover:border-[var(--kecp-gray-300)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--kecp-gray-900)]">{info.name}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              adapter.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              adapter.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {adapter.status === 'ACTIVE' && <Activity className="w-3 h-3 mr-1" />}
                              {adapter.status === 'ERROR' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {adapter.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--kecp-gray-500)]">
                            {adapter.externalId && (
                              <span>ID: {adapter.externalId}</span>
                            )}
                            {adapter.lastSyncAt && (
                              <span>마지막 동기화: {new Date(adapter.lastSyncAt).toLocaleString('ko-KR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAdapter(adapter)}
                        className="p-2 text-[var(--kecp-gray-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="연동 해제"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 상태 변경 */}
        <div>
          <Card>
            <CardHeader title="상태 변경" />
            <div className="space-y-2">
              {[
                { status: 'ACTIVE', label: '활성화', color: 'bg-green-500' },
                { status: 'MAINTENANCE', label: '점검 중', color: 'bg-yellow-500' },
                { status: 'INACTIVE', label: '비활성화', color: 'bg-gray-500' },
              ].map((item) => (
                <button
                  key={item.status}
                  onClick={() => statusMutation.mutate(item.status)}
                  disabled={host.status === item.status || statusMutation.isPending}
                  className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 transition-all ${
                    host.status === item.status 
                      ? 'bg-[var(--kecp-primary-light)] text-[var(--kecp-primary)] font-medium ring-2 ring-[var(--kecp-primary)]' 
                      : 'hover:bg-[var(--kecp-gray-50)] text-[var(--kecp-gray-700)]'
                  } disabled:opacity-50`}
                >
                  <span className={`w-3 h-3 ${item.color} rounded-full`} />
                  {item.label}
                  {host.status === item.status && (
                    <span className="ml-auto text-xs">현재</span>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
