import React from 'react'

type KickerProps = {
  children: React.ReactNode
  as?: 'div' | 'span'
  muted?: boolean
  className?: string
}

export default function Kicker({ children, as = 'div', muted = false, className = '' }: KickerProps) {
  const Tag = as
  const classes = ['font-display', 'kicker']
  if (className) classes.push(className)

  const style = muted ? { color: 'var(--muted)' } : undefined

  return <Tag className={classes.join(' ')} style={style}>{children}</Tag>
}

export { Kicker }
