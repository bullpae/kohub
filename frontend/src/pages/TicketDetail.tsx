import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, Send, CheckCircle, Play, Pause, RotateCcw, Clock, User, Terminal, Server, ExternalLink } from 'lucide-react'
import { getTicket, receiveTicket, transitionTicket, resolveTicket, addComment, type TicketStatus } from '../api/tickets'
import { getHost, getTerminalUrl } from '../api/hosts'
import { Card, CardHeader, StatusBadge, PriorityBadge, Loading, Button } from '../components/common'

const sourceLabels: Record<string, string> = {
  MANUAL: '수동 생성',
  UPTIME_KUMA: 'Uptime Kuma',
  PROMETHEUS: 'Prometheus',
  CUSTOMER_REQUEST: '고객 요청',
}

const activityIcons: Record<string, { bg: string; icon: typeof MessageCircle }> = {
  STATUS_CHANGE: { bg: 'bg-blue-100 text-blue-600', icon: RotateCcw },
  COMMENT: { bg: 'bg-gray-100 text-gray-600', icon: MessageCircle },
  ASSIGNMENT: { bg: 'bg-purple-100 text-purple-600', icon: User },
  TERMINAL_ACCESS: { bg: 'bg-green-100 text-green-600', icon: Play },
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [resolutionText, setResolutionText] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id!),
    enabled: !!id,
  })

  // 관련 호스트 정보 조회
  const { data: relatedHost } = useQuery({
    queryKey: ['host', ticket?.hostId],
    queryFn: () => getHost(ticket!.hostId!),
    enabled: !!ticket?.hostId,
  })

  // 터미널 접속
  const terminalMutation = useMutation({
    mutationFn: () => getTerminalUrl(ticket!.hostId!, ticket!.id),
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'width=1024,height=768')
    },
    onError: () => {
      alert('터미널 URL 생성에 실패했습니다. Termix 연동을 확인해주세요.')
    },
  })

  const receiveMutation = useMutation({
    mutationFn: () => receiveTicket(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  })

  const transitionMutation = useMutation({
    mutationFn: (status: TicketStatus) => transitionTicket(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  })

  const resolveMutation = useMutation({
    mutationFn: (summary: string) => resolveTicket(id!, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      setShowResolveModal(false)
      setResolutionText('')
    },
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      setCommentText('')
    },
  })

  const handleAddComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText)
    }
  }

  const handleResolve = () => {
    if (resolutionText.trim()) {
      resolveMutation.mutate(resolutionText)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <Loading size="lg" text="티켓 정보를 불러오는 중..." />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">티켓 정보를 불러오는데 실패했습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 hover:bg-[var(--kecp-gray-100)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--kecp-gray-500)]" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-[var(--kecp-gray-900)]">{ticket.title}</h1>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-2 ml-12 lg:ml-0">
          {/* 터미널 접속 (호스트가 연결된 경우) */}
          {ticket.hostId && (
            <Button
              variant="primary"
              icon={Terminal}
              onClick={() => terminalMutation.mutate()}
              loading={terminalMutation.isPending}
              className="bg-[var(--kecp-gray-900)] hover:bg-[var(--kecp-gray-700)]"
            >
              터미널 접속
            </Button>
          )}
          {ticket.status === 'NEW' && (
            <Button
              variant="primary"
              icon={CheckCircle}
              onClick={() => receiveMutation.mutate()}
              loading={receiveMutation.isPending}
            >
              접수
            </Button>
          )}
          {ticket.status === 'ASSIGNED' && (
            <Button
              variant="primary"
              icon={Play}
              onClick={() => transitionMutation.mutate('IN_PROGRESS')}
              loading={transitionMutation.isPending}
            >
              처리 시작
            </Button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="secondary"
                icon={Pause}
                onClick={() => transitionMutation.mutate('PENDING')}
                loading={transitionMutation.isPending}
              >
                보류
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle}
                onClick={() => setShowResolveModal(true)}
              >
                해결
              </Button>
            </>
          )}
          {ticket.status === 'PENDING' && (
            <Button
              variant="primary"
              icon={RotateCcw}
              onClick={() => transitionMutation.mutate('IN_PROGRESS')}
              loading={transitionMutation.isPending}
            >
              재개
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 설명 */}
          <Card>
            <CardHeader title="설명" />
            <p className="text-[var(--kecp-gray-700)] whitespace-pre-wrap leading-relaxed">
              {ticket.description || '설명 없음'}
            </p>

            {ticket.resolutionSummary && (
              <div className="mt-6 pt-6 border-t border-[var(--kecp-gray-200)]">
                <h4 className="text-sm font-medium text-green-700 mb-2">해결 방법</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 whitespace-pre-wrap">{ticket.resolutionSummary}</p>
                </div>
              </div>
            )}
          </Card>

          {/* 활동 기록 */}
          <Card>
            <CardHeader title="활동 기록" />
            
            <div className="space-y-4 mb-6">
              {ticket.activities.length === 0 ? (
                <p className="text-[var(--kecp-gray-500)] text-sm py-4">활동 기록이 없습니다.</p>
              ) : (
                ticket.activities.map((activity) => {
                  const config = activityIcons[activity.type] || activityIcons.COMMENT
                  const Icon = config.icon
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--kecp-gray-900)] text-sm">{activity.content}</p>
                        <p className="text-xs text-[var(--kecp-gray-500)] mt-1">
                          {new Date(activity.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 코멘트 입력 */}
            <div className="pt-4 border-t border-[var(--kecp-gray-200)]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="코멘트 입력..."
                  className="kecp-input flex-1"
                />
                <Button
                  variant="primary"
                  icon={Send}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  loading={commentMutation.isPending}
                >
                  전송
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="상세 정보" />
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">상태</dt>
                <dd><StatusBadge status={ticket.status} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">우선순위</dt>
                <dd><PriorityBadge priority={ticket.priority} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">소스</dt>
                <dd className="text-sm text-[var(--kecp-gray-900)]">{sourceLabels[ticket.source]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">생성일</dt>
                <dd className="flex items-center gap-2 text-sm text-[var(--kecp-gray-900)]">
                  <Clock className="w-4 h-4 text-[var(--kecp-gray-400)]" />
                  {new Date(ticket.createdAt).toLocaleString('ko-KR')}
                </dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-1">해결일</dt>
                  <dd className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    {new Date(ticket.resolvedAt).toLocaleString('ko-KR')}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* 관련 호스트 정보 */}
          {relatedHost && (
            <Card>
              <CardHeader title="관련 호스트" />
              <div className="space-y-3">
                <Link
                  to={`/hosts/${relatedHost.id}`}
                  className="flex items-center gap-3 p-3 bg-[var(--kecp-gray-50)] rounded-lg border border-[var(--kecp-gray-200)] hover:border-[var(--kecp-primary)] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--kecp-primary)] to-[var(--kecp-secondary)] flex items-center justify-center">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--kecp-gray-900)] truncate">{relatedHost.name}</span>
                      <StatusBadge status={relatedHost.status} />
                    </div>
                    {relatedHost.sshConfig && (
                      <p className="text-xs text-[var(--kecp-gray-500)] font-mono mt-0.5">
                        {relatedHost.sshConfig.host}:{relatedHost.sshConfig.port}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--kecp-gray-300)] group-hover:text-[var(--kecp-primary)]" />
                </Link>

                <button
                  onClick={() => terminalMutation.mutate()}
                  disabled={terminalMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--kecp-gray-900)] text-white rounded-lg text-sm font-medium hover:bg-[var(--kecp-gray-700)] disabled:opacity-50 transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  {terminalMutation.isPending ? '연결 중...' : '터미널 접속'}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 해결 모달 */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md" hover={false}>
            <h3 className="text-lg font-semibold text-[var(--kecp-gray-900)] mb-4">티켓 해결</h3>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="해결 방법을 입력하세요..."
              rows={4}
              className="kecp-input resize-none mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleResolve}
                disabled={!resolutionText.trim()}
                loading={resolveMutation.isPending}
              >
                해결 완료
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
