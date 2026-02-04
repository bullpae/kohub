import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="kecp-empty py-12">
      <Icon className="w-16 h-16 kecp-empty-icon mb-4" />
      <h3 className="text-lg font-medium text-[var(--kecp-gray-700)] mb-2">{title}</h3>
      {description && (
        <p className="kecp-empty-text max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
