import { useEffect, useState } from 'react'

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let rafId: number
    let current = 0

    const onScroll = () => {
      current = window.scrollY
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrollY(current))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return scrollY
}
