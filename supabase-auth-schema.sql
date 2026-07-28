create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.user_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Address',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text not null default '',
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_likes enable row level security;
alter table public.user_wishlist enable row level security;
alter table public.user_addresses enable row level security;

create policy "profiles own select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles own insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "likes own select" on public.user_likes
  for select using (auth.uid() = user_id);
create policy "likes own insert" on public.user_likes
  for insert with check (auth.uid() = user_id);
create policy "likes own delete" on public.user_likes
  for delete using (auth.uid() = user_id);

create policy "wishlist own select" on public.user_wishlist
  for select using (auth.uid() = user_id);
create policy "wishlist own insert" on public.user_wishlist
  for insert with check (auth.uid() = user_id);
create policy "wishlist own delete" on public.user_wishlist
  for delete using (auth.uid() = user_id);

create policy "addresses own select" on public.user_addresses
  for select using (auth.uid() = user_id);
create policy "addresses own insert" on public.user_addresses
  for insert with check (auth.uid() = user_id);
create policy "addresses own update" on public.user_addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses own delete" on public.user_addresses
  for delete using (auth.uid() = user_id);
