-- Tabel penyimpanan transaksi payment gateway (Midtrans Snap).
-- Jalankan di Supabase SQL Editor atau via `supabase db push`.

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    order_id text not null unique,
    amount bigint not null default 0,
    customer_name text,
    payment_type text,
    method text,
    status text not null default 'pending', -- pending | paid | expired | failed
    transaction_status text,
    payload jsonb,
    paid_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

alter table public.payments enable row level security;

-- Owner/superuser dapat baca-tulis semuanya. Akses anon/authenticated dapat dibatasi
-- sesuai kebutuhan operasional kasir.
create policy "payments_select_all" on public.payments
    for select using (true);
create policy "payments_insert_all" on public.payments
    for insert with check (true);
create policy "payments_update_all" on public.payments
    for update using (true);