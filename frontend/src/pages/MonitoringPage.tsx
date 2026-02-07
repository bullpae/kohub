import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  MonitorCheck, ExternalLink, Terminal, Server,
  RefreshCw, Maximize2, Minimize2, Settings, AlertTriangle, CheckCircle, Wrench
} from 'lucide-react'
import { getHosts, getTerminalUrl, type Host } from '../api/hosts'
import { Card, Loading, Button } from '../components/common'
import { getSettings } from '../utils/settings'

/**
 * 모니터링 페이지
 *
 * - Uptime Kuma iframe 임베드 (실시간 모니터링 대시보드)
 * - kohub 호스트 상태 보드 (어댑터 연동 상태)
 * - 장애 호스트 → 원클릭 터미널 접속
 */
export default function MonitoringPage() {
  const settings = getSettings()
  const [fullscreen, setFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hosts'>('dashboard')

  // 호스트 목록
  const { data: hostsData, isLoading, refetch } = useQuery({
    queryKey: ['hosts-monitoring'],
    queryFn: () => getHosts({ size: 50 }),
    refetchInterval: 30000,
  })

  // 터미널 접속
  const terminalMutation = useMutation({
    mutationFn: (hostId: string) => getTerminalUrl(hostId),
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'width=1024,height=768')
    },
  })

  const hosts = hostsData?.data || []
  const uptimeKumaUrl = settings.uptimeKumaUrl

  // 풀스크린 Uptime Kuma
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between h-12 px-4 bg-[var(--kecp-gray-900)] text-white">
          <div className="flex items-center gap-2">
            <MonitorCheck className="w-5 h-5 text-green-400" />
            <span className="font-medium">Uptime Kuma 모니터링</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={uptimeKumaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 text-xs hover:bg-gray-700 rounded"
            >
              <ExternalLink className="w-3 h-3" />
              새 창
            </a>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1 px-3 py-1 text-xs hover:bg-gray-700 rounded"
            >
              <Minimize2 className="w-3 h-3" />
              축소
            </button>
          </div>
        </div>
        <iframe
          src={`${uptimeKumaUrl}/status`}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 48px)' }}
          title="Uptime Kuma - Full Screen"
          allow="fullscreen"
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="kecp-section-title">모니터링</h1>
          <p className="kecp-section-subtitle">서비스 가동 상태를 실시간으로 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} size="sm" onClick={() => refetch()}>
            새로고침
          </Button>
          <a href={uptimeKumaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" icon={ExternalLink} size="sm">
              Uptime Kuma
            </Button>
          </a>
          <Link to="/settings">
            <Button variant="ghost" icon={Settings} size="sm">설정</Button>
          </Link>
        </div>
      </div>

      {/* 상태 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="전체 호스트"
          value={hosts.length}
          icon={Server}
          color="blue"
        />
        <SummaryCard
          label="정상"
          value={hosts.filter(h => h.status === 'ACTIVE').length}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          label="장애"
          value={hosts.filter(h => h.status === 'INACTIVE').length}
          icon={AlertTriangle}
          color="red"
          alert={hosts.some(h => h.status === 'INACTIVE')}
        />
        <SummaryCard
          label="점검 중"
          value={hosts.filter(h => h.status === 'MAINTENANCE').length}
          icon={Wrench}
          color="yellow"
        />
      </div>

      {/* 탭 */}
      <div className="border-b border-[var(--kecp-gray-200)]">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={MonitorCheck}
            label="Uptime Kuma 대시보드"
          />
          <TabButton
            active={activeTab === 'hosts'}
            onClick={() => setActiveTab('hosts')}
            icon={Server}
            label="호스트 상태 보드"
          />
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-4">
          {/* Uptime Kuma iframe */}
          <Card padding="none">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--kecp-gray-50)] border-b border-[var(--kecp-gray-200)]">
              <div className="flex items-center gap-2">
                <MonitorCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-[var(--kecp-gray-700)]">Uptime Kuma</span>
                <span className="text-xs text-[var(--kecp-gray-500)]">{uptimeKumaUrl}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFullscreen(true)}
                  className="p-1.5 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-700)] hover:bg-[var(--kecp-gray-200)] rounded"
                  title="전체 화면"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <a
                  href={uptimeKumaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-[var(--kecp-gray-400)] hover:text-[var(--kecp-gray-700)] hover:bg-[var(--kecp-gray-200)] rounded"
                  title="새 창에서 열기"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <iframe
              src={`${uptimeKumaUrl}/status`}
              className="w-full border-0 rounded-b-xl"
              style={{ height: '600px' }}
              title="Uptime Kuma Dashboard"
              allow="fullscreen"
            />
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 호스트 상태 그리드 */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="호스트 정보를 불러오는 중..." />
            </div>
          ) : hosts.length === 0 ? (
            <Card className="text-center py-12">
              <Server className="w-12 h-12 mx-auto text-[var(--kecp-gray-300)] mb-3" />
              <p className="text-[var(--kecp-gray-500)]">등록된 호스트가 없습니다</p>
              <Link to="/hosts/new" className="mt-3 inline-block">
                <Button variant="primary" size="sm">호스트 등록</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* 장애 호스트 먼저 표시 */}
              {[...hosts]
                .sort((a, b) => {
                  const order = { INACTIVE: 0, MAINTENANCE: 1, ACTIVE: 2 }
                  return (order[a.status] ?? 2) - (order[b.status] ?? 2)
                })
                .map(host => (
                  <HostStatusCard
                    key={host.id}
                    host={host}
                    onTerminal={() => terminalMutation.mutate(host.id)}
                    terminalLoading={terminalMutation.isPending}
                  />
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** 요약 카드 */
function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  alert,
}: {
  label: string
  value: number
  icon: typeof Server
  color: string
  alert?: boolean
}) {
  const iconColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <div className={`relative rounded-xl border p-4 ${
      alert ? 'border-red-200 bg-red-50' : 'border-[var(--kecp-gray-200)] bg-white'
    }`}>
      {alert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-[var(--kecp-gray-500)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--kecp-gray-900)]">{value}</p>
        </div>
      </div>
    </div>
  )
}

