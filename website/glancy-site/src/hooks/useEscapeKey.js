import { useEffect } from 'react'

export default function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handler(e)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handler, active])
}

