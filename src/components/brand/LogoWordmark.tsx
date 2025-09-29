import React from 'react'
import { Link } from 'react-router-dom'

type Size = 'sm' | 'md' | 'lg'

export interface LogoWordmarkProps {
  size?: Size
  className?: string
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-[18px] leading-tight',
  md: 'text-[20px] leading-tight',
  lg: 'text-[24px] leading-tight',
}

export default function LogoWordmark({ size = 'md', className }: LogoWordmarkProps): JSX.Element {
  const sizeClass = sizeClasses[size]

  return (
    <div className={`brand-wordmark ${sizeClass} ${className ?? ''}`.trim()}>
      <Link
        to="/"
        aria-label="Go to homepage"
        title="EngageNatural"
        className="brand-home focus-visible:ring-2 focus-visible:ring-[var(--accent-pink,#F2D4CA)] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md"
      >
        <span className="font-[700] tracking-tight">Engage</span>
        <span className="font-[500] tracking-tight">Natural</span>
      </Link>
    </div>
  )
}
