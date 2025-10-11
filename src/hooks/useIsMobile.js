import { useEffect, useState } from 'react'

const getIsMobile = () => {
  if (typeof window === 'undefined') return false
  try {
    // Prefer matchMedia, fallback to innerWidth
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 767.98px)').matches
    }
    return window.innerWidth < 768
  } catch {
    return false
  }
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 767.98px)')
    const handler = (e) => setIsMobile(e.matches)
    // Initialize and subscribe
    setIsMobile(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else if (mq.addListener) mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else if (mq.removeListener) mq.removeListener(handler)
    }
  }, [])

  return isMobile
}
