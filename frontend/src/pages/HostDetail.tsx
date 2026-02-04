import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, Terminal, Server } from 'lucide-react'
import { getHost, deleteHost, changeHostStatus } from '../api/hosts'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  MAINTENANCE: '점검중',
}

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

  const handleStatusChange = (status: string) => {
    statusMutation.mutate(status)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !host) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          호스트 정보를 불러오는데 실패했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hosts')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">{host.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[host.status]}`}>
                {statusLabels[host.status]}
              </span>
            </div>
            {host.description && (
              <p className="text-gray-500 mt-1 ml-11">{host.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('터미널 기능은 Phase 1 이후 구현 예정입니다.')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Terminal className="w-5 h-5" />
            터미널
          </button>
          <Link
            to={`/hosts/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-5 h-5" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-5 h-5" />
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">호스트 정보</h2>
          
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">연결 유형</dt>
              <dd className="mt-1 text-gray-900">{host.connectionType}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">상태</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[host.status]}`}>
                  {statusLabels[host.status]}
                </span>
              </dd>
            </div>
            
            {host.sshConfig && (
              <>
                <div>
                  <dt className="text-sm text-gray-500">SSH 주소</dt>
                  <dd className="mt-1 text-gray-900 font-mono">
                    {host.sshConfig.host}:{host.sshConfig.port}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">SSH 사용자</dt>
                  <dd className="mt-1 text-gray-900 font-mono">{host.sshConfig.username}</dd>
                </div>
              </>
            )}

            <div>
              <dt className="text-sm text-gray-500">생성일</dt>
              <dd className="mt-1 text-gray-900">
                {new Date(host.createdAt).toLocaleString('ko-KR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">수정일</dt>
              <dd className="mt-1 text-gray-900">
                {new Date(host.updatedAt).toLocaleString('ko-KR')}
              </dd>
            </div>
          </dl>

          {/* 태그 */}
          {host.tags && host.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {host.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 상태 변경 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">상태 변경</h2>
          <div className="space-y-2">
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={host.status === 'ACTIVE' || statusMutation.isPending}
              className={`w-full py-2 px-4 rounded-lg text-left flex items-center gap-2 ${
                host.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800 font-medium' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              활성화
            </button>
            <button
              onClick={() => handleStatusChange('MAINTENANCE')}
              disabled={host.status === 'MAINTENANCE' || statusMutation.isPending}
              className={`w-full py-2 px-4 rounded-lg text-left flex items-center gap-2 ${
                host.status === 'MAINTENANCE' 
                  ? 'bg-yellow-100 text-yellow-800 font-medium' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              점검 중
            </button>
            <button
              onClick={() => handleStatusChange('INACTIVE')}
              disabled={host.status === 'INACTIVE' || statusMutation.isPending}
              className={`w-full py-2 px-4 rounded-lg text-left flex items-center gap-2 ${
                host.status === 'INACTIVE' 
                  ? 'bg-gray-200 text-gray-800 font-medium' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              비활성화
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
