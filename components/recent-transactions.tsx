import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAriary } from '@/lib/format'
import type { Transaction, Category } from '@/lib/types'

export function RecentTransactions({
  transactions,
}: {
  transactions: (Transaction & { categories?: Category })[]
}) {
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
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{catName}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.date}
                    {t.note ? ` • ${t.note}` : ''}
                  </div>
                </div>

                <div
                  className={`shrink-0 text-sm font-semibold ${
                    isExpense ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {sign}
                  {formatAriary(t.amount)}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
