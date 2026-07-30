import { useRouterState } from '@tanstack/react-router'

export function useIsHome() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return pathname === '/'
}
