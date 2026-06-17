'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { MonthSelector } from '@/components/month-selector'
import { getCurrentYearMonth, getMonthRange } from '@/lib/format'
import { formatCurrency } from '@/lib/currency'
import { createClient } from '@/lib/supabase/client'
import { createOrUpdateBudget, copyPreviousMonthBudget } from '@/lib/actions/budget'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface BudgetClientProps {
  householdId: string
  householdName: string
  userName: string
  currency: string
  categories: Category[]
}

interface BudgetLineState {
  category_id: string
  planned_amount: number
  spent: number
}

export function BudgetClient({
  householdId,
  householdName,
  userName,
  currency,
  categories,
}: BudgetClientProps) {
  const format = (amount: number) => formatCurrency(amount, currency)
  const { year: initialYear, month: initialMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [lines, setLines] = useState<BudgetLineState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchBudget = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Get month budget
    const { data: monthBudget } = await supabase
      .from('month_budgets')
      .select('id')
      .eq('household_id', householdId)
      .eq('year', year)
      .eq('month', month)
      .single()

    let budgetLines: { category_id: string; planned_amount: number }[] = []

    if (monthBudget) {
      const { data } = await supabase
        .from('budget_lines')
        .select('category_id, planned_amount')
        .eq('month_budget_id', monthBudget.id)
      budgetLines = data || []
    }

    // Get transactions for spending
    const { start, end } = getMonthRange(year, month)
    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end)

    const spendingMap = new Map<string, number>()
    for (const tx of txs || []) {
      spendingMap.set(tx.category_id, (spendingMap.get(tx.category_id) || 0) + tx.amount)
    }

    // Merge everything
    const budgetMap = new Map(budgetLines.map((l) => [l.category_id, l.planned_amount]))
    const newLines: BudgetLineState[] = categories.map((cat) => ({
      category_id: cat.id,
      planned_amount: budgetMap.get(cat.id) || 0,
      spent: spendingMap.get(cat.id) || 0,
    }))

    setLines(newLines)
    setIsLoading(false)
  }, [householdId, year, month, categories])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const handleSave = async () => {
    setIsSaving(true)
    const result = await createOrUpdateBudget(
      householdId,
      year,
      month,
      lines.map((l) => ({ category_id: l.category_id, planned_amount: l.planned_amount }))
    )
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Budget enregistre')
    }
    setIsSaving(false)
  }

  const handleCopyPrevious = async () => {
    setIsSaving(true)
    const result = await copyPreviousMonthBudget(householdId, year, month)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Budget copie du mois precedent')
      fetchBudget()
    }
    setIsSaving(false)
  }

  const updateLine = (categoryId: string, amount: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.category_id === categoryId ? { ...l, planned_amount: amount } : l
      )
    )
  }

  const totalPlanned = lines.reduce((s, l) => s + l.planned_amount, 0)
  const totalSpent = lines.reduce((s, l) => s + l.spent, 0)

  return (
    <AppShell householdName={householdName} userName={userName} currency={currency}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-[36px]">Budget mensuel</h1>
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyPrevious}
            disabled={isSaving}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copier le mois precedent
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">Budget total</div>
              <div className="text-2xl font-semibold tracking-tight">{format(totalPlanned)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">Depense</div>
              <div className="text-2xl font-semibold tracking-tight">{format(totalSpent)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">Restant</div>
              <div className={`text-2xl font-semibold tracking-tight ${totalPlanned - totalSpent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {format(totalPlanned - totalSpent)}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lines.map((line) => {
              const cat = categories.find((c) => c.id === line.category_id)
              if (!cat) return null
              const percent = line.planned_amount > 0
                ? Math.min((line.spent / line.planned_amount) * 100, 100)
                : 0
              const isOver = line.spent > line.planned_amount && line.planned_amount > 0
              const isNear = !isOver && percent >= 80
              const indicatorClass = isOver
                ? 'bg-destructive'
                : isNear
                  ? 'bg-warning'
                  : 'bg-primary'

              return (
                <Card key={line.category_id} className="transition-transform duration-[250ms] ease-out hover:-translate-y-0.5">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={line.planned_amount || ''}
                          onChange={(e) =>
                            updateLine(line.category_id, parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="0"
                          className="h-8 text-right text-sm"
                        />
                      </div>
                    </div>
                    {line.planned_amount > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <Progress value={percent} className="h-1.5" indicatorClassName={indicatorClass} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(line.spent)} depense</span>
                          <span className={isOver ? 'font-medium text-destructive' : isNear ? 'font-medium text-warning' : ''}>
                            {isOver
                              ? `Depasse de ${format(line.spent - line.planned_amount)}`
                              : `${format(line.planned_amount - line.spent)} restant`}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
