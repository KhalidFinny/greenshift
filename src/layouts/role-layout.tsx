import type { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useAuth } from '#/lib/auth'
import type { UserRole } from '#/lib/auth'

interface RoleLayoutProps {
  children: ReactNode
  role: UserRole
  title: string
  navItems: Array<{ to: string; label: string }>
}

function useLogout() {
  const { logout } = useAuth()
  const router = useRouter()

  return () => {
    logout()
    router.invalidate()
  }
}

export function RoleLayout({ children, role, title, navItems }: RoleLayoutProps) {
  const { user } = useAuth()
  const handleLogout = useLogout()

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <aside className="hidden w-64 flex-shrink-0 border-r border-[var(--line)] bg-[var(--surface)] p-4 sm:flex sm:flex-col" aria-label="Panel navigasi">
        <div className="mb-6">
          <p className="island-kicker mb-1 text-xs">{title}</p>
          <p className="truncate text-sm font-semibold text-[var(--sea-ink)]">
            {user?.name}
          </p>
        </div>
        <nav className="space-y-1" aria-label="Menu sidebar">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
              activeProps={{
                className:
                  'block rounded-lg px-3 py-2 text-sm no-underline bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)] font-semibold',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 py-8" role="main">
        {children}
      </main>
    </div>
  )
}
