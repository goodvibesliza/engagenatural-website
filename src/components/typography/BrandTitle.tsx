import React from 'react'

type BrandTitleProps = {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3'
  compact?: boolean
  className?: string
}

export default function BrandTitle({ children, as = 'h1', compact = false, className = '' }: BrandTitleProps) {
  const Tag = as
  const classes = ['font-display', 'brand-title']
  if (compact) classes.push('headline-compact')
  if (className) classes.push(className)

  return <Tag className={classes.join(' ')}>{children}</Tag>
}

export { BrandTitle }
