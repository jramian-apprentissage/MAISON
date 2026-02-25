'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/app-shell'
import { StatsCards } from '@/components/stats-cards'
import { TopCategoriesChart } from '@/components/top-categories-chart'
import { BudgetProgress } from '@/components/budget-progress'
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
  categories: Category[]
  userRole: string
}

interface MonthData {
  transactions: (Transaction & { categories: Category })[]
  income: number
  expenses: number
  budgetTotal: number
  budgetAlerts: { categoryName: string; planned: number; spent: number; color: string }[]
  categoryExpenses: { name: string; amount: number; color: string }[]
}

export function DashboardClient({
  householdId,
  householdName,
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
    budgetAlerts: [],
    categoryExpenses: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { start, end } = getMonthRange(year, month)

    // Fetch transactions for the month
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('household_id', householdId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    const transactions = (txs || []) as (Transaction & { categories: Category })[]

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
    const budgetAlerts: MonthData['budgetAlerts'] = []

    if (monthBudget) {
      const { data: lines } = await supabase
        .from('budget_lines')
        .select('*, categories(*)')
        .eq('month_budget_id', monthBudget.id)

      if (lines) {
        budgetTotal = lines.reduce((sum, l) => sum + l.planned_amount, 0)

        // Calculate spending per category for alerts
        const expenseCategories = categories.filter((c) => c.type === 'expense')
        for (const line of lines) {
          const cat = expenseCategories.find((c) => c.id === line.category_id)
          if (!cat) continue
          const spent = transactions
            .filter((t) => t.type === 'expense' && t.category_id === line.category_id)
            .reduce((sum, t) => sum + t.amount, 0)
          budgetAlerts.push({
            categoryName: cat.name,
            planned: line.planned_amount,
            spent,
            color: cat.color,
          })
        }
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
      budgetAlerts,
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
    <AppShell householdName={householdName}>
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tableau de bord</h1>
          <MonthSelector year={year} month={month} onChange={handleMonthChange} />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <StatsCards
              income={data.income}
              expenses={data.expenses}
              budgetTotal={data.budgetTotal}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TopCategoriesChart
                data={data.categoryExpenses}
                title="Top depenses par categorie"
              />
              <BudgetProgress
                alerts={data.budgetAlerts}
                totalBudget={data.budgetTotal}
                totalSpent={data.expenses}
              />
            </div>

            <RecentTransactions transactions={data.transactions.slice(0, 5)} />
          </>
        )}
      </div>

      {/* FAB for quick transaction */}
      <Link
        href="/dashboard/transactions?new=1"
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-8"
      >
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Nouvelle transaction</span>
        </Button>
      </Link>
    </AppShell>
  )
}
