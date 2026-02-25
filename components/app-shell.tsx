import Link from 'next/link'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export function AppShell({
  householdName,
  children,
}: {
  householdName: string
  children: ReactNode
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:px-6">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Foyer</div>
            <div className="truncate text-sm font-semibold">{householdName}</div>
          </div>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/budget">Budget</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl">{children}</main>
    </div>
  )
}
