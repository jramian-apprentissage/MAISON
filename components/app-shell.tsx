import { ReactNode } from 'react'
import { CurrencyProvider } from '@/lib/currency'
import { Sidebar } from '@/components/sidebar'
import { BottomNav } from '@/components/bottom-nav'

export function AppShell({
  householdName,
  userName = 'Utilisateur',
  currency = 'MGA',
  children,
}: {
  householdName: string
  userName?: string
  currency?: string
  children: ReactNode
}) {
  return (
    <CurrencyProvider currency={currency}>
      <div className="flex min-h-svh bg-background">
        <Sidebar householdName={householdName} userName={userName} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur md:hidden">
            <div className="flex h-14 items-center px-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Foyer</div>
                <div className="truncate text-sm font-semibold">{householdName}</div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 pb-24 md:px-10 md:py-10 md:pb-10">
            {children}
          </main>

          <BottomNav />
        </div>
      </div>
    </CurrencyProvider>
  )
}
