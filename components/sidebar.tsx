'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, PieChart, Users, LogOut, Wallet } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/dashboard/budget', label: 'Budget', icon: PieChart },
  { href: '/dashboard/members', label: 'Foyer', icon: Users },
]

export function Sidebar({
  householdName,
  userName,
}: {
  householdName: string
  userName: string
}) {
  const pathname = usePathname()
  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-svh md:w-[280px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{householdName}</div>
          <div className="text-xs text-muted-foreground">goforit</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-colors duration-[250ms] ease-out',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{userName}</div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Deconnexion"
            className="flex h-8 w-8 items-center justify-center rounded-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </aside>
  )
}
