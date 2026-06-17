'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertCallerIsAdmin(householdId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifie')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') throw new Error('Acces refuse')
  return user.id
}

export async function updateMemberDisplayName(
  householdId: string,
  targetUserId: string,
  displayName: string
): Promise<{ error?: string }> {
  try {
    const callerId = await assertCallerIsAdmin(householdId)
    const supabase = await createClient()

    // Admin can edit any member; member can only edit themselves
    const isOwnProfile = callerId === targetUserId

    // Verify target is in the same household
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('user_id', targetUserId)
      .single()

    if (!targetMembership && !isOwnProfile) return { error: 'Membre introuvable' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', targetUserId)

    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function adminResetMemberPassword(
  householdId: string,
  targetUserId: string,
  newPassword: string
): Promise<{ error?: string }> {
  try {
    await assertCallerIsAdmin(householdId)

    if (newPassword.length < 6) return { error: 'Le mot de passe doit faire au moins 6 caracteres' }

    // Verify target is in the same household
    const supabase = await createClient()
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('user_id', targetUserId)
      .single()

    if (!targetMembership) return { error: 'Membre introuvable' }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword })

    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
