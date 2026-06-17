-- goforit: allow any household member to create a new subcategory on the fly
-- (previously only admins could insert subcategories). Needed for the
-- transaction form's subcategory autocomplete, which creates a subcategory
-- when the typed name doesn't match an existing one.

create policy "subcategories_insert_members" on public.subcategories
  for insert with check (
    exists (
      select 1 from public.categories c
      where c.id = subcategories.category_id
        and public.is_household_member(c.household_id)
    )
  );
