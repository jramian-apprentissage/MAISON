import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAriary } from '@/lib/format'

export function TopCategoriesChart({
  data,
  title,
}: {
  data: { name: string; amount: number; color: string }[]
  title: string
}) {
  const top = (data || []).slice(0, 5)
  const max = top.reduce((m, x) => Math.max(m, x.amount), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {top.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune dépense</div>
        ) : (
          top.map((item) => {
            const pct = max > 0 ? Math.round((item.amount / max) * 100) : 0
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatAriary(item.amount)}
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded bg-muted">
                    <div
                      className="h-1.5 rounded"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
