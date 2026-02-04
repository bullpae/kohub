import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Ticket, Search } from 'lucide-react'
import { getTickets, type Ticket as TicketType } from '../api/tickets'

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusColors: Record<string, string> = {
  NEW: 'bg-purple-100 text-purple-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-teal-100 text-teal-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REOPENED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  NEW: '신규',
  RECEIVED: '접수',
  ASSIGNED: '배정',
  IN_PROGRESS: '진행중',
  PENDING: '보류',
  RESOLVED: '해결',
  COMPLETED: '완료',
  CLOSED: '종료',
  REOPENED: '재오픈',
}

const priorityLabels: Record<string, string> = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          티켓 목록을 불러오는데 실패했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">티켓 관리</h1>
          <p className="text-gray-500 mt-1">장애/요청 티켓 이력 관리</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          티켓 생성
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
                placeholder="티켓 제목, 설명 검색..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 우선순위</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 티켓이 없습니다.</p>
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              첫 티켓 생성하기
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    티켓
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((ticket: TicketType) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${priorityColors[ticket.priority]}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/tickets/${ticket.id}`} className="block">
                        <div className="font-medium text-gray-900 hover:text-blue-600">
                          {ticket.title}
                        </div>
                        {ticket.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {ticket.description}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {sourceLabels[ticket.source]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
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
