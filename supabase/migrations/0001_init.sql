-- goforit initial schema
-- Run this in the Supabase SQL editor (Database > SQL Editor) on a fresh project.

-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ TABLES ============

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'MGA',
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#64748b',
  type text not null check (type in ('income', 'expense')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  date date not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid not null references public.categories(id),
  subcategory_id uuid references public.subcategories(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.month_budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  created_by uuid not null references auth.users(id),
  planned_income numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, year, month)
);

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  month_budget_id uuid not null references public.month_budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  planned_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (month_budget_id, category_id)
);

-- ============ INDEXES ============
create index on public.memberships (user_id);
create index on public.categories (household_id);
create index on public.subcategories (category_id);
create index on public.transactions (household_id, date);
create index on public.transactions (category_id);
create index on public.month_budgets (household_id);
create index on public.budget_lines (month_budget_id);

-- ============ HELPER FUNCTION ============
-- Returns true if the calling user belongs to the given household.
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = p_household_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = p_household_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

-- ============ RLS ============
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.transactions enable row level security;
alter table public.month_budgets enable row level security;
alter table public.budget_lines enable row level security;

-- households: members can read; only update via app logic (admins)
create policy "households_select" on public.households
  for select using (public.is_household_member(id));

create policy "households_update_admin" on public.households
  for update using (public.is_household_admin(id));

-- memberships: members of the same household can see each other
create policy "memberships_select" on public.memberships
  for select using (public.is_household_member(household_id));

-- invitations: only admins of the household can see/manage codes
create policy "invitations_select_admin" on public.invitations
  for select using (public.is_household_admin(household_id));

-- categories
create policy "categories_select" on public.categories
  for select using (public.is_household_member(household_id));
create policy "categories_insert_admin" on public.categories
  for insert with check (public.is_household_admin(household_id));
create policy "categories_update_admin" on public.categories
  for update using (public.is_household_admin(household_id));
create policy "categories_delete_admin" on public.categories
  for delete using (public.is_household_admin(household_id));

-- subcategories (scoped through parent category's household)
create policy "subcategories_select" on public.subcategories
  for select using (
    exists (
      select 1 from public.categories c
      where c.id = subcategories.category_id
        and public.is_household_member(c.household_id)
    )
  );
create policy "subcategories_write_admin" on public.subcategories
  for all using (
    exists (
      select 1 from public.categories c
      where c.id = subcategories.category_id
        and public.is_household_admin(c.household_id)
    )
  );

-- transactions: any member can read/write within their household
create policy "transactions_select" on public.transactions
  for select using (public.is_household_member(household_id));
create policy "transactions_insert" on public.transactions
  for insert with check (
    public.is_household_member(household_id) and user_id = auth.uid()
  );
create policy "transactions_update_own" on public.transactions
  for update using (
    public.is_household_member(household_id) and user_id = auth.uid()
  );
create policy "transactions_delete_own" on public.transactions
  for delete using (
    public.is_household_member(household_id) and user_id = auth.uid()
  );

-- month_budgets: members read, admins write
create policy "month_budgets_select" on public.month_budgets
  for select using (public.is_household_member(household_id));
create policy "month_budgets_write_admin" on public.month_budgets
  for all using (public.is_household_admin(household_id))
  with check (public.is_household_admin(household_id));

-- budget_lines: scoped through parent month_budget's household
create policy "budget_lines_select" on public.budget_lines
  for select using (
    exists (
      select 1 from public.month_budgets b
      where b.id = budget_lines.month_budget_id
        and public.is_household_member(b.household_id)
    )
  );
create policy "budget_lines_write_admin" on public.budget_lines
  for all using (
    exists (
      select 1 from public.month_budgets b
      where b.id = budget_lines.month_budget_id
        and public.is_household_admin(b.household_id)
    )
  );

-- ============ RPC FUNCTIONS ============

-- Creates a household, makes the caller its admin, and seeds default categories.
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.households (name) values (trim(p_name))
  returning id into v_household_id;

  insert into public.memberships (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'admin');

  insert into public.categories (household_id, name, type, color, icon) values
    (v_household_id, 'Salaire', 'income', '#22c55e', 'wallet'),
    (v_household_id, 'Alimentation', 'expense', '#f97316', 'shopping-cart'),
    (v_household_id, 'Logement', 'expense', '#3b82f6', 'home'),
    (v_household_id, 'Transport', 'expense', '#a855f7', 'car'),
    (v_household_id, 'Loisirs', 'expense', '#ec4899', 'gamepad-2'),
    (v_household_id, 'Sante', 'expense', '#ef4444', 'heart-pulse'),
    (v_household_id, 'Autres', 'expense', '#64748b', 'circle');

  return v_household_id;
end;
$$;

grant execute on function public.create_household(text) to authenticated;

-- Validates an invitation code, joins the caller to that household, and consumes the code.
create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations;
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
    and used_at is null
    and expires_at > now()
  limit 1;

  if v_invitation.id is null then
    raise exception 'invalid or expired invitation code';
  end if;

  v_household_id := v_invitation.household_id;

  insert into public.memberships (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update public.invitations
  set used_at = now()
  where id = v_invitation.id;

  return v_household_id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;

-- Generates a fresh invitation code for a household (call from app once an admin wants to invite).
create or replace function public.create_invitation(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_household_admin(p_household_id) then
    raise exception 'not authorized';
  end if;

  v_code := upper(substring(md5(random()::text) from 1 for 8));

  insert into public.invitations (household_id, code, created_by)
  values (p_household_id, v_code, auth.uid());

  return v_code;
end;
$$;

grant execute on function public.create_invitation(uuid) to authenticated;
