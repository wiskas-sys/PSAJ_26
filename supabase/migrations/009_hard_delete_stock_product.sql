-- Permanently remove a product and its stock movement history.
-- Keep transaction and service details intact; products referenced there cannot be deleted.
create or replace function public.delete_stock_product(p_product uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_role public.user_role;
  v_deleted_movements integer;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid() and is_active;
  if v_role is distinct from 'admin' then
    raise exception 'Hanya admin yang dapat menghapus barang.';
  end if;

  perform 1 from public.products where id = p_product for update;
  if not found then raise exception 'Produk tidak ditemukan.'; end if;

  if exists (select 1 from public.transaction_items where product_id = p_product)
     or exists (select 1 from public.service_items where product_id = p_product) then
    raise exception 'Barang masih digunakan dalam detail transaksi atau servis, sehingga tidak dapat dihapus.';
  end if;

  delete from public.stock_movements where product_id = p_product;
  get diagnostics v_deleted_movements = row_count;

  delete from public.products where id = p_product;
  return jsonb_build_object('deleted', true, 'archived', false, 'deleted_movements', v_deleted_movements);
end $$;

revoke all on function public.delete_stock_product(uuid) from public;
grant execute on function public.delete_stock_product(uuid) to authenticated;
