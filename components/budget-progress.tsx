import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatAriary } from '@/lib/format'

export function BudgetProgress({
  alerts,
  totalBudget,
  totalSpent,
}: {
  alerts: { categoryName: string; planned: number; spent: number; color: string }[]
  totalBudget: number
  totalSpent: number
}) {
  const pct =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  const overs = (alerts || [])
    .filter((a) => a.planned > 0 && a.spent > a.planned)
    .sort((a, b) => (b.spent - b.planned) - (a.spent - a.planned))
    .slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progression budget</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">
            {formatAriary(totalSpent)} / {formatAriary(totalBudget)}
          </span>
        </div>

        <Progress value={pct} className="h-2" />

        {totalBudget > 0 && (
          <div className="text-xs text-muted-foreground">
            {formatAriary(Math.max(totalBudget - totalSpent, 0))} restant
          </div>
        )}

        {overs.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-destructive">
              Dépassements
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {overs.map((a) => (
                <div key={a.categoryName} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="truncate">{a.categoryName}</span>
                  </div>
                  <span className="text-destructive font-medium">
                    +{formatAriary(a.spent - a.planned)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
