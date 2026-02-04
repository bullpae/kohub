interface LogoProps {
  size?: 'sm' | 'default' | 'lg'
  showSubtitle?: boolean
}

export default function Logo({ size = 'default', showSubtitle = false }: LogoProps) {
  const sizes = {
    sm: { container: 'w-7 h-7', text: 'text-lg', subtitle: 'text-xs' },
    default: { container: 'w-9 h-9', text: 'text-xl', subtitle: 'text-sm' },
    lg: { container: 'w-12 h-12', text: 'text-2xl', subtitle: 'text-base' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.container} bg-gradient-to-br from-[var(--kecp-primary)] to-[var(--kecp-secondary)] rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold">K</span>
      </div>
      <div>
        <span className={`${s.text} font-bold text-[var(--kecp-gray-900)]`}>kohub</span>
        {showSubtitle && (
          <p className={`${s.subtitle} text-[var(--kecp-gray-500)] -mt-0.5`}>MSP 운영센터</p>
        )}
      </div>
    </div>
  )
}
