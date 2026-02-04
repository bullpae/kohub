import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, Search, Trash2, Settings } from 'lucide-react'
import { getHosts, deleteHost, type Host } from '../api/hosts'

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

export default function HostList() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['hosts', { keyword, status: statusFilter, page }],
    queryFn: () => getHosts({ keyword: keyword || undefined, status: statusFilter || undefined, page, size: 10 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
    },
  })

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 호스트를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          호스트 목록을 불러오는데 실패했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">호스트 관리</h1>
          <p className="text-gray-500 mt-1">MSP 관리 대상 서버/인프라 목록</p>
        </div>
        <Link
          to="/hosts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          호스트 추가
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="호스트 이름, 설명 검색..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
            <option value="MAINTENANCE">점검중</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 호스트가 없습니다.</p>
            <Link
              to="/hosts/new"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              첫 호스트 등록하기
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    호스트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연결 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    태그
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((host: Host) => (
                  <tr key={host.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/hosts/${host.id}`} className="block">
                        <div className="font-medium text-gray-900 hover:text-blue-600">
                          {host.name}
                        </div>
                        {host.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {host.description}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {host.connectionType}
                      </div>
                      {host.sshConfig && (
                        <div className="text-sm text-gray-500">
                          {host.sshConfig.username}@{host.sshConfig.host}:{host.sshConfig.port}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {host.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {host.tags && host.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{host.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[host.status]}`}>
                        {statusLabels[host.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/hosts/${host.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(host.id, host.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {data.page.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  총 {data.page.totalElements}개 중 {page * 10 + 1}-{Math.min((page + 1) * 10, data.page.totalElements)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={data.page.first}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={data.page.last}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
