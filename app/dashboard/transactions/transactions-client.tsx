'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { MonthSelector } from '@/components/month-selector'
import { getCurrentYearMonth, getMonthRange } from '@/lib/format'
import { formatCurrency } from '@/lib/currency'
import { createClient } from '@/lib/supabase/client'
import { createTransaction, deleteTransaction } from '@/lib/actions/transactions'
import type { Category, Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { getCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface Member {
  user_id: string
  profiles: { id: string; display_name: string | null } | null
}

interface TransactionsClientProps {
  householdId: string
  householdName: string
  userName: string
  currency: string
  categories: Category[]
  members: Member[]
}

type Row = Transaction & { categories: Category | null; profiles: { display_name: string | null } | null }

export function TransactionsClient({
  householdId,
  householdName,
  userName,
  currency,
  categories,
  members,
}: TransactionsClientProps) {
  const format = (amount: number) => formatCurrency(amount, currency)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  const { year: initialYear, month: initialMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [rows, setRows] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    subcategory_id: '',
    subcategory_name: '',
    responsible_id: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [showSubSuggestions, setShowSubSuggestions] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDialogOpen(true)
      router.replace('/dashboard/transactions')
    }
  }, [searchParams, router])

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { start, end } = getMonthRange(year, month)

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(*), profiles(display_name)')
      .eq('household_id', householdId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    setRows((data || []) as Row[])
    setIsLoading(false)
  }, [householdId, year, month])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const categoriesForType = categories.filter((c) => c.type === form.type)
  const selectedCategory = categoriesForType.find((c) => c.id === form.category_id)

  const flatSubcategories = categoriesForType.flatMap((cat) =>
    (cat.subcategories || [])
      .filter((s) => !s.is_archived)
      .map((sub) => ({ id: sub.id, name: sub.name, category_id: cat.id, categoryName: cat.name }))
  )

  const subQuery = form.subcategory_name.trim().toLowerCase()
  const subMatches = subQuery
    ? flatSubcategories.filter((s) => s.name.toLowerCase().includes(subQuery))
    : []

  useEffect(() => {
    if (!subQuery) return
    if (subMatches.length > 0) return
    if (categoryTouched) return

    const divers = categoriesForType.find((c) => c.name.toLowerCase() === 'divers')
    if (divers && form.category_id !== divers.id) {
      setForm((f) => ({ ...f, category_id: divers.id }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subQuery, subMatches.length, categoryTouched])

  const resetForm = () => {
    setForm({
      type: 'expense',
      category_id: '',
      subcategory_id: '',
      subcategory_name: '',
      responsible_id: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    })
    setCategoryTouched(false)
    setShowSubSuggestions(false)
  }

  const handleSelectSubSuggestion = (sub: { id: string; name: string; category_id: string }) => {
    setForm((f) => ({
      ...f,
      subcategory_name: sub.name,
      subcategory_id: sub.id,
      category_id: sub.category_id,
    }))
    setCategoryTouched(true)
    setShowSubSuggestions(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const result = await createTransaction({
      household_id: householdId,
      date: form.date,
      type: form.type,
      amount: Number(form.amount),
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      subcategory_name: form.subcategory_id ? null : form.subcategory_name || null,
      responsible_id: form.responsible_id,
      note: form.note || null,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Transaction ajoutee')
      setDialogOpen(false)
      resetForm()
      fetchTransactions()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteTransaction(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Transaction supprimee')
      setRows((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const dayLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (dateStr === today) return "Aujourd'hui"
    if (dateStr === yesterday) return 'Hier'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  const filteredRows = search.trim()
    ? rows.filter((row) => {
        const q = search.trim().toLowerCase()
        return (
          row.categories?.name.toLowerCase().includes(q) ||
          row.profiles?.display_name?.toLowerCase().includes(q) ||
          row.note?.toLowerCase().includes(q)
        )
      })
    : rows

  const groupedRows: { label: string; items: Row[] }[] = []
  for (const row of filteredRows) {
    const label = dayLabel(row.date)
    const group = groupedRows.find((g) => g.label === label)
    if (group) group.items.push(row)
    else groupedRows.push({ label, items: [row] })
  }

  return (
    <AppShell householdName={householdName} userName={userName} currency={currency}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-[36px]">Transactions</h1>
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setDialogOpen(true)} className="w-fit gap-1.5">
            <Plus className="h-4 w-4" />
            Nouvelle transaction
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une transaction..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {search.trim() ? 'Aucune transaction ne correspond.' : 'Aucune transaction ce mois-ci.'}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groupedRows.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <div className="text-sm font-medium text-muted-foreground">{group.label}</div>
                {group.items.map((row) => {
                  const isExpense = row.type === 'expense'
                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-2 rounded-[14px] border p-3 transition-colors duration-[250ms] ease-out hover:bg-secondary"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: row.categories?.color ?? '#64748b' }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {row.categories?.name ?? 'Categorie'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.profiles?.display_name ?? ''}
                            {row.note ? ` • ${row.note}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={`text-sm font-semibold ${
                            isExpense ? 'text-destructive' : 'text-success'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {format(row.amount)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(row.id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {(() => {
        const handleOpenChange = (open: boolean) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }

        const formBody = (
          <div className="flex flex-col gap-4 px-4 md:px-0">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.type === 'expense' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setForm((f) => ({ ...f, type: 'expense', category_id: '', subcategory_id: '', subcategory_name: '' }))
                  setCategoryTouched(false)
                }}
              >
                Depense
              </Button>
              <Button
                type="button"
                variant={form.type === 'income' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setForm((f) => ({ ...f, type: 'income', category_id: '', subcategory_id: '', subcategory_name: '' }))
                  setCategoryTouched(false)
                }}
              >
                Revenu
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Montant</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                autoFocus={isMobile}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="h-14 text-3xl font-semibold"
              />
            </div>

            <div className="relative flex flex-col gap-2">
              <Label>Sous-categorie (optionnel)</Label>
              <Input
                value={form.subcategory_name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, subcategory_name: e.target.value, subcategory_id: '' }))
                  setShowSubSuggestions(true)
                }}
                onFocus={() => setShowSubSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSubSuggestions(false), 100)}
                placeholder="Tapez pour rechercher ou creer..."
                autoComplete="off"
              />
              {showSubSuggestions && subMatches.length > 0 && (
                <div className="absolute top-full z-10 mt-1 w-full rounded-[14px] border bg-popover shadow-md">
                  {subMatches.slice(0, 8).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => handleSelectSubSuggestion(sub)}
                    >
                      <span>{sub.name}</span>
                      <span className="text-xs text-muted-foreground">{sub.categoryName}</span>
                    </button>
                  ))}
                </div>
              )}
              {subQuery && subMatches.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Nouvelle sous-categorie — categorie reglee automatiquement sur "{selectedCategory?.name ?? '...'}" (modifiable ci-dessous)
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Categorie</Label>
              {isMobile ? (
                <div className="grid grid-cols-2 gap-2">
                  {categoriesForType.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon)
                    const active = form.category_id === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, category_id: cat.id, subcategory_id: '' }))
                          setCategoryTouched(true)
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-[14px] border p-3 text-left text-sm font-medium transition-colors duration-[250ms] ease-out',
                          active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-secondary'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <Select
                  value={form.category_id}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, category_id: v, subcategory_id: '' }))
                    setCategoryTouched(true)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesForType.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Responsable</Label>
              {isMobile ? (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const active = form.responsible_id === m.user_id
                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, responsible_id: m.user_id }))}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-[250ms] ease-out',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-secondary'
                        )}
                      >
                        {m.profiles?.display_name || 'Membre'}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <Select
                  value={form.responsible_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, responsible_id: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Qui a fait cette transaction ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profiles?.display_name || 'Membre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Note (optionnel)</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Ajouter une note..."
              />
            </div>
          </div>
        )

        const submitButton = (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.amount || !form.category_id || !form.responsible_id}
            className={isMobile ? 'h-14 w-full' : undefined}
          >
            {isSubmitting ? 'Ajout...' : 'Ajouter'}
          </Button>
        )

        if (isMobile) {
          return (
            <Drawer open={dialogOpen} onOpenChange={handleOpenChange}>
              <DrawerContent className="max-h-[92vh]">
                <DrawerHeader>
                  <DrawerTitle>Nouvelle transaction</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto pb-4">{formBody}</div>
                <DrawerFooter>{submitButton}</DrawerFooter>
              </DrawerContent>
            </Drawer>
          )
        }

        return (
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle transaction</DialogTitle>
              </DialogHeader>
              {formBody}
              <DialogFooter>{submitButton}</DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}
    </AppShell>
  )
}
