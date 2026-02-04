import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, Terminal, Server, Globe, Clock, Tag } from 'lucide-react'
import { getHost, deleteHost, changeHostStatus } from '../api/hosts'
import { Card, CardHeader, StatusBadge, Loading, Button } from '../components/common'

export default function HostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: host, isLoading, error } = useQuery({
    queryKey: ['host', id],
    queryFn: () => getHost(id!),
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

  const handleDelete = () => {
    if (confirm(`"${host?.name}" 호스트를 삭제하시겠습니까?`)) {
      deleteMutation.mutate()
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
            onClick={() => alert('터미널 기능은 Phase 2에서 구현됩니다.')}
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
