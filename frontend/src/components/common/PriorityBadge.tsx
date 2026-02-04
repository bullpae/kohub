interface PriorityConfig {
  label: string
  className: string
}

const priorityConfig: Record<string, PriorityConfig> = {
  CRITICAL: { label: 'CRITICAL', className: 'kecp-priority-critical' },
  HIGH: { label: 'HIGH', className: 'kecp-priority-high' },
  MEDIUM: { label: 'MEDIUM', className: 'kecp-priority-medium' },
  LOW: { label: 'LOW', className: 'kecp-priority-low' },
  // KustHub 호환
  P1: { label: 'P1', className: 'kecp-priority-critical' },
  P2: { label: 'P2', className: 'kecp-priority-high' },
  P3: { label: 'P3', className: 'kecp-priority-medium' },
  P4: { label: 'P4', className: 'kecp-priority-low' },
}

interface PriorityBadgeProps {
  priority: string
  className?: string
}

export default function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority, className: 'kecp-priority-low' }
  
  return (
    <span className={`kecp-priority ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}
