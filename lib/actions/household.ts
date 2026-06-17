'use server'

import { createClient } from '@/lib/supabase/server'

export async function createHousehold(
  formData: FormData
): Promise<{ error?: string; householdId?: string }> {
  try {
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return { error: 'Nom du foyer requis' }

    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    const { data, error } = await supabase.rpc('create_household', { p_name: name })
    if (error) return { error: error.message }

    return { householdId: data as string }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function createInvitation(
  householdId: string
): Promise<{ error?: string; code?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    const { data, error } = await supabase.rpc('create_invitation', {
      p_household_id: householdId,
    })
    if (error) return { error: error.message }

    return { code: data as string }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function joinHouseholdByCode(
  code: string
): Promise<{ error?: string; householdId?: string; householdName?: string }> {
  try {
    const cleaned = String(code ?? '').trim()
    if (!cleaned) return { error: 'Code requis' }

    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    const { data: householdId, error } = await supabase.rpc('accept_invitation', {
      p_code: cleaned,
    })
    if (error) return { error: error.message }

    const { data: hh } = await supabase
      .from('households')
      .select('name')
      .eq('id', householdId as string)
      .single()

    return {
      householdId: householdId as string,
      householdName: (hh?.name as string) || undefined,
    }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
