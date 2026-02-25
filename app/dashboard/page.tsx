import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get household
  const { data: membership } = await supabase
    .from('memberships')
    .select('household_id, role, households(id, name, currency)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id
  const household = membership.households as { id: string; name: string; currency: string }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*, subcategories(*)')
    .eq('household_id', householdId)
    .order('name')

  return (
    <DashboardClient
      householdId={householdId}
      householdName={household.name}
      categories={categories || []}
      userRole={membership.role}
    />
  )
}
