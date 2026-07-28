-- Orders table — run this in Supabase SQL editor
create table if not exists public.orders (
  id             text        primary key,
  order_number   text        not null,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  status         text        not null default 'pending',
  created_at     timestamptz not null,
  shipping_usd   numeric(10,2) not null default 0,
  subtotal_usd   numeric(10,2) not null default 0,
  discount_usd   numeric(10,2) not null default 0,
  total_usd      numeric(10,2) not null default 0,
  promo_code     text,
  invoice        jsonb       not null default '{}',
  tracking_history jsonb     not null default '[]',
  address        jsonb       not null default '{}',
  items          jsonb       not null default '[]'
);

alter table public.orders enable row level security;

-- Users can only read their own orders (server uses service role which bypasses RLS)
create policy "Users can view own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

-- Index for fast per-user lookups
create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);
