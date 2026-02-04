import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({ 
  children, 
  className = '', 
  hover = true, 
  padding = 'md',
  onClick 
}: CardProps) {
  return (
    <div 
      className={`
        bg-white rounded-xl border border-[var(--kecp-gray-200)] 
        shadow-sm transition-all duration-200
        ${hover ? 'hover:shadow-md hover:border-[var(--kecp-primary)]' : ''}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--kecp-gray-900)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--kecp-gray-500)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
