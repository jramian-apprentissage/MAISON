import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
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

  const { data: categories } = await supabase
    .from('categories')
    .select('*, subcategories(*)')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('name')

  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('household_id', householdId)

  const memberIds = (memberships || []).map((m) => m.user_id)

  const { data: profiles } = memberIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', memberIds)
    : { data: [] }

  const profileById = new Map((profiles || []).map((p) => [p.id, p]))
  const members = memberIds.map((id) => ({
    user_id: id,
    profiles: profileById.get(id) ?? null,
  }))

  return (
    <TransactionsClient
      householdId={householdId}
      householdName={household.name}
      userName={profileById.get(user.id)?.display_name || 'Utilisateur'}
      currency={household.currency}
      categories={categories || []}
      members={members}
    />
  )
}
