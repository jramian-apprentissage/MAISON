-- goforit: allow household admins to edit other members' display name
-- (password changes for other members go through the service-role admin API
-- server-side, not through RLS — see lib/supabase/admin.ts)

create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.household_id = m2.household_id
      where m1.user_id = auth.uid()
        and m1.role = 'admin'
        and m2.user_id = profiles.id
    )
  );
