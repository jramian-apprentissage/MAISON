'use server'

import { createClient } from '@/lib/supabase/server'

export async function createHousehold(formData: FormData): Promise<{ error?: string; householdId?: string }> {
  try {
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return { error: 'Nom du foyer requis' }

    const supabase = await createClient()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    // RPC Supabase
    const { data, error } = await supabase.rpc('create_household', { p_name: name })
    if (error) return { error: error.message }

    return { householdId: data as string }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function joinHouseholdByCode(code: string): Promise<{ error?: string; householdId?: string; householdName?: string }> {
  try {
    const cleaned = String(code ?? '').trim()
    if (!cleaned) return { error: 'Code requis' }

    const supabase = await createClient()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) return { error: userErr.message }
    if (!user) return { error: 'Non authentifie' }

    // RPC Supabase
    const { data: householdId, error } = await supabase.rpc('accept_invitation', { p_code: cleaned })
    if (error) return { error: error.message }

    // Optionnel: récupérer le nom du foyer pour ton toast
    const { data: hh, error: hhErr } = await supabase
      .from('households')
      .select('name')
      .eq('id', householdId as string)
      .single()

    if (hhErr) {
      // même si le nom échoue, on considère l'adhésion OK
      return { householdId: householdId as string }
    }

    return { householdId: householdId as string, householdName: hh.name as string }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
