-- Permanently delete products with no audit/history references.
-- Keep products with stock movements or sale items as inactive so historical
-- reports and foreign keys remain valid.
create or replace function public.delete_stock_product(p_product uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_role public.user_role; v_has_history boolean;
begin
  select role into v_role from public.profiles
  where id=auth.uid() and is_active;
  if v_role is distinct from 'admin' then
    raise exception 'Hanya admin yang dapat menghapus barang.';
  end if;

  perform 1 from public.products where id=p_product for update;
  if not found then raise exception 'Produk tidak ditemukan.'; end if;

  select exists(select 1 from public.stock_movements where product_id=p_product)
      or exists(select 1 from public.transaction_items where product_id=p_product)
    into v_has_history;

  if v_has_history then
    update public.products set is_active=false, updated_at=now() where id=p_product;
    return jsonb_build_object('deleted',false,'archived',true);
  end if;

  delete from public.products where id=p_product;
  return jsonb_build_object('deleted',true,'archived',false);
end $$;

revoke all on function public.delete_stock_product(uuid) from public;
grant execute on function public.delete_stock_product(uuid) to authenticated;
