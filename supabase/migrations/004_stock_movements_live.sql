alter table public.stock_movements add column if not exists kind text not null default 'PEMAKAIAN';
alter table public.stock_movements add column if not exists party text;
alter table public.stock_movements add column if not exists movement_date date not null default current_date;
alter table public.stock_movements add column if not exists before_stock integer;
alter table public.stock_movements add column if not exists after_stock integer;
update public.stock_movements set movement_date=created_at::date;

create or replace function public.record_stock_movement(
  p_product uuid, p_type public.stock_type, p_quantity integer,
  p_reference text default null, p_notes text default null,
  p_kind text default null, p_party text default null, p_date date default current_date
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_before integer; v_after integer; v_role public.user_role;
begin
  select role into v_role from public.profiles where id=auth.uid() and is_active;
  if v_role is null or p_quantity is null or p_quantity <= 0 then raise exception 'Akses atau jumlah tidak valid'; end if;
  select stock into v_before from public.products where id=p_product and is_active for update;
  if not found then raise exception 'Produk tidak ditemukan.'; end if;
  if p_type='OUT' and v_before<p_quantity then raise exception 'Stok tidak mencukupi.'; end if;
  v_after := v_before + case when p_type='IN' then p_quantity else -p_quantity end;
  update public.products set stock=v_after, updated_at=now() where id=p_product;
  insert into public.stock_movements(product_id,type,quantity,reference,notes,user_id,kind,party,movement_date,before_stock,after_stock)
  values(p_product,p_type,p_quantity,nullif(p_reference,''),nullif(p_notes,''),auth.uid(),coalesce(p_kind,case when p_type='IN' then 'PEMASOKAN' else 'PEMAKAIAN' end),nullif(p_party,''),coalesce(p_date,current_date),v_before,v_after);
  return jsonb_build_object('before',v_before,'after',v_after);
end $$;
revoke all on function public.record_stock_movement(uuid,public.stock_type,integer,text,text,text,text,date) from public;
grant execute on function public.record_stock_movement(uuid,public.stock_type,integer,text,text,text,text,date) to authenticated;

create or replace function public.set_stock_counts(p_lines jsonb,p_date date default current_date,p_notes text default null)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_line record; v_stock integer; v_changed integer := 0;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin') then raise exception 'Hanya admin yang dapat menyimpan stok opname.'; end if;
  for v_line in select * from jsonb_to_recordset(p_lines) as x(product_id uuid,counted integer) loop
    if v_line.counted is null or v_line.counted < 0 then raise exception 'Jumlah stok opname tidak valid.'; end if;
    select stock into v_stock from public.products where id=v_line.product_id and is_active for update;
    if not found then raise exception 'Produk opname tidak ditemukan.'; end if;
    if v_stock <> v_line.counted then
      perform public.record_stock_movement(v_line.product_id,case when v_line.counted>v_stock then 'IN'::public.stock_type else 'OUT'::public.stock_type end,abs(v_line.counted-v_stock),'OPNAME',p_notes,'OPNAME','Stok Opname',p_date);
      v_changed := v_changed+1;
    end if;
  end loop;
  return v_changed;
end $$;
revoke all on function public.set_stock_counts(jsonb,date,text) from public;
grant execute on function public.set_stock_counts(jsonb,date,text) to authenticated;

create or replace function public.import_stock_products(p_rows jsonb,p_date date default current_date,p_reference text default null,p_party text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_line record; v_category uuid; v_product uuid; v_stock integer; v_created integer:=0; v_updated integer:=0;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin') then raise exception 'Hanya admin yang dapat mengimpor katalog.'; end if;
  for v_line in select * from jsonb_to_recordset(p_rows) as x(code text,name text,category text,unit text,stock integer,minimum_stock integer,purchase_price numeric,selling_price numeric) loop
    insert into public.categories(name) values(coalesce(nullif(trim(v_line.category),''),'Lainnya')) on conflict(name) do update set name=excluded.name returning id into v_category;
    select id,stock into v_product,v_stock from public.products where code=upper(trim(v_line.code)) for update;
    if v_product is null then
      insert into public.products(code,name,category_id,unit,stock,minimum_stock,purchase_price,selling_price)
      values(upper(trim(v_line.code)),trim(v_line.name),v_category,trim(v_line.unit),0,v_line.minimum_stock,v_line.purchase_price,v_line.selling_price) returning id into v_product;
      v_created:=v_created+1; v_stock:=0;
    else
      update public.products set name=trim(v_line.name),category_id=v_category,unit=trim(v_line.unit),minimum_stock=v_line.minimum_stock,purchase_price=v_line.purchase_price,selling_price=v_line.selling_price,updated_at=now() where id=v_product;
      v_updated:=v_updated+1;
    end if;
    if v_line.stock is distinct from v_stock then
      perform public.record_stock_movement(v_product,case when v_line.stock>v_stock then 'IN'::public.stock_type else 'OUT'::public.stock_type end,abs(v_line.stock-v_stock),coalesce(p_reference,'STOKAWAL'),'Diimpor lewat impor massal.',case when v_stock=0 then 'STOKAWAL' else 'KOREKSI' end,coalesce(p_party,'Stok Awal'),p_date);
    end if;
  end loop;
  return jsonb_build_object('created',v_created,'updated',v_updated);
end $$;
revoke all on function public.import_stock_products(jsonb,date,text,text) from public;
grant execute on function public.import_stock_products(jsonb,date,text,text) to authenticated;
