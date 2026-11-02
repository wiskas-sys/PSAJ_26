-- Live CRUD setup for DIAN MOTOR. Apply after 001_initial_schema.sql and 002_stock_products.sql.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.profiles(id, full_name, role, is_active)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'kasir', true)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Allow staff to maintain the customer directory; only admins manage catalog and suppliers.
drop policy if exists admin_categories on public.categories;
create policy admin_categories on public.categories for all to authenticated
using (public.current_role()='admin') with check (public.current_role()='admin');

drop policy if exists admin_suppliers on public.suppliers;
create policy admin_suppliers on public.suppliers for all to authenticated
using (public.current_role()='admin') with check (public.current_role()='admin');

drop policy if exists staff_customers on public.customers;
create policy staff_customers on public.customers for all to authenticated
using (public.current_role() in ('admin','kasir')) with check (public.current_role() in ('admin','kasir'));

drop policy if exists staff_services on public.services;
create policy staff_services on public.services for all to authenticated
using (public.current_role() in ('admin','mekanik')) with check (public.current_role() in ('admin','mekanik'));

-- New Auth users receive profiles via the trigger; the first administrator is promoted in SQL Editor.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.suppliers, public.customers, public.services to authenticated;
