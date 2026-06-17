export type Category = {
  id: string
  household_id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  is_archived: boolean
  created_at: string

  // quand tu fais .select('*, subcategories(*)')
  subcategories?: SubCategory[]
}

export type SubCategory = {
  id: string
  category_id: string
  name: string
  is_archived: boolean
  created_at: string
}

export type Transaction = {
  id: string
  household_id: string
  user_id: string
  date: string // YYYY-MM-DD
  type: 'income' | 'expense'
  amount: number
  category_id: string
  subcategory_id: string | null
  responsible_id: string
  note: string | null
  created_at: string
}

export type Profile = {
  id: string
  display_name: string | null
}

export type HouseholdMember = {
  user_id: string
  profiles: Profile | null
}
