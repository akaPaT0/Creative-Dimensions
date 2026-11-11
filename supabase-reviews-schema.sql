-- Creative Dimensions only. Apply to project ypevaawhxhupjxjgkwdp.
-- Additive and rerunnable. Customer reviews submitted from /review.
-- New reviews start as 'pending' and only appear on the site once the admin approves them.
begin;

create table if not exists public.cd_reviews (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 60),
  rating      smallint    not null check (rating between 1 and 5),
  comment     text        not null check (char_length(comment) between 10 and 1200),
  product     text        not null default '' check (char_length(product) <= 120),
  order_ref   text        not null default '' check (char_length(order_ref) <= 40),
  status      text        not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists cd_reviews_status_created_idx
  on public.cd_reviews (status, created_at desc);

-- No direct browser access. Next.js routes use the server-only service role.
alter table public.cd_reviews enable row level security;
revoke all on public.cd_reviews from anon, authenticated;
grant select, insert, update, delete on public.cd_reviews to service_role;

notify pgrst, 'reload schema';
commit;
