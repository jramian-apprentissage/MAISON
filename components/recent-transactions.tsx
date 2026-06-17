import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/lib/currency'
import type { Transaction, Category } from '@/lib/types'

export function RecentTransactions({
  transactions,
}: {
  transactions: (Transaction & { categories?: Category; profiles?: { display_name: string | null } })[]
}) {
  const { format } = useCurrency()
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Transactions récentes</CardTitle>
        <Link
          href="/dashboard/transactions"
          className="text-sm text-primary underline underline-offset-4"
        >
          Voir tout
        </Link>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {transactions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucune transaction ce mois-ci.
          </div>
        ) : (
          transactions.map((t) => {
            const catName = t.categories?.name ?? 'Catégorie'
            const sign = t.type === 'expense' ? '-' : '+'
            const isExpense = t.type === 'expense'

            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-[14px] p-3 transition-colors duration-[250ms] ease-out hover:bg-secondary"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.categories?.color ?? '#64748b' }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{catName}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.date}
                      {t.profiles?.display_name ? ` • ${t.profiles.display_name}` : ''}
                      {t.note ? ` • ${t.note}` : ''}
                    </div>
                  </div>
                </div>

                <div
                  className={`shrink-0 text-sm font-semibold ${
                    isExpense ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {sign}
                  {format(t.amount)}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
