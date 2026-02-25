import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BudgetClient } from './budget-client'

export default async function BudgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const household = membership.households as { id: string; name: string }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('is_archived', false)
    .order('name')

  return (
    <BudgetClient
      householdId={householdId}
      householdName={household.name}
      categories={categories || []}
    />
  )
}
