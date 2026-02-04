import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Server, TicketCheck, AlertTriangle, CheckCircle, Plus, ArrowRight, Activity } from 'lucide-react'
import { getHostStats } from '../api/hosts'
import { getTicketStats, getOpenTickets } from '../api/tickets'
import { api } from '../api/client'
import { Card, CardHeader, StatusBadge, PriorityBadge, Loading, EmptyState, Button } from '../components/common'

/**
 * 대시보드 페이지 - K-ECP 스타일
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
  const { data: openTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['openTickets'],
    queryFn: () => getOpenTickets({ size: 5 }),
  })

  const stats = [
    { 
      name: '전체 호스트', 
      value: hostStats?.total || 0, 
      icon: Server, 
      iconBg: 'bg-blue-500',
      link: '/hosts'
    },
    { 
      name: '활성 티켓', 
      value: ticketStats ? (ticketStats.newCount + ticketStats.inProgress) : 0, 
      icon: TicketCheck, 
      iconBg: 'bg-yellow-500',
      link: '/tickets'
    },
    { 
      name: 'Critical', 
      value: ticketStats?.critical || 0, 
      icon: AlertTriangle, 
      iconBg: 'bg-red-500',
      link: '/tickets?priority=CRITICAL'
    },
    { 
      name: '정상 호스트', 
      value: hostStats?.active || 0, 
      icon: CheckCircle, 
      iconBg: 'bg-green-500',
      link: '/hosts?status=ACTIVE'
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="kecp-section-title">대시보드</h1>
          <p className="kecp-section-subtitle">MSP 운영 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <Link to="/hosts/new">
            <Button variant="secondary" icon={Plus} size="md">
              호스트 추가
            </Button>
          </Link>
          <Link to="/tickets/new">
            <Button variant="primary" icon={Plus} size="md">
              티켓 생성
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link}>
            <div className="stats-card">
              <div className="flex items-center gap-4">
                <div className={`stats-card-icon ${stat.iconBg}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="stats-card-label">{stat.name}</p>
                  <p className="stats-card-value">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 활성 티켓 */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-[var(--kecp-gray-200)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--kecp-gray-900)]">최근 활성 티켓</h2>
              <Link to="/tickets" className="text-sm text-[var(--kecp-primary)] hover:underline flex items-center gap-1">
                전체 보기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--kecp-gray-100)]">
              {ticketsLoading ? (
                <div className="p-8 flex justify-center">
                  <Loading size="md" />
                </div>
              ) : !openTickets || openTickets.data.length === 0 ? (
                <EmptyState 
                  icon={TicketCheck}
                  title="처리 중인 티켓이 없습니다"
                  description="새 티켓을 생성하거나 모니터링 알림을 기다려주세요"
                />
              ) : (
                openTickets.data.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--kecp-gray-50)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-[var(--kecp-gray-900)] font-medium truncate">
                        {ticket.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs text-[var(--kecp-gray-500)] hidden sm:block">
                        {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 시스템 상태 */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="시스템 상태" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--kecp-gray-600)]">Backend API</span>
                {healthLoading ? (
                  <Loading size="sm" />
                ) : health?.data?.status === 'UP' ? (
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    정상
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    연결 실패
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--kecp-gray-600)]">호스트</span>
                <span className="text-sm text-[var(--kecp-gray-900)]">
                  <span className="text-green-600 font-medium">{hostStats?.active || 0}</span> 활성
                  {(hostStats?.maintenance ?? 0) > 0 && (
                    <> / <span className="text-yellow-600">{hostStats?.maintenance}</span> 점검</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--kecp-gray-600)]">티켓</span>
                <span className="text-sm text-[var(--kecp-gray-900)]">
                  <span className="text-blue-600 font-medium">{ticketStats?.newCount || 0}</span> 신규
                  {' / '}
                  <span className="text-yellow-600 font-medium">{ticketStats?.inProgress || 0}</span> 진행
                </span>
              </div>
            </div>
          </Card>

          {/* 빠른 시작 */}
          <Card className="bg-gradient-to-br from-[var(--kecp-primary-light)] to-white">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--kecp-primary)] rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--kecp-gray-900)] mb-2">시작하기</h3>
                <ol className="text-sm text-[var(--kecp-gray-600)] space-y-1.5">
                  <li>1. 호스트 등록</li>
                  <li>2. Uptime Kuma 연결</li>
                  <li>3. Termix 설정</li>
                  <li>4. 자동 티켓 수신</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
