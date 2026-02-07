import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Server, TicketCheck, AlertTriangle, CheckCircle, Plus, ArrowRight,
  Activity, Terminal, Wrench, Eye, Radio, MonitorCheck, Shield,
  ExternalLink, Zap, Settings
} from 'lucide-react'
import { useState } from 'react'
import { getHostStats, getHosts, getTerminalUrl, type Host } from '../api/hosts'
import { getTicketStats, getOpenTickets } from '../api/tickets'
import { api } from '../api/client'
import { Card, CardHeader, StatusBadge, PriorityBadge, Loading, EmptyState, Button } from '../components/common'
import { getSettings } from '../utils/settings'

/**
 * 대시보드 - MSP 통합 운영 센터
 *
 * 핵심 UX 흐름:
 * 1. 한눈에 파악 → 장애 호스트/Critical 티켓을 즉시 인지
 * 2. 원클릭 대응 → 문제 호스트에 터미널 즉시 접속
 * 3. 추적 관리 → 티켓으로 해결 과정 기록
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const settings = getSettings()

  // 헬스 체크
  const { data: health, isLoading: healthLoading } = useQuery<{ data?: { status?: string } }>({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((res) => res.data),
    refetchInterval: 30000,
  })

  // 호스트 통계
  const { data: hostStats } = useQuery({
    queryKey: ['hostStats'],
    queryFn: getHostStats,
    refetchInterval: 30000,
  })

  // 호스트 목록 (모니터링 그리드용)
  const { data: hostsData, isLoading: hostsLoading } = useQuery({
    queryKey: ['hosts-dashboard'],
    queryFn: () => getHosts({ size: 20 }),
    refetchInterval: 30000,
  })

  // 티켓 통계
  const { data: ticketStats } = useQuery({
    queryKey: ['ticketStats'],
    queryFn: getTicketStats,
    refetchInterval: 30000,
  })

  // 최근 티켓
  const { data: openTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['openTickets'],
    queryFn: () => getOpenTickets({ size: 5 }),
    refetchInterval: 15000,
  })

  // 터미널 접속
  const terminalMutation = useMutation({
    mutationFn: (hostId: string) => getTerminalUrl(hostId),
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'width=1024,height=768')
    },
    onError: () => {
      alert('터미널 URL 생성에 실패했습니다. Termix 연동을 확인해주세요.')
    },
  })

  // 빠른 터미널 접속
  const [quickHost, setQuickHost] = useState('')

  const hosts = hostsData?.data || []
  const criticalCount = ticketStats?.critical || 0
  const downHosts = hosts.filter(h => h.status === 'INACTIVE')
  const hasIncidents = criticalCount > 0 || downHosts.length > 0

  const stats = [
    { name: '전체 호스트', value: hostStats?.total || 0, icon: Server, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-500', link: '/hosts' },
    { name: '정상', value: hostStats?.active || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', iconBg: 'bg-green-500', link: '/hosts?status=ACTIVE' },
    { name: '장애', value: downHosts.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-500', link: '/hosts?status=INACTIVE', alert: downHosts.length > 0 },
    { name: '점검 중', value: hostStats?.maintenance || 0, icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-50', iconBg: 'bg-yellow-500', link: '/hosts?status=MAINTENANCE' },
    { name: '활성 티켓', value: ticketStats ? (ticketStats.newCount + ticketStats.inProgress) : 0, icon: TicketCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-500', link: '/tickets' },
    { name: 'Critical', value: criticalCount, icon: Shield, color: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-500', link: '/tickets?priority=CRITICAL', alert: criticalCount > 0 },
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
            <Button variant="secondary" icon={Plus} size="md">호스트 추가</Button>
          </Link>
          <Link to="/tickets/new">
            <Button variant="primary" icon={Plus} size="md">티켓 생성</Button>
          </Link>
        </div>
      </div>

      {/* 인시던트 알림 배너 */}
      {hasIncidents && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-900">즉시 확인이 필요합니다</h3>
              <div className="mt-1 text-sm text-red-700 space-y-0.5">
                {downHosts.length > 0 && (
                  <p>{downHosts.map(h => h.name).join(', ')}이(가) 응답하지 않습니다.</p>
                )}
                {criticalCount > 0 && (
                  <p>Critical 우선순위 티켓 {criticalCount}건이 처리 대기 중입니다.</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {downHosts.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Terminal}
                  onClick={() => {
                    if (downHosts[0]) {
                      terminalMutation.mutate(downHosts[0].id)
                    }
                  }}
                >
                  터미널 접속
                </Button>
              )}
              <Link to="/tickets?priority=CRITICAL">
                <Button variant="secondary" size="sm" icon={Eye}>상세 보기</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link}>
            <div className={`relative rounded-xl border p-4 transition-all hover:shadow-md ${
              stat.alert
                ? 'border-red-200 bg-red-50 ring-1 ring-red-200'
                : 'border-[var(--kecp-gray-200)] bg-white hover:border-[var(--kecp-primary)]'
            }`}>
              {stat.alert && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[var(--kecp-gray-500)]">{stat.name}</p>
                  <p className={`text-xl font-bold ${stat.alert ? stat.color : 'text-[var(--kecp-gray-900)]'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 호스트 모니터링 그리드 - 핵심 섹션 */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-[var(--kecp-gray-200)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--kecp-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--kecp-gray-900)]">호스트 모니터링</h2>
            <span className="text-xs text-[var(--kecp-gray-500)] bg-[var(--kecp-gray-100)] px-2 py-0.5 rounded-full">
              {hosts.length}대
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/monitoring" className="text-sm text-[var(--kecp-primary)] hover:underline flex items-center gap-1">
              모니터링 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {hostsLoading ? (
          <div className="p-8 flex justify-center">
            <Loading size="md" />
          </div>
        ) : hosts.length === 0 ? (
          <EmptyState
            icon={Server}
            title="등록된 호스트가 없습니다"
            description="호스트를 등록하여 모니터링을 시작하세요"
            action={
              <Link to="/hosts/new">
                <Button variant="primary" icon={Plus} size="sm">호스트 추가</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--kecp-gray-100)]">
            {hosts.map((host) => (
              <HostMonitorRow
                key={host.id}
                host={host}
                onTerminal={() => terminalMutation.mutate(host.id)}
                terminalLoading={terminalMutation.isPending}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 활성 티켓 */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-[var(--kecp-gray-200)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-[var(--kecp-gray-900)]">활성 인시던트</h2>
              </div>
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
                  title="처리 중인 인시던트가 없습니다"
                  description="모든 시스템이 정상 운영 중입니다"
                />
              ) : (
                openTickets.data.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--kecp-gray-50)] transition-colors group"
                  >
                    <Link to={`/tickets/${ticket.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <PriorityBadge priority={ticket.priority} />
                      <div className="min-w-0">
                        <span className="text-[var(--kecp-gray-900)] font-medium truncate block">
                          {ticket.title}
                        </span>
                        <span className="text-xs text-[var(--kecp-gray-500)]">
                          {new Date(ticket.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={ticket.status} />
                      {ticket.hostId && (
                        <button
                          onClick={() => terminalMutation.mutate(ticket.hostId!)}
                          className="hidden group-hover:flex items-center gap-1 px-2 py-1 text-xs bg-[var(--kecp-gray-900)] text-white rounded-md hover:bg-[var(--kecp-gray-700)] transition-colors"
                          title="터미널 접속"
                        >
                          <Terminal className="w-3 h-3" />
                          터미널
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 사이드바: 시스템 상태 + 빠른 터미널 */}
        <div className="space-y-6">
          {/* 시스템 상태 */}
          <Card>
            <CardHeader title="시스템 상태" />
            <div className="space-y-3">
              <StatusRow
                label="Backend API"
                loading={healthLoading}
                status={health?.data?.status === 'UP' ? 'up' : 'down'}
              />
              <StatusRow
                label="Uptime Kuma"
                href={settings.uptimeKumaUrl}
                linkLabel="열기"
              />
              <StatusRow
                label="Termix"
                href={settings.termixUrl}
                linkLabel="열기"
              />
              <div className="pt-2 border-t border-[var(--kecp-gray-100)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--kecp-gray-600)]">호스트</span>
                  <span className="text-sm text-[var(--kecp-gray-900)]">
                    <span className="text-green-600 font-medium">{hostStats?.active || 0}</span> 활성
                    {(hostStats?.maintenance ?? 0) > 0 && (
                      <> / <span className="text-yellow-600">{hostStats?.maintenance}</span> 점검</>
                    )}
                  </span>
                </div>
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

          {/* 빠른 터미널 접속 */}
          <Card className="bg-gradient-to-br from-[var(--kecp-gray-900)] to-[var(--kecp-gray-800)] text-white">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">빠른 터미널</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">호스트를 선택하면 즉시 터미널에 접속합니다</p>
            <div className="space-y-2">
              <select
                value={quickHost}
                onChange={(e) => setQuickHost(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                <option value="">호스트 선택...</option>
                {hosts.filter(h => h.status === 'ACTIVE' || h.status === 'INACTIVE').map(h => (
                  <option key={h.id} value={h.id}>
                    {h.status === 'INACTIVE' ? '🔴 ' : '🟢 '}{h.name}
                    {h.sshConfig ? ` (${h.sshConfig.host})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (quickHost) {
                    terminalMutation.mutate(quickHost)
                  }
                }}
                disabled={!quickHost || terminalMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
              >
                <Terminal className="w-4 h-4" />
                {terminalMutation.isPending ? '연결 중...' : '접속'}
              </button>
            </div>
          </Card>

          {/* 빠른 링크 */}
          <Card className="bg-gradient-to-br from-[var(--kecp-primary-light)] to-white">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--kecp-primary)] rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--kecp-gray-900)] mb-2">빠른 링크</h3>
                <div className="space-y-2">
                  <QuickLink icon={MonitorCheck} label="모니터링 대시보드" onClick={() => navigate('/monitoring')} />
                  <QuickLink icon={Terminal} label="터미널 관리" onClick={() => navigate('/terminal')} />
                  <QuickLink icon={Settings} label="연동 설정" onClick={() => navigate('/settings')} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/** 호스트 모니터링 행 */
function HostMonitorRow({
  host,
  onTerminal,
  terminalLoading,
}: {
  host: Host
  onTerminal: () => void
  terminalLoading: boolean
}) {
  const statusConfig = {
    ACTIVE: { dot: 'bg-green-500', pulse: true, label: 'UP', labelClass: 'text-green-700 bg-green-50 border-green-200' },
    MAINTENANCE: { dot: 'bg-yellow-500', pulse: false, label: '점검', labelClass: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    INACTIVE: { dot: 'bg-red-500', pulse: true, label: 'DOWN', labelClass: 'text-red-700 bg-red-50 border-red-200' },
  }
  const config = statusConfig[host.status] || statusConfig.ACTIVE

  return (
    <div className={`flex items-center justify-between px-6 py-3 hover:bg-[var(--kecp-gray-50)] transition-colors group ${
      host.status === 'INACTIVE' ? 'bg-red-50/30' : ''
    }`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* 상태 표시등 */}
        <div className="relative flex-shrink-0">
          <span className={`block w-3 h-3 rounded-full ${config.dot}`} />
          {config.pulse && (
            <span className={`absolute inset-0 w-3 h-3 rounded-full ${config.dot} animate-ping opacity-75`} />
          )}
        </div>

        {/* 호스트 정보 */}
        <Link to={`/hosts/${host.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--kecp-gray-900)] truncate">{host.name}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${config.labelClass}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {host.sshConfig && (
                <span className="text-xs text-[var(--kecp-gray-500)] font-mono">
                  {host.sshConfig.username}@{host.sshConfig.host}:{host.sshConfig.port}
                </span>
              )}
              {host.connectionType !== 'SSH' && (
                <span className="text-xs text-[var(--kecp-gray-500)]">{host.connectionType}</span>
              )}
            </div>
          </div>
        </Link>

        {/* 태그 */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {host.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-[var(--kecp-gray-100)] text-[var(--kecp-gray-600)] rounded-full">
              {tag}
            </span>
          ))}
          {(host.tags?.length || 0) > 3 && (
            <span className="text-[10px] text-[var(--kecp-gray-400)]">+{host.tags!.length - 3}</span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        <button
          onClick={onTerminal}
          disabled={terminalLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--kecp-gray-900)] text-white rounded-lg hover:bg-[var(--kecp-gray-700)] disabled:opacity-50 transition-colors"
          title="터미널 접속"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">터미널</span>
        </button>
        <Link
          to={`/hosts/${host.id}`}
          className="p-1.5 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-primary)] hover:bg-[var(--kecp-primary-light)] rounded-lg transition-colors"
          title="상세 보기"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

/** 시스템 상태 행 */
function StatusRow({
  label,
  loading,
  status,
  href,
  linkLabel,
}: {
  label: string
  loading?: boolean
  status?: 'up' | 'down'
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--kecp-gray-600)]">{label}</span>
      {loading ? (
        <Loading size="sm" />
      ) : status ? (
        <span className={`flex items-center gap-2 text-sm ${status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`w-2 h-2 rounded-full ${status === 'up' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {status === 'up' ? '정상' : '연결 실패'}
        </span>
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[var(--kecp-primary)] hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {linkLabel || '열기'}
        </a>
      ) : null}
    </div>
  )
}

/** 빠른 링크 */
function QuickLink({ icon: Icon, label, onClick }: { icon: typeof Activity; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-[var(--kecp-gray-700)] hover:text-[var(--kecp-primary)] transition-colors w-full text-left"
    >
      <Icon className="w-4 h-4 text-[var(--kecp-gray-400)]" />
      {label}
    </button>
  )
}

