-- goforit: full category catalog + mandatory "responsible" on transactions
-- Run this in the Supabase SQL editor AFTER 0001_init.sql.
--
-- WARNING: this migration wipes existing transactions/budgets/categories for
-- ALL households and reseeds the new 28-category catalog. Only run this if
-- your current data is test/dev data you're fine losing.

-- ============ PROFILES (display name per user, for "responsible" picker) ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.household_id = m2.household_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill profiles for users who already signed up before this migration
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', email) from auth.users
on conflict (id) do nothing;

-- ============ DEFAULT CATEGORY CATALOG ============

create or replace function public.seed_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_categories jsonb := '[
    {"name":"Logement","type":"expense","color":"#3b82f6","icon":"home","subs":["Loyer","Credit immobilier","Charges","Eau (JIRAMA)","Electricite (JIRAMA)","Groupe electrogene","Gaz","Bois/Charbon","Entretien","Reparations","Jardin"]},
    {"name":"Alimentation","type":"expense","color":"#f97316","icon":"shopping-cart","subs":["Supermarche","Marche","Epicerie","Fruits & legumes","Viande & poisson","Boulangerie","Eau potable","Livraison"]},
    {"name":"Restaurants & Sorties","type":"expense","color":"#fb7185","icon":"utensils","subs":["Restaurant","Fast-food","Cafe","Bar","Livraison"]},
    {"name":"Transport","type":"expense","color":"#a855f7","icon":"car","subs":["Carburant","Entretien voiture","Reparations","Assurance auto","Taxi","Taxi-be","Bus","Parking","Peage","Location"]},
    {"name":"Telecommunications","type":"expense","color":"#06b6d4","icon":"smartphone","subs":["Airtel","Orange","Telma","Internet fibre","Credit telephonique","Forfaits mobiles"]},
    {"name":"Energie","type":"expense","color":"#eab308","icon":"zap","subs":["JIRAMA","Generateur","Carburant generateur","Panneaux solaires","Batteries"]},
    {"name":"Sante","type":"expense","color":"#ef4444","icon":"heart-pulse","subs":["Consultation","Pharmacie","Analyses","Dentiste","Opticien","Hospitalisation","Mutuelle"]},
    {"name":"Vetements & Beaute","type":"expense","color":"#ec4899","icon":"shirt","subs":["Vetements","Chaussures","Coiffeur","Esthetique","Cosmetiques"]},
    {"name":"Maison","type":"expense","color":"#84cc16","icon":"sofa","subs":["Mobilier","Decoration","Electromenager","Bricolage","Vaisselle"]},
    {"name":"Enfants","type":"expense","color":"#f59e0b","icon":"baby","subs":["Ecole","Cantine","Fournitures","Activites","Vetements","Sante","Garde"]},
    {"name":"Education & Formation","type":"expense","color":"#0ea5e9","icon":"graduation-cap","subs":["Universite","Formation","Livres","Cours particuliers","Certifications"]},
    {"name":"Animaux","type":"expense","color":"#78716c","icon":"dog","subs":["Nourriture","Veterinaire","Accessoires"]},
    {"name":"Loisirs","type":"expense","color":"#d946ef","icon":"gamepad-2","subs":["Cinema","Sport","Jeux","Livres","Musique","Sorties"]},
    {"name":"Voyages","type":"expense","color":"#14b8a6","icon":"plane","subs":["Billets","Hotel","Airbnb","Location voiture","Excursions"]},
    {"name":"Famille & Solidarite","type":"expense","color":"#f43f5e","icon":"users","subs":["Aide aux parents","Soutien familial","Cadeaux","Ceremonies","Famadihana","Mariages","Obseques"]},
    {"name":"Religion & Dons","type":"expense","color":"#8b5cf6","icon":"church","subs":["Eglise","Associations","Dons","Offrandes"]},
    {"name":"Revenus","type":"income","color":"#22c55e","icon":"wallet","subs":["Salaire 1","Salaire 2","Activite independante","Dividendes","Loyers","Autres revenus"]},
    {"name":"Banque & Frais","type":"expense","color":"#64748b","icon":"landmark","subs":["Frais bancaires","Interets","Retraits","Virements","Change"]},
    {"name":"Mobile Money","type":"expense","color":"#0d9488","icon":"smartphone","subs":["MVola","Orange Money","Airtel Money","Depots","Retraits"]},
    {"name":"Epargne & Investissements","type":"expense","color":"#16a34a","icon":"trending-up","subs":["Compte epargne","Assurance-vie","Immobilier","Bourse","Cryptomonnaies"]},
    {"name":"Assurances","type":"expense","color":"#2563eb","icon":"shield","subs":["Sante","Auto","Habitation","Vie"]},
    {"name":"Impots & Taxes","type":"expense","color":"#475569","icon":"building-2","subs":["Impots","Taxes locales","Droits administratifs"]},
    {"name":"Professionnel","type":"expense","color":"#7c3aed","icon":"briefcase","subs":["Deplacements","Materiel","Logiciels","Fournitures"]},
    {"name":"Remboursements","type":"expense","color":"#b91c1c","icon":"credit-card","subs":["Credit immobilier","Credit consommation","Emprunts familiaux"]},
    {"name":"Cadeaux","type":"expense","color":"#db2777","icon":"gift","subs":["Anniversaires","Noel","Mariages","Naissances"]},
    {"name":"Transferts internes","type":"expense","color":"#9ca3af","icon":"repeat","subs":["Virement entre comptes","Especes vers Banque","Banque vers Mobile Money"]},
    {"name":"Especes","type":"expense","color":"#a3a3a3","icon":"banknote","subs":["Retraits","Depots","Caisse"]},
    {"name":"Divers","type":"expense","color":"#6b7280","icon":"circle-help","subs":["Depenses exceptionnelles","Non classe"]}
  ]';
  v_cat jsonb;
  v_cat_id uuid;
  v_sub text;
begin
  for v_cat in select * from jsonb_array_elements(v_categories)
  loop
    insert into public.categories (household_id, name, type, color, icon)
    values (p_household_id, v_cat->>'name', v_cat->>'type', v_cat->>'color', v_cat->>'icon')
    returning id into v_cat_id;

    for v_sub in select * from jsonb_array_elements_text(v_cat->'subs')
    loop
      insert into public.subcategories (category_id, name) values (v_cat_id, v_sub);
    end loop;
  end loop;
end;
$$;

-- create_household now seeds the full catalog above instead of a short list
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

  perform public.seed_default_categories(v_household_id);

  return v_household_id;
end;
$$;

-- ============ RESEED EXISTING HOUSEHOLDS (dev data) ============
-- Wipes transactions/budgets/categories for every existing household and
-- reseeds with the new catalog. Comment this block out if you want to keep
-- existing data instead.
do $$
declare
  v_household record;
begin
  for v_household in select id from public.households loop
    delete from public.budget_lines where month_budget_id in (
      select id from public.month_budgets where household_id = v_household.id
    );
    delete from public.month_budgets where household_id = v_household.id;
    delete from public.transactions where household_id = v_household.id;
    delete from public.subcategories where category_id in (
      select id from public.categories where household_id = v_household.id
    );
    delete from public.categories where household_id = v_household.id;

    perform public.seed_default_categories(v_household.id);
  end loop;
end;
$$;

-- ============ MANDATORY "RESPONSIBLE" ON TRANSACTIONS ============
-- (no existing transactions left after the reseed above, so no backfill needed)

alter table public.transactions
  add column responsible_id uuid references public.profiles(id);

alter table public.transactions
  alter column responsible_id set not null;

create index on public.transactions (responsible_id);
