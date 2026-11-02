create or replace function public.checkout_stock_sale(
  p_transaction_code text, p_idempotency_key uuid, p_items jsonb,
  p_discount numeric default 0, p_payment_method text default 'Tunai',
  p_payment_amount numeric default 0, p_customer_id uuid default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_role public.user_role; v_item record; v_product public.products%rowtype;
  v_subtotal numeric(14,2):=0; v_total numeric(14,2); v_change numeric(14,2);
  v_transaction_id uuid; v_code text; v_quantity integer;
begin
  select role into v_role from public.profiles where id=auth.uid() and is_active;
  if v_role is null or v_role not in ('admin','kasir') then raise exception 'Akun tidak memiliki akses kasir.'; end if;
  if p_idempotency_key is null or p_transaction_code is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Data transaksi tidak valid.'; end if;
  if p_payment_method not in ('Tunai','Transfer','QRIS') then raise exception 'Metode pembayaran tidak valid.'; end if;
  select id,transaction_code into v_transaction_id,v_code from public.transactions where idempotency_key=p_idempotency_key;
  if v_transaction_id is not null then return jsonb_build_object('id',v_transaction_id,'code',v_code,'duplicate',true); end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) order by product_id loop
    if v_item.quantity is null or v_item.quantity<=0 then raise exception 'Jumlah produk tidak valid.'; end if;
    select * into v_product from public.products where id=v_item.product_id and is_active for update;
    if not found then raise exception 'Produk tidak ditemukan atau sudah dinonaktifkan.'; end if;
    if v_product.stock<v_item.quantity then raise exception 'Stok tidak mencukupi untuk %.',v_product.name; end if;
    v_subtotal:=v_subtotal+(v_product.selling_price*v_item.quantity);
  end loop;
  if p_discount is null or p_discount<0 or p_discount>v_subtotal then raise exception 'Diskon tidak valid.'; end if;
  v_total:=v_subtotal-p_discount;
  if p_payment_amount is null or p_payment_amount<v_total then raise exception 'Jumlah pembayaran belum mencukupi.'; end if;
  v_change:=p_payment_amount-v_total;
  insert into public.transactions(transaction_code,customer_id,subtotal,discount,total,payment_method,payment_amount,change_amount,idempotency_key,created_by)
  values(p_transaction_code,p_customer_id,v_subtotal,p_discount,v_total,p_payment_method,p_payment_amount,case when p_payment_method='Tunai' then v_change else 0 end,p_idempotency_key,auth.uid()) returning id into v_transaction_id;
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) order by product_id loop
    select * into v_product from public.products where id=v_item.product_id;
    insert into public.transaction_items(transaction_id,product_id,quantity,price,subtotal)
    values(v_transaction_id,v_product.id,v_item.quantity,v_product.selling_price,v_product.selling_price*v_item.quantity);
    perform public.record_stock_movement(v_product.id,'OUT'::public.stock_type,v_item.quantity,p_transaction_code,'Penjualan kasir.','PEMAKAIAN','Penjualan',current_date);
  end loop;
  return jsonb_build_object('id',v_transaction_id,'code',p_transaction_code,'subtotal',v_subtotal,'total',v_total,'change',v_change,'duplicate',false);
end $$;
revoke all on function public.checkout_stock_sale(text,uuid,jsonb,numeric,text,numeric,uuid) from public;
grant execute on function public.checkout_stock_sale(text,uuid,jsonb,numeric,text,numeric,uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['products','stock_movements','transactions'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
