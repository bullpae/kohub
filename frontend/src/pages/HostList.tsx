import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, Search, Trash2, Settings, Eye } from 'lucide-react'
import { getHosts, deleteHost, type Host } from '../api/hosts'
import { Card, StatusBadge, Loading, EmptyState, Button } from '../components/common'

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
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">호스트 목록을 불러오는데 실패했습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="kecp-section-title">호스트 관리</h1>
          <p className="kecp-section-subtitle">MSP 관리 대상 서버 및 인프라</p>
        </div>
        <Link to="/hosts/new">
          <Button variant="primary" icon={Plus}>
            호스트 추가
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kecp-gray-400)]" />
            <input
              type="text"
              placeholder="호스트 이름, 설명 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="kecp-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="kecp-select"
          >
            <option value="">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
            <option value="MAINTENANCE">점검중</option>
          </select>
        </div>
      </Card>

      {/* 목록 */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loading size="lg" text="호스트 목록을 불러오는 중..." />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={Server}
            title="등록된 호스트가 없습니다"
            description="관리할 서버를 등록해 주세요"
            action={
              <Link to="/hosts/new">
                <Button variant="primary" icon={Plus}>첫 호스트 등록</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="kecp-table">
                <thead>
                  <tr>
                    <th>호스트</th>
                    <th>연결 정보</th>
                    <th>태그</th>
                    <th>상태</th>
                    <th className="text-right">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((host: Host) => (
                    <tr key={host.id}>
                      <td>
                        <Link to={`/hosts/${host.id}`} className="block">
                          <p className="font-medium text-[var(--kecp-gray-900)] hover:text-[var(--kecp-primary)]">
                            {host.name}
                          </p>
                          {host.description && (
                            <p className="text-xs text-[var(--kecp-gray-500)] truncate max-w-xs">
                              {host.description}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td>
                        <p className="text-sm text-[var(--kecp-gray-900)]">{host.connectionType}</p>
                        {host.sshConfig && (
                          <p className="text-xs text-[var(--kecp-gray-500)] font-mono">
                            {host.sshConfig.username}@{host.sshConfig.host}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {host.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-[var(--kecp-gray-100)] text-[var(--kecp-gray-600)] rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {host.tags && host.tags.length > 2 && (
                            <span className="text-xs text-[var(--kecp-gray-400)]">+{host.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={host.status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/hosts/${host.id}`}
                            className="p-2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-primary)] hover:bg-[var(--kecp-gray-100)] rounded-lg transition-colors"
                            title="상세 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/hosts/${host.id}/edit`}
                            className="p-2 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-600)] hover:bg-[var(--kecp-gray-100)] rounded-lg transition-colors"
                            title="수정"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(host.id, host.name)}
                            className="p-2 text-[var(--kecp-gray-400)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="md:hidden divide-y divide-[var(--kecp-gray-100)]">
              {data.data.map((host: Host) => (
                <Link
                  key={host.id}
                  to={`/hosts/${host.id}`}
                  className="block p-4 hover:bg-[var(--kecp-gray-50)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--kecp-primary-light)] flex items-center justify-center">
                        <Server className="w-5 h-5 text-[var(--kecp-primary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--kecp-gray-900)]">{host.name}</p>
                        <p className="text-xs text-[var(--kecp-gray-500)]">{host.connectionType}</p>
                      </div>
                    </div>
                    <StatusBadge status={host.status} />
                  </div>
                  {host.sshConfig && (
                    <p className="text-xs text-[var(--kecp-gray-500)] font-mono mb-2">
                      {host.sshConfig.username}@{host.sshConfig.host}:{host.sshConfig.port}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {host.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-[var(--kecp-gray-100)] text-[var(--kecp-gray-600)] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {data.page.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[var(--kecp-gray-200)] flex items-center justify-between">
                <p className="text-sm text-[var(--kecp-gray-500)]">
                  총 {data.page.totalElements}개
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={data.page.first}
                  >
                    이전
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={data.page.last}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
