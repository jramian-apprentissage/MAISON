'use server'

import { createClient } from '@/lib/supabase/server'

type BudgetLineInput = {
  category_id: string
  planned_amount: number
}

function clampInt(n: unknown, min = 0) {
  const x = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.trunc(x))
}

export async function createOrUpdateBudget(
  householdId: string,
  year: number,
  month: number,
  lines: BudgetLineInput[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    // Vérifie que l'utilisateur est admin du foyer (RLS doit aussi protéger)
    const { data: membership, error: memErr } = await supabase
      .from('memberships')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .single()

    if (memErr) return { error: memErr.message }
    if (!membership || membership.role !== 'admin') {
      return { error: "Droits insuffisants (admin requis)" }
    }

    // 1) Upsert month_budget (planned_income laissé à 0 ici)
    const { data: mb, error: mbErr } = await supabase
      .from('month_budgets')
      .upsert(
        {
          household_id: householdId,
          year: clampInt(year, 2000),
          month: clampInt(month, 1),
          created_by: user.id,
          planned_income: 0,
        },
        { onConflict: 'household_id,year,month' }
      )
      .select('id')
      .single()

    if (mbErr) return { error: mbErr.message }
    if (!mb?.id) return { error: "Impossible de creer le budget du mois" }

    // 2) Upsert budget lines
    const payload = (lines || []).map((l) => ({
      month_budget_id: mb.id,
      category_id: l.category_id,
      planned_amount: clampInt(l.planned_amount, 0),
    }))

    if (payload.length > 0) {
      const { error: linesErr } = await supabase
        .from('budget_lines')
        .upsert(payload, { onConflict: 'month_budget_id,category_id' })

      if (linesErr) return { error: linesErr.message }
    }

    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function copyPreviousMonthBudget(
  householdId: string,
  year: number,
  month: number
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    // Admin check
    const { data: membership, error: memErr } = await supabase
      .from('memberships')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .single()

    if (memErr) return { error: memErr.message }
    if (!membership || membership.role !== 'admin') {
      return { error: "Droits insuffisants (admin requis)" }
    }

    // Determine previous month
    let prevYear = year
    let prevMonth = month - 1
    if (prevMonth < 1) {
      prevMonth = 12
      prevYear = year - 1
    }

    // Load previous month_budget
    const { data: prevMb, error: prevMbErr } = await supabase
      .from('month_budgets')
      .select('id, planned_income')
      .eq('household_id', householdId)
      .eq('year', prevYear)
      .eq('month', prevMonth)
      .single()

    if (prevMbErr) {
      return { error: "Aucun budget trouve pour le mois precedent" }
    }

    // Load previous lines
    const { data: prevLines, error: prevLinesErr } = await supabase
      .from('budget_lines')
      .select('category_id, planned_amount')
      .eq('month_budget_id', prevMb.id)

    if (prevLinesErr) return { error: prevLinesErr.message }

    // Ensure current month_budget exists
    const { data: mb, error: mbErr } = await supabase
      .from('month_budgets')
      .upsert(
        {
          household_id: householdId,
          year: clampInt(year, 2000),
          month: clampInt(month, 1),
          created_by: user.id,
          planned_income: clampInt(prevMb.planned_income ?? 0, 0),
        },
        { onConflict: 'household_id,year,month' }
      )
      .select('id')
      .single()

    if (mbErr) return { error: mbErr.message }

    const payload = (prevLines || []).map((l) => ({
      month_budget_id: mb.id,
      category_id: l.category_id,
      planned_amount: clampInt(l.planned_amount, 0),
    }))

    if (payload.length > 0) {
      const { error: upErr } = await supabase
        .from('budget_lines')
        .upsert(payload, { onConflict: 'month_budget_id,category_id' })

      if (upErr) return { error: upErr.message }
    }

    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
