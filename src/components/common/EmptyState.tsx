import React from 'react'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border border-stone-200 rounded-lg p-10 text-center bg-white">
      <div className="text-2xl font-semibold text-stone-900 font-serif">{title}</div>
      {description && <p className="mt-2 text-stone-600 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-stone-900 text-white hover:bg-stone-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
