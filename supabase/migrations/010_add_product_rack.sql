-- Migration 010: Add rack / shelf location column to products table
alter table public.products add column if not exists rack text default '';
create index if not exists products_rack_idx on public.products (rack);

-- Update existing products with smart default rack assignments based on category if empty
update public.products p
set rack = case
  when c.name ilike '%oli%' or c.name ilike '%pelumas%' or c.name ilike '%cairan%' then 'Rak A-01 (Oli)'
  when c.name ilike '%rem%' or c.name ilike '%brake%' then 'Rak B-01 (Pengereman)'
  when c.name ilike '%busi%' or c.name ilike '%pengapian%' then 'Rak B-02 (Busi)'
  when c.name ilike '%listrik%' or c.name ilike '%lampu%' or c.name ilike '%aki%' then 'Rak C-01 (Kelistrikan)'
  when c.name ilike '%mesin%' or c.name ilike '%cvt%' or c.name ilike '%roller%' or c.name ilike '%v-belt%' then 'Rak D-01 (Mesin & CVT)'
  when c.name ilike '%rantai%' or c.name ilike '%gear%' or c.name ilike '%gir%' then 'Rak D-02 (Rantai & Gear)'
  when c.name ilike '%ban%' or c.name ilike '%roda%' or c.name ilike '%velg%' then 'Rak E-01 (Ban & Roda)'
  when c.name ilike '%suspensi%' or c.name ilike '%shock%' then 'Rak E-02 (Suspensi)'
  when c.name ilike '%filter%' then 'Rak A-02 (Filter)'
  when c.name ilike '%baut%' or c.name ilike '%fastener%' then 'Rak G-01 (Baut & Mur)'
  else 'Rak A-03 (Suku Cadang)'
end
from public.categories c
where p.category_id = c.id and (p.rack is null or trim(p.rack) = '');

-- Update import_stock_products to also accept rack column
create or replace function public.import_stock_products(
  p_rows jsonb,
  p_date date default current_date,
  p_reference text default null,
  p_party text default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_line record;
  v_category uuid;
  v_product uuid;
  v_stock integer;
  v_created integer:=0;
  v_updated integer:=0;
  v_rack text;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin') then
    raise exception 'Hanya admin yang dapat mengimpor katalog.';
  end if;

  for v_line in select * from jsonb_to_recordset(p_rows) as x(
    code text,
    name text,
    category text,
    unit text,
    stock integer,
    minimum_stock integer,
    purchase_price numeric,
    selling_price numeric,
    rack text
  ) loop
    v_rack := coalesce(nullif(trim(v_line.rack), ''), '');
    insert into public.categories(name) values(coalesce(nullif(trim(v_line.category),''),'Lainnya'))
    on conflict(name) do update set name=excluded.name returning id into v_category;

    select id,stock into v_product,v_stock from public.products where code=upper(trim(v_line.code)) for update;
    if v_product is null then
      insert into public.products(code,name,category_id,unit,stock,minimum_stock,purchase_price,selling_price,rack)
      values(upper(trim(v_line.code)),trim(v_line.name),v_category,trim(v_line.unit),0,v_line.minimum_stock,v_line.purchase_price,v_line.selling_price,v_rack)
      returning id into v_product;
      v_created:=v_created+1;
      v_stock:=0;
    else
      update public.products
      set name=trim(v_line.name),
          category_id=v_category,
          unit=trim(v_line.unit),
          minimum_stock=v_line.minimum_stock,
          purchase_price=v_line.purchase_price,
          selling_price=v_line.selling_price,
          rack=case when v_rack <> '' then v_rack else public.products.rack end,
          updated_at=now()
      where id=v_product;
      v_updated:=v_updated+1;
    end if;

    if v_line.stock is distinct from v_stock then
      perform public.record_stock_movement(
        v_product,
        case when v_line.stock>v_stock then 'IN'::public.stock_type else 'OUT'::public.stock_type end,
        abs(v_line.stock-v_stock),
        coalesce(p_reference,'STOKAWAL'),
        'Diimpor lewat impor massal.',
        case when v_stock=0 then 'STOKAWAL' else 'KOREKSI' end,
        coalesce(p_party,'Stok Awal'),
        p_date
      );
    end if;
  end loop;
  return jsonb_build_object('created',v_created,'updated',v_updated);
end $$;
revoke all on function public.import_stock_products(jsonb,date,text,text) from public;
grant execute on function public.import_stock_products(jsonb,date,text,text) to authenticated;

