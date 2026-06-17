import { Card, CardContent } from '@/components/ui/card'
import { useCurrency } from '@/lib/currency'
import { ArrowDownToLine, ArrowUpFromLine, PiggyBank, Target, type LucideIcon } from 'lucide-react'

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: 'success' | 'destructive' | 'info' | 'insight'
}) {
  const toneClasses: Record<string, string> = {
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-info',
    insight: 'bg-insight/10 text-insight',
  }

  return (
    <Card className="transition-transform duration-[250ms] ease-out hover:-translate-y-0.5">
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({
  income,
  expenses,
  budgetTotal,
}: {
  income: number
  expenses: number
  budgetTotal: number
}) {
  const { format } = useCurrency()
  const savings = Math.max(income - expenses, 0)
  const remaining = budgetTotal - expenses

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard label="Revenus" value={format(income)} icon={ArrowDownToLine} tone="success" />
      <StatCard label="Depenses" value={format(expenses)} icon={ArrowUpFromLine} tone="destructive" />
      <StatCard label="Epargne" value={format(savings)} icon={PiggyBank} tone="info" />
      <StatCard
        label="Budget restant"
        value={format(remaining)}
        icon={Target}
        tone={remaining >= 0 ? 'success' : 'destructive'}
      />
    </div>
  )
}
