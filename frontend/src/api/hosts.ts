import apiClient from './client'

export interface SshConfig {
  host: string
  port: number
  username: string
}

export interface Host {
  id: string
  name: string
  description: string | null
  connectionType: 'SSH' | 'HTTPS' | 'AGENT'
  sshConfig: SshConfig | null
  tags: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  organizationId: string | null
  createdAt: string
  updatedAt: string
}

export interface HostRequest {
  name: string
  description?: string
  connectionType: 'SSH' | 'HTTPS' | 'AGENT'
  sshConfig?: {
    host: string
    port: number
    username: string
  }
  tags?: string[]
  organizationId?: string
}

export interface HostStats {
  total: number
  active: number
  inactive: number
  maintenance: number
}

export interface PageResponse<T> {
  data: T[]
  page: {
    number: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
  }
}

export interface ApiResponse<T> {
  data: T
  error?: {
    code: string
    message: string
  }
  meta: {
    timestamp: string
    requestId: string
  }
}

// 호스트 목록 조회
export async function getHosts(params?: {
  status?: string
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<Host>> {
  const response = await apiClient.get<ApiResponse<PageResponse<Host>>>('/api/v1/hosts', { params })
  return response.data.data
}

// 호스트 상세 조회
export async function getHost(id: string): Promise<Host> {
  const response = await apiClient.get<ApiResponse<Host>>(`/api/v1/hosts/${id}`)
  return response.data.data
}

// 호스트 생성
export async function createHost(request: HostRequest): Promise<Host> {
  const response = await apiClient.post<ApiResponse<Host>>('/api/v1/hosts', request)
  return response.data.data
}

// 호스트 수정
export async function updateHost(id: string, request: HostRequest): Promise<Host> {
  const response = await apiClient.put<ApiResponse<Host>>(`/api/v1/hosts/${id}`, request)
  return response.data.data
}

// 호스트 삭제
export async function deleteHost(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/hosts/${id}`)
}

// 호스트 상태 변경
export async function changeHostStatus(id: string, status: string): Promise<Host> {
  const response = await apiClient.patch<ApiResponse<Host>>(`/api/v1/hosts/${id}/status`, null, {
    params: { status }
  })
  return response.data.data
}

// 호스트 통계
export async function getHostStats(): Promise<HostStats> {
  const response = await apiClient.get<ApiResponse<HostStats>>('/api/v1/hosts/stats')
  return response.data.data
}

// 호스트 어댑터 타입
export interface HostAdapter {
  id: string
  adapterType: string
  externalId: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR'
  lastSyncAt: string | null
}

export interface HostAdapterDetail extends HostAdapter {
  hostId: string
  hostName: string
  config: Record<string, unknown>
  errorMessage: string | null
  createdAt: string
}

export interface HostAdapterRequest {
  adapterType: string
  externalId?: string
  config?: Record<string, unknown>
}

// 호스트 어댑터 목록
export async function getHostAdapters(hostId: string): Promise<HostAdapter[]> {
  const response = await apiClient.get<ApiResponse<HostAdapter[]>>(`/api/v1/hosts/${hostId}/adapters`)
  return response.data.data
}

// 호스트 어댑터 생성
export async function createHostAdapter(hostId: string, request: HostAdapterRequest): Promise<HostAdapterDetail> {
  const response = await apiClient.post<ApiResponse<HostAdapterDetail>>(`/api/v1/hosts/${hostId}/adapters`, request)
  return response.data.data
}

// 호스트 어댑터 삭제
export async function deleteHostAdapter(hostId: string, adapterId: string): Promise<void> {
  await apiClient.delete(`/api/v1/hosts/${hostId}/adapters/${adapterId}`)
}

// 터미널 URL
export interface TerminalUrl {
  url: string
  sessionId: string
  hostId: string
  hostName: string
  sshHost: string
  sshPort: number
  sshUser: string
}

export async function getTerminalUrl(hostId: string, ticketId?: string): Promise<TerminalUrl> {
  const response = await apiClient.get<ApiResponse<TerminalUrl>>(`/api/v1/hosts/${hostId}/terminal/url`, {
    params: ticketId ? { ticketId } : {}
  })
  return response.data.data
}
