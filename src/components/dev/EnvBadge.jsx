import React from 'react'

const EnvBadge = () => {
  const show = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEBUG === 'true'
  if (!show) return null

  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'
  const netlifyContext = import.meta.env.VITE_NETLIFY_CONTEXT

  let label = 'Production'
  let cls = 'bg-green-600/90 text-white'
  if (useEmulator) {
    label = 'Emulator'
    cls = 'bg-amber-600/90 text-white'
  } else if (netlifyContext === 'deploy-preview') {
    label = 'Deploy Preview'
    cls = 'bg-purple-600/90 text-white'
  }

  return (
    <div className={`fixed left-3 bottom-3 z-[9999] select-none rounded px-2.5 py-1 text-xs font-medium shadow-lg backdrop-blur ${cls}`}>
      {label}
    </div>
  )
}

export default EnvBadge
