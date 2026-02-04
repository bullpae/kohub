import apiClient from './client'
import type { ApiResponse, PageResponse } from './hosts'

export interface Ticket {
  id: string
  title: string
  description: string | null
  source: 'MANUAL' | 'UPTIME_KUMA' | 'PROMETHEUS' | 'CUSTOMER_REQUEST'
  sourceEventId: string | null
  status: TicketStatus
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  hostId: string | null
  reporterId: string | null
  assigneeId: string | null
  organizationId: string | null
  resolutionSummary: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export type TicketStatus = 
  | 'NEW' 
  | 'RECEIVED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'PENDING' 
  | 'RESOLVED' 
  | 'COMPLETED' 
  | 'CLOSED' 
  | 'REOPENED'

export interface Activity {
  id: string
  type: 'STATUS_CHANGE' | 'COMMENT' | 'ASSIGNMENT' | 'TERMINAL_ACCESS'
  content: string
  actorId: string | null
  createdAt: string
}

export interface TicketDetail extends Ticket {
  activities: Activity[]
}

export interface TicketRequest {
  title: string
  description?: string
  source?: 'MANUAL' | 'UPTIME_KUMA' | 'PROMETHEUS' | 'CUSTOMER_REQUEST'
  sourceEventId?: string
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  hostId?: string
  organizationId?: string
}

export interface TicketStats {
  total: number
  newCount: number
  inProgress: number
  resolved: number
  critical: number
  high: number
}

// 티켓 목록 조회
export async function getTickets(params?: {
  status?: string
  priority?: string
  assigneeId?: string
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<Ticket>> {
  const response = await apiClient.get<ApiResponse<PageResponse<Ticket>>>('/api/v1/tickets', { params })
  return response.data.data
}

// 미완료 티켓 목록
export async function getOpenTickets(params?: {
  page?: number
  size?: number
}): Promise<PageResponse<Ticket>> {
  const response = await apiClient.get<ApiResponse<PageResponse<Ticket>>>('/api/v1/tickets/open', { params })
  return response.data.data
}

// 티켓 상세 조회
export async function getTicket(id: string): Promise<TicketDetail> {
  const response = await apiClient.get<ApiResponse<TicketDetail>>(`/api/v1/tickets/${id}`)
  return response.data.data
}

// 티켓 생성
export async function createTicket(request: TicketRequest): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>('/api/v1/tickets', request)
  return response.data.data
}

// 티켓 수정
export async function updateTicket(id: string, request: TicketRequest): Promise<Ticket> {
  const response = await apiClient.put<ApiResponse<Ticket>>(`/api/v1/tickets/${id}`, request)
  return response.data.data
}

// 티켓 접수
export async function receiveTicket(id: string): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/api/v1/tickets/${id}/receive`)
  return response.data.data
}

// 담당자 배정
export async function assignTicket(id: string, assigneeId: string): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/api/v1/tickets/${id}/assign`, null, {
    params: { assigneeId }
  })
  return response.data.data
}

// 상태 전이
export async function transitionTicket(id: string, status: TicketStatus, reason?: string): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/api/v1/tickets/${id}/transition`, null, {
    params: { status, reason }
  })
  return response.data.data
}

// 해결 처리
export async function resolveTicket(id: string, summary: string): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/api/v1/tickets/${id}/resolve`, null, {
    params: { summary }
  })
  return response.data.data
}

// 코멘트 추가
export async function addComment(id: string, content: string): Promise<TicketDetail> {
  const response = await apiClient.post<ApiResponse<TicketDetail>>(`/api/v1/tickets/${id}/comments`, null, {
    params: { content }
  })
  return response.data.data
}

// 티켓 통계
export async function getTicketStats(): Promise<TicketStats> {
  const response = await apiClient.get<ApiResponse<TicketStats>>('/api/v1/tickets/stats')
  return response.data.data
}
