'use server'

import { createClient } from '@/lib/supabase/server'

type TransactionInput = {
  household_id: string
  date: string // YYYY-MM-DD
  type: 'income' | 'expense'
  amount: number
  category_id: string
  subcategory_id?: string | null
  subcategory_name?: string | null
  responsible_id: string
  note?: string | null
}

export async function createTransaction(
  input: TransactionInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: 'Montant invalide' }
    }
    if (!input.category_id) return { error: 'Categorie requise' }
    if (!input.date) return { error: 'Date requise' }
    if (!input.responsible_id) return { error: 'Responsable requis' }

    let subcategoryId = input.subcategory_id || null
    const subcategoryName = input.subcategory_name?.trim()

    if (!subcategoryId && subcategoryName) {
      const { data: existing } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', input.category_id)
        .ilike('name', subcategoryName)
        .maybeSingle()

      if (existing) {
        subcategoryId = existing.id
      } else {
        const { data: created, error: createErr } = await supabase
          .from('subcategories')
          .insert({ category_id: input.category_id, name: subcategoryName })
          .select('id')
          .single()

        if (createErr) return { error: createErr.message }
        subcategoryId = created.id
      }
    }

    const { error } = await supabase.from('transactions').insert({
      household_id: input.household_id,
      user_id: user.id,
      date: input.date,
      type: input.type,
      amount,
      category_id: input.category_id,
      subcategory_id: subcategoryId,
      responsible_id: input.responsible_id,
      note: input.note || null,
    })

    if (error) return { error: error.message }
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return { error: error.message }
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
