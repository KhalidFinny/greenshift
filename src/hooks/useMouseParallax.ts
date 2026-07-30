import { useRef, useEffect } from 'react'

interface UseMouseParallaxOptions {
  intensity?: number
  smoothMs?: number
}

export function useMouseParallax<T extends HTMLElement = HTMLDivElement>({
  intensity = 0.02,
  smoothMs = 200,
}: UseMouseParallaxOptions = {}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.transition = `transform ${smoothMs}ms ease-out`
    el.style.willChange = 'transform'

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = Math.round((e.clientX - cx) * intensity)
      const dy = Math.round((e.clientY - cy) * intensity)
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [intensity, smoothMs])

  return ref
}
