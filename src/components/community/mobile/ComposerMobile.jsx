import React from 'react'

export default function ComposerMobile({ onStartPost }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm" data-testid="mobile-linkedin-composer">
      <button
        type="button"
        onClick={onStartPost}
        aria-label="Start a new post"
        className="w-full h-11 min-h-[44px] inline-flex items-center px-3 rounded-lg border border-gray-300 text-left text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
      >
        Share something…
      </button>
    </div>
  )
}
