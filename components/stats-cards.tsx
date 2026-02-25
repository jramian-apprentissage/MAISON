import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAriary } from '@/lib/format'

export function StatsCards({
  income,
  expenses,
  budgetTotal,
}: {
  income: number
  expenses: number
  budgetTotal: number
}) {
  const balance = income - expenses
  const remaining = budgetTotal - expenses

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenus
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg font-semibold">
          {formatAriary(income)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dépenses
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg font-semibold">
          {formatAriary(expenses)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Solde
          </CardTitle>
        </CardHeader>
        <CardContent
          className={`text-lg font-semibold ${
            balance >= 0 ? 'text-success' : 'text-destructive'
          }`}
        >
          {formatAriary(balance)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Reste budget
          </CardTitle>
        </CardHeader>
        <CardContent
          className={`text-lg font-semibold ${
            remaining >= 0 ? 'text-success' : 'text-destructive'
          }`}
        >
          {formatAriary(remaining)}
        </CardContent>
      </Card>
    </div>
  )
}