/** 탭 버튼 */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof MonitorCheck
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-[var(--kecp-primary)] text-[var(--kecp-primary)]'
          : 'border-transparent text-[var(--kecp-gray-500)] hover:text-[var(--kecp-gray-700)] hover:border-[var(--kecp-gray-300)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

/** 호스트 상태 카드 */
function HostStatusCard({
  host,
  onTerminal,
  terminalLoading,
}: {
  host: Host
  onTerminal: () => void
  terminalLoading: boolean
}) {
  const statusConfig = {
    ACTIVE: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      dot: 'bg-green-500',
      label: 'UP',
      labelBg: 'bg-green-100 text-green-800',
      headerBg: 'bg-gradient-to-r from-green-500 to-green-400',
    },
    MAINTENANCE: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      dot: 'bg-yellow-500',
      label: '점검',
      labelBg: 'bg-yellow-100 text-yellow-800',
      headerBg: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    },
    INACTIVE: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      dot: 'bg-red-500',
      label: 'DOWN',
      labelBg: 'bg-red-100 text-red-800',
      headerBg: 'bg-gradient-to-r from-red-500 to-red-400',
    },
  }

  const config = statusConfig[host.status] || statusConfig.ACTIVE

  return (
    <div className={`rounded-xl border ${config.border} overflow-hidden hover:shadow-md transition-shadow`}>
      {/* 상태 헤더 */}
      <div className={`${config.headerBg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-semibold">{config.label}</span>
        </div>
        <span className="text-white/80 text-xs">{host.connectionType}</span>
      </div>

      {/* 내용 */}
      <div className="p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--kecp-gray-100)] flex items-center justify-center">
            <Server className="w-5 h-5 text-[var(--kecp-gray-500)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-[var(--kecp-gray-900)] truncate">{host.name}</h4>
            {host.sshConfig && (
              <p className="text-xs text-[var(--kecp-gray-500)] font-mono truncate">
                {host.sshConfig.host}:{host.sshConfig.port}
              </p>
            )}
          </div>
        </div>

        {/* 태그 */}
        {host.tags && host.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {host.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-[var(--kecp-gray-100)] text-[var(--kecp-gray-600)] rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 액션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTerminal}
            disabled={terminalLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-[var(--kecp-gray-900)] text-white rounded-lg hover:bg-[var(--kecp-gray-700)] disabled:opacity-50 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            터미널 접속
          </button>
          <Link
            to={`/hosts/${host.id}`}
            className="flex items-center justify-center py-2 px-3 text-xs font-medium border border-[var(--kecp-gray-300)] text-[var(--kecp-gray-700)] rounded-lg hover:bg-[var(--kecp-gray-50)] transition-colors"
          >
            상세
          </Link>
        </div>
      </div>
    </div>
  )
}
