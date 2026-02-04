import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, Send, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react'
import { getTicket, receiveTicket, transitionTicket, resolveTicket, addComment, type TicketStatus } from '../api/tickets'

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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          티켓 정보를 불러오는데 실패했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-bold rounded border ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                {statusLabels[ticket.status]}
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {ticket.status === 'NEW' && (
            <button
              onClick={() => receiveMutation.mutate()}
              disabled={receiveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              접수
            </button>
          )}
          {ticket.status === 'ASSIGNED' && (
            <button
              onClick={() => transitionMutation.mutate('IN_PROGRESS')}
              disabled={transitionMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              처리 시작
            </button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => transitionMutation.mutate('PENDING')}
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Pause className="w-5 h-5" />
                보류
              </button>
              <button
                onClick={() => setShowResolveModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                해결
              </button>
            </>
          )}
          {ticket.status === 'PENDING' && (
            <button
              onClick={() => transitionMutation.mutate('IN_PROGRESS')}
              disabled={transitionMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
              재개
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="col-span-2 space-y-6">
          {/* 설명 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">설명</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {ticket.description || '설명 없음'}
            </p>

            {ticket.resolutionSummary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-green-700 mb-2">해결 방법</h3>
                <p className="text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded-lg">
                  {ticket.resolutionSummary}
                </p>
              </div>
            )}
          </div>

          {/* 활동 기록 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">활동 기록</h2>
            
            <div className="space-y-4">
              {ticket.activities.length === 0 ? (
                <p className="text-gray-500">활동 기록이 없습니다.</p>
              ) : (
                ticket.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'STATUS_CHANGE' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'COMMENT' ? 'bg-gray-100 text-gray-600' :
                        activity.type === 'ASSIGNMENT' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.content}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(activity.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 코멘트 입력 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="코멘트 입력..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 정보</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">상태</dt>
                <dd className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">우선순위</dt>
                <dd className="mt-1">
                  <span className={`px-2 py-1 text-xs font-bold rounded border ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">소스</dt>
                <dd className="mt-1 text-gray-900">{ticket.source}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">생성일</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(ticket.createdAt).toLocaleString('ko-KR')}
                </dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-sm text-gray-500">해결일</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(ticket.resolvedAt).toLocaleString('ko-KR')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* 해결 모달 */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">티켓 해결</h3>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="해결 방법을 입력하세요..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolutionText.trim() || resolveMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {resolveMutation.isPending ? '처리 중...' : '해결 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
