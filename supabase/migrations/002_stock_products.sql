-- Product catalog support for the stock CRUD screen.
alter table public.products add column if not exists is_active boolean not null default true;

create index if not exists products_active_name_idx on public.products (name) where is_active;

create or replace function public.set_product_active(p_product uuid, p_active boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists (select 1 from public.profiles where id=auth.uid() and is_active and role='admin') then
    raise exception 'Hanya admin yang dapat mengubah katalog.';
  end if;
  update public.products set is_active=p_active, updated_at=now() where id=p_product;
  if not found then raise exception 'Produk tidak ditemukan.'; end if;
end $$;
revoke all on function public.set_product_active(uuid,boolean) from public;
grant execute on function public.set_product_active(uuid,boolean) to authenticated;
