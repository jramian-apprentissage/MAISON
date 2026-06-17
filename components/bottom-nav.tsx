'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, PieChart, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/dashboard/transactions', icon: CreditCard, label: 'Transactions' },
  { href: '/dashboard/transactions?new=1', icon: Plus, label: 'Ajouter', isAdd: true },
  { href: '/dashboard/budget', icon: PieChart, label: 'Budget' },
  { href: '/dashboard/members', icon: Users, label: 'Foyer' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border bg-sidebar px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = !item.isAdd && pathname === item.href

        if (item.isAdd) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-transform duration-[250ms] ease-out active:scale-[0.96]"
              aria-label={item.label}
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium transition-colors duration-[250ms] ease-out',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        )
      })}
    </nav>
  )
}
