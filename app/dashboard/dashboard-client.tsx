'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { StatsCards } from '@/components/stats-cards'
import { CategoryDonutChart } from '@/components/category-donut-chart'
import { BudgetEvolutionChart } from '@/components/budget-evolution-chart'
import { HeroBudgetCard } from '@/components/hero-budget-card'
import { RecentTransactions } from '@/components/recent-transactions'
import { MonthSelector } from '@/components/month-selector'
import { getCurrentYearMonth, getMonthRange } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Category, Transaction } from '@/lib/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardClientProps {
  householdId: string
  householdName: string
  userName: string
  currency: string
  categories: Category[]
  userRole: string
}

interface MonthData {
  transactions: (Transaction & { categories: Category; profiles?: { display_name: string | null } })[]
  income: number
  expenses: number
  budgetTotal: number
  categoryExpenses: { name: string; amount: number; color: string }[]
}

export function DashboardClient({
  householdId,
  householdName,
  userName,
  currency,
  categories,
}: DashboardClientProps) {
  const { year: initialYear, month: initialMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [data, setData] = useState<MonthData>({
    transactions: [],
    income: 0,
    expenses: 0,
    budgetTotal: 0,
    categoryExpenses: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [evolution, setEvolution] = useState<{ label: string; budget: number; expenses: number }[]>([])

  const fetchEvolution = useCallback(async () => {
    const supabase = createClient()

    const months: { year: number; month: number }[] = []
    let y = year
    let m = month
    for (let i = 0; i < 6; i++) {
      months.unshift({ year: y, month: m })
      m -= 1
      if (m < 1) {
        m = 12
        y -= 1
      }
    }

    const { start } = getMonthRange(months[0].year, months[0].month)
    const { end } = getMonthRange(months[months.length - 1].year, months[months.length - 1].month)

    const { data: txs } = await supabase
      .from('transactions')
      .select('date, amount')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end)

    const expenseByKey = new Map<string, number>()
    for (const t of txs || []) {
      const key = t.date.slice(0, 7)
      expenseByKey.set(key, (expenseByKey.get(key) || 0) + t.amount)
    }

    const orFilter = months.map((mo) => `and(year.eq.${mo.year},month.eq.${mo.month})`).join(',')
    const { data: monthBudgets } = await supabase
      .from('month_budgets')
      .select('id, year, month')
      .eq('household_id', householdId)
      .or(orFilter)

    const budgetByKey = new Map<string, number>()
    if (monthBudgets && monthBudgets.length > 0) {
      const ids = monthBudgets.map((b) => b.id)
      const { data: lines } = await supabase
        .from('budget_lines')
        .select('month_budget_id, planned_amount')
        .in('month_budget_id', ids)

      const sumByBudgetId = new Map<string, number>()
      for (const l of lines || []) {
        sumByBudgetId.set(l.month_budget_id, (sumByBudgetId.get(l.month_budget_id) || 0) + l.planned_amount)
      }
      for (const mb of monthBudgets) {
        const key = `${mb.year}-${String(mb.month).padStart(2, '0')}`
        budgetByKey.set(key, sumByBudgetId.get(mb.id) || 0)
      }
    }

    setEvolution(
      months.map((mo) => {
        const key = `${mo.year}-${String(mo.month).padStart(2, '0')}`
        const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
          new Date(mo.year, mo.month - 1, 1)
        )
        return {
          label,
          budget: budgetByKey.get(key) || 0,
          expenses: expenseByKey.get(key) || 0,
        }
      })
    )
  }, [householdId, year, month])

  useEffect(() => {
    fetchEvolution()
  }, [fetchEvolution])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { start, end } = getMonthRange(year, month)

    // Fetch transactions for the month
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, categories(*), profiles(display_name)')
      .eq('household_id', householdId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    const transactions = (txs || []) as (Transaction & { categories: Category; profiles?: { display_name: string | null } })[]

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Fetch budget data
    const { data: monthBudget } = await supabase
      .from('month_budgets')
      .select('id')
      .eq('household_id', householdId)
      .eq('year', year)
      .eq('month', month)
      .single()

    let budgetTotal = 0

    if (monthBudget) {
      const { data: lines } = await supabase
        .from('budget_lines')
        .select('planned_amount')
        .eq('month_budget_id', monthBudget.id)

      if (lines) {
        budgetTotal = lines.reduce((sum, l) => sum + l.planned_amount, 0)
      }
    }

    // Calculate category expenses for chart
    const catMap = new Map<string, { name: string; amount: number; color: string }>()
    for (const tx of transactions.filter((t) => t.type === 'expense')) {
      const cat = tx.categories
      if (!cat) continue
      const existing = catMap.get(cat.id)
      if (existing) {
        existing.amount += tx.amount
      } else {
        catMap.set(cat.id, { name: cat.name, amount: tx.amount, color: cat.color })
      }
    }
    const categoryExpenses = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)

    setData({
      transactions,
      income,
      expenses,
      budgetTotal,
      categoryExpenses,
    })
    setIsLoading(false)
  }, [householdId, year, month, categories])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }

  return (
    <AppShell householdName={householdName} userName={userName} currency={currency}>
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-[36px]">
            Bonjour {userName.split(' ')[0]} 👋
          </h1>
          <MonthSelector year={year} month={month} onChange={handleMonthChange} />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="aurora-bg" />
              <div className="relative">
                <HeroBudgetCard budgetTotal={data.budgetTotal} spent={data.expenses} />
              </div>
            </div>

            <StatsCards
              income={data.income}
              expenses={data.expenses}
              budgetTotal={data.budgetTotal}
            />

            <BudgetEvolutionChart data={evolution} />

            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryDonutChart
                data={data.categoryExpenses}
                title="Top depenses par categorie"
              />
              <RecentTransactions transactions={data.transactions.slice(0, 5)} />
            </div>
          </>
        )}
      </div>

      {/* FAB for quick transaction (desktop only — mobile uses the bottom nav "+") */}
      <Link
        href="/dashboard/transactions?new=1"
        className="fixed bottom-10 right-10 z-30 hidden md:block"
      >
        <Button className="h-[72px] w-[72px] rounded-full bg-primary shadow-[0_8px_30px_rgba(15,23,42,0.12)] hover:-translate-y-0.5">
          <Plus className="h-7 w-7" strokeWidth={1.75} />
          <span className="sr-only">Nouvelle transaction</span>
        </Button>
      </Link>
    </AppShell>
  )
}
