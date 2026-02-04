import { RotateCcw } from 'lucide-react'

interface StatusConfig {
  label: string
  className: string
  icon?: boolean
}

const statusConfig: Record<string, StatusConfig> = {
  // 티켓 상태
  NEW: { label: '신규', className: 'kecp-badge-new' },
  RECEIVED: { label: '접수', className: 'kecp-badge-received' },
  ASSIGNED: { label: '배정', className: 'kecp-badge-assigned' },
  IN_PROGRESS: { label: '진행중', className: 'kecp-badge-in-progress' },
  PENDING: { label: '보류', className: 'kecp-badge-pending' },
  RESOLVED: { label: '해결', className: 'kecp-badge-resolved' },
  COMPLETED: { label: '완료', className: 'kecp-badge-completed' },
  CLOSED: { label: '종료', className: 'kecp-badge-closed' },
  REOPENED: { label: '재오픈', className: 'kecp-badge-reopened', icon: true },
  // 호스트 상태
  ACTIVE: { label: '활성', className: 'kecp-badge-active' },
  INACTIVE: { label: '비활성', className: 'kecp-badge-inactive' },
  MAINTENANCE: { label: '점검중', className: 'kecp-badge-maintenance' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'kecp-badge-closed' }
  
  return (
    <span className={`kecp-badge ${config.className} ${className}`}>
      {config.icon && <RotateCcw className="w-3 h-3 mr-1" />}
      {config.label}
    </span>
  )
}
