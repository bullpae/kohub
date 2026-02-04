import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, TicketCheck, Search } from 'lucide-react'
import { getTickets, type Ticket } from '../api/tickets'
import { Card, StatusBadge, PriorityBadge, Loading, EmptyState, Button } from '../components/common'

const sourceLabels: Record<string, string> = {
  MANUAL: '수동',
  UPTIME_KUMA: 'Uptime Kuma',
  PROMETHEUS: 'Prometheus',
  CUSTOMER_REQUEST: '고객 요청',
}

export default function TicketList() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', { keyword, status: statusFilter, priority: priorityFilter, page }],
    queryFn: () => getTickets({
      keyword: keyword || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      page,
      size: 10,
    }),
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">티켓 목록을 불러오는데 실패했습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="kecp-section-title">티켓 관리</h1>
          <p className="kecp-section-subtitle">장애/요청 티켓 이력 관리</p>
        </div>
        <Link to="/tickets/new">
          <Button variant="primary" icon={Plus}>
            티켓 생성
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
              placeholder="티켓 제목, 설명 검색..."
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
            <option value="NEW">신규</option>
            <option value="IN_PROGRESS">진행중</option>
            <option value="RESOLVED">해결</option>
            <option value="CLOSED">종료</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="kecp-select"
          >
            <option value="">전체 우선순위</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </Card>

      {/* 목록 */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loading size="lg" text="티켓 목록을 불러오는 중..." />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={TicketCheck}
            title="등록된 티켓이 없습니다"
            description="새 티켓을 생성하거나 모니터링 알림을 기다려주세요"
            action={
              <Link to="/tickets/new">
                <Button variant="primary" icon={Plus}>첫 티켓 생성</Button>
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
                    <th>우선순위</th>
                    <th>티켓</th>
                    <th>소스</th>
                    <th>상태</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((ticket: Ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <Link to={`/tickets/${ticket.id}`} className="block">
                          <p className="font-medium text-[var(--kecp-gray-900)] hover:text-[var(--kecp-primary)]">
                            {ticket.title}
                          </p>
                          {ticket.description && (
                            <p className="text-xs text-[var(--kecp-gray-500)] truncate max-w-md">
                              {ticket.description}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td>
                        <span className="text-sm text-[var(--kecp-gray-600)]">
                          {sourceLabels[ticket.source]}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>
                        <span className="text-sm text-[var(--kecp-gray-500)]">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="md:hidden divide-y divide-[var(--kecp-gray-100)]">
              {data.data.map((ticket: Ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block p-4 hover:bg-[var(--kecp-gray-50)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                    <span className="text-xs text-[var(--kecp-gray-500)]">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                  <p className="font-medium text-[var(--kecp-gray-900)] mb-1">{ticket.title}</p>
                  {ticket.description && (
                    <p className="text-sm text-[var(--kecp-gray-500)] line-clamp-2">
                      {ticket.description}
                    </p>
                  )}
                  <p className="text-xs text-[var(--kecp-gray-400)] mt-2">
                    {sourceLabels[ticket.source]}
                  </p>
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
