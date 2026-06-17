import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MembersClient } from './members-client'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('household_id, role, households(id, name, currency)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const household = membership.households as unknown as { id: string; name: string; currency: string }
  const isAdmin = membership.role === 'admin'

  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id, role')
    .eq('household_id', householdId)

  const memberIds = (memberships || []).map((m) => m.user_id)

  const { data: profiles } = memberIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', memberIds)
    : { data: [] }

  const profileById = new Map((profiles || []).map((p) => [p.id, p]))
  const members = (memberships || []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    display_name: profileById.get(m.user_id)?.display_name ?? null,
  }))

  let invitations: { id: string; code: string; expires_at: string }[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('invitations')
      .select('id, code, expires_at')
      .eq('household_id', householdId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    invitations = data || []
  }

  return (
    <MembersClient
      householdId={householdId}
      householdName={household.name}
      userName={profileById.get(user.id)?.display_name || 'Utilisateur'}
      currency={household.currency}
      isAdmin={isAdmin}
      members={members}
      initialInvitations={invitations}
    />
  )
}
