import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Terminal, Server, ExternalLink, Maximize2, Minimize2, Settings,
  Zap, Clock, AlertTriangle, ChevronRight
} from 'lucide-react'
import { getHosts, getTerminalUrl, type Host } from '../api/hosts'
import { Card, Loading, Button } from '../components/common'
import { getSettings } from '../utils/settings'

/**
 * 터미널 페이지
 *
 * - 호스트 선택 → Termix 터미널 접속
 * - Termix iframe 임베드 (인라인 터미널)
 * - 최근 접속 기록
 * - 장애 호스트 우선 표시
 */
export default function TerminalPage() {
  const settings = getSettings()
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [terminalUrl, setTerminalUrl] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // 호스트 목록
  const { data: hostsData, isLoading } = useQuery({
    queryKey: ['hosts-terminal'],
    queryFn: () => getHosts({ size: 50 }),
    refetchInterval: 30000,
  })

  // 터미널 URL 생성
  const terminalMutation = useMutation({
    mutationFn: (hostId: string) => getTerminalUrl(hostId),
    onSuccess: (data) => {
      setTerminalUrl(data.url)
    },
    onError: () => {
      // Termix 연동이 안 되어 있으면 Termix 직접 연결 시도
      window.open(settings.termixUrl, '_blank')
    },
  })

  const hosts = hostsData?.data || []
  const sortedHosts = [...hosts].sort((a, b) => {
    const order = { INACTIVE: 0, MAINTENANCE: 1, ACTIVE: 2 }
    return (order[a.status] ?? 2) - (order[b.status] ?? 2)
  })

  const handleConnect = (host: Host) => {
    setSelectedHost(host)
    setTerminalUrl(null)
    terminalMutation.mutate(host.id)
  }

  const handleOpenExternal = () => {
    if (terminalUrl) {
      window.open(terminalUrl, '_blank', 'width=1024,height=768')
    } else {
      window.open(settings.termixUrl, '_blank')
    }
  }

  // 풀스크린 터미널
  if (fullscreen && terminalUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--kecp-gray-900)]">
        <div className="flex items-center justify-between h-10 px-4 bg-black text-white">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-sm font-mono">
              {selectedHost?.name}
              {selectedHost?.sshConfig && (
                <span className="text-gray-400 ml-2">
                  {selectedHost.sshConfig.username}@{selectedHost.sshConfig.host}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-700 rounded"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-700 rounded"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <iframe
          src={terminalUrl}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 40px)' }}
          title={`Terminal - ${selectedHost?.name}`}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="kecp-section-title">터미널</h1>
          <p className="kecp-section-subtitle">서버에 SSH로 접속하여 관리할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={settings.termixUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" icon={ExternalLink} size="sm">Termix 열기</Button>
          </a>
          <Link to="/settings">
            <Button variant="ghost" icon={Settings} size="sm">설정</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 호스트 목록 (사이드) */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--kecp-gray-900)] mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--kecp-gray-500)]" />
              호스트 선택
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loading size="sm" />
              </div>
            ) : sortedHosts.length === 0 ? (
              <Card className="text-center py-6">
                <Server className="w-8 h-8 mx-auto text-[var(--kecp-gray-300)] mb-2" />
                <p className="text-sm text-[var(--kecp-gray-500)]">호스트 없음</p>
                <Link to="/hosts/new" className="mt-2 inline-block">
                  <Button variant="primary" size="sm">등록</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {sortedHosts.map(host => (
                  <HostItem
                    key={host.id}
                    host={host}
                    selected={selectedHost?.id === host.id}
                    onSelect={() => handleConnect(host)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 터미널 영역 */}
        <div className="lg:col-span-3">
          {terminalUrl ? (
            <Card padding="none">
              {/* 터미널 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--kecp-gray-900)] rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-mono text-gray-300">
                    {selectedHost?.name}
                    {selectedHost?.sshConfig && (
                      <span className="text-gray-500 ml-1">
                        — {selectedHost.sshConfig.username}@{selectedHost.sshConfig.host}:{selectedHost.sshConfig.port}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFullscreen(true)}
                    className="p-1 text-gray-400 hover:text-white rounded"
                    title="전체 화면"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenExternal}
                    className="p-1 text-gray-400 hover:text-white rounded"
                    title="새 창에서 열기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* iframe */}
              <iframe
                src={terminalUrl}
                className="w-full border-0"
                style={{ height: '600px' }}
                title={`Terminal - ${selectedHost?.name}`}
                allow="clipboard-read; clipboard-write"
              />
            </Card>
          ) : terminalMutation.isPending ? (
            <Card className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[var(--kecp-gray-700)] font-medium">터미널에 연결하는 중...</p>
              <p className="text-sm text-[var(--kecp-gray-500)] mt-1">{selectedHost?.name}</p>
            </Card>
          ) : (
            /* 접속 전 안내 */
            <Card className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-[var(--kecp-gray-50)] to-white">
              <div className="w-20 h-20 rounded-2xl bg-[var(--kecp-gray-900)] flex items-center justify-center mb-6">
                <Terminal className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-[var(--kecp-gray-900)] mb-2">터미널 접속</h3>
              <p className="text-[var(--kecp-gray-500)] text-center max-w-md mb-6">
                왼쪽에서 접속할 호스트를 선택하세요.<br />
                선택 즉시 SSH 터미널이 이 영역에 열립니다.
              </p>
              <div className="flex items-center gap-6 text-sm text-[var(--kecp-gray-500)]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  원클릭 접속
                </div>
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-blue-500" />
                  전체 화면 지원
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  세션 로깅
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/** 호스트 목록 아이템 */
function HostItem({
  host,
  selected,
  onSelect,
}: {
  host: Host
  selected: boolean
  onSelect: () => void
}) {
  const statusConfig = {
    ACTIVE: { dot: 'bg-green-500', label: 'UP' },
    MAINTENANCE: { dot: 'bg-yellow-500', label: '점검' },
    INACTIVE: { dot: 'bg-red-500', label: 'DOWN' },
  }
  const config = statusConfig[host.status] || statusConfig.ACTIVE

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
        selected
          ? 'bg-[var(--kecp-primary)] text-white shadow-md'
          : host.status === 'INACTIVE'
            ? 'bg-red-50 hover:bg-red-100 border border-red-200'
            : 'hover:bg-[var(--kecp-gray-100)] border border-transparent'
      }`}
    >
      {/* 상태 표시 */}
      <div className="relative flex-shrink-0">
        <span className={`block w-2.5 h-2.5 rounded-full ${selected ? 'bg-white' : config.dot}`} />
        {host.status === 'INACTIVE' && !selected && (
          <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${config.dot} animate-ping`} />
        )}
      </div>

      {/* 호스트 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-[var(--kecp-gray-900)]'}`}>
            {host.name}
          </span>
          {host.status === 'INACTIVE' && !selected && (
            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
          )}
        </div>
        {host.sshConfig && (
          <span className={`text-xs font-mono truncate block ${selected ? 'text-white/70' : 'text-[var(--kecp-gray-500)]'}`}>
            {host.sshConfig.host}
          </span>
        )}
      </div>

      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-white/70' : 'text-[var(--kecp-gray-300)]'}`} />
    </button>
  )
}
