import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Server, TicketCheck, AlertTriangle, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import { getHostStats } from '../api/hosts'
import { getTicketStats, getOpenTickets } from '../api/tickets'
import { api } from '../api/client'

/**
 * 대시보드 페이지
 */
export default function Dashboard() {
  // 헬스 체크
  const { data: health, isLoading: healthLoading } = useQuery<{ data?: { status?: string } }>({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((res) => res.data),
  })

  // 호스트 통계
  const { data: hostStats } = useQuery({
    queryKey: ['hostStats'],
    queryFn: getHostStats,
  })

  // 티켓 통계
  const { data: ticketStats } = useQuery({
    queryKey: ['ticketStats'],
    queryFn: getTicketStats,
  })

  // 최근 티켓
  const { data: openTickets } = useQuery({
    queryKey: ['openTickets'],
    queryFn: () => getOpenTickets({ size: 5 }),
  })

  const stats = [
    { 
      name: '전체 호스트', 
      value: hostStats?.total || 0, 
      icon: Server, 
      color: 'bg-blue-500',
      link: '/hosts'
    },
    { 
      name: '활성 티켓', 
      value: ticketStats ? (ticketStats.newCount + ticketStats.inProgress) : 0, 
      icon: TicketCheck, 
      color: 'bg-yellow-500',
      link: '/tickets'
    },
    { 
      name: 'Critical 티켓', 
      value: ticketStats?.critical || 0, 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      link: '/tickets?priority=CRITICAL'
    },
    { 
      name: '정상 호스트', 
      value: hostStats?.active || 0, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      link: '/hosts?status=ACTIVE'
    },
  ]

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
    LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const statusLabels: Record<string, string> = {
    NEW: '신규',
    RECEIVED: '접수',
    ASSIGNED: '배정',
    IN_PROGRESS: '진행중',
    PENDING: '보류',
  }

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 타이틀 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            MSP 운영 현황을 한눈에 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/hosts/new"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            호스트 추가
          </Link>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            티켓 생성
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 티켓 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">최근 활성 티켓</h2>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {!openTickets || openTickets.data.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                처리 중인 티켓이 없습니다
              </div>
            ) : (
              openTickets.data.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-gray-900 font-medium">{ticket.title}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시스템 상태</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backend API</span>
              {healthLoading ? (
                <span className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                  확인 중...
                </span>
              ) : health?.data?.status === 'UP' ? (
                <span className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  정상
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  연결 실패
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">호스트 현황</span>
              <span className="text-gray-900">
                {hostStats?.active || 0} 활성 / {hostStats?.maintenance || 0} 점검 / {hostStats?.inactive || 0} 비활성
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">티켓 현황</span>
              <span className="text-gray-900">
                {ticketStats?.newCount || 0} 신규 / {ticketStats?.inProgress || 0} 진행중 / {ticketStats?.resolved || 0} 해결
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">시작하기</h2>
        <p className="text-sm text-blue-700 mb-4">
          kohub를 사용하려면 다음 단계를 완료하세요:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>호스트 메뉴에서 관리할 서버를 등록하세요</li>
          <li>Uptime Kuma에서 모니터를 설정하고 Webhook을 연결하세요</li>
          <li>Termix에서 SSH 연결 정보를 설정하세요</li>
          <li>장애 발생 시 티켓이 자동 생성되고 터미널로 빠르게 접속할 수 있습니다</li>
        </ol>
      </div>
    </div>
  )
}
