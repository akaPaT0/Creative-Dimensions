-- Creative Dimensions only. Apply to project ypevaawhxhupjxjgkwdp.
-- Additive and rerunnable. Daily counts of visits that involve an AI assistant.
-- One row per day, kind, service, robot/referring site and page. No IP addresses,
-- no visitor identifiers and no per-visit rows are stored.
begin;

create table if not exists public.cd_ai_traffic (
  day    date    not null,
  -- crawler: an AI company's robot read the page
  -- fetch:   an assistant opened the page because someone asked it something
  -- referral: a real visitor arrived from an AI assistant
  kind   text    not null check (kind in ('crawler', 'fetch', 'referral')),
  source text    not null check (char_length(source) between 1 and 40),
  agent  text    not null check (char_length(agent) between 1 and 80),
  path   text    not null check (char_length(path) between 1 and 200),
  hits   integer not null default 0 check (hits >= 0),
  primary key (day, kind, source, agent, path)
);

-- Adds 1 to today's counter (UTC day). Stops creating new rows after 5000 in a
-- day so a flood of made-up addresses cannot fill the database.
create or replace function public.cd_ai_traffic_hit(
  p_kind   text,
  p_source text,
  p_agent  text,
  p_path   text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.cd_ai_traffic as t (day, kind, source, agent, path, hits)
  select (now() at time zone 'utc')::date, p_kind, p_source, p_agent, p_path, 1
  where (
    select count(*) from public.cd_ai_traffic c
    where c.day = (now() at time zone 'utc')::date
  ) < 5000
  or exists (
    select 1 from public.cd_ai_traffic e
    where e.day = (now() at time zone 'utc')::date
      and e.kind = p_kind and e.source = p_source and e.agent = p_agent and e.path = p_path
  )
  on conflict (day, kind, source, agent, path)
  do update set hits = t.hits + 1;
$$;

-- No direct browser access. Only the server-only service role may read or count.
alter table public.cd_ai_traffic enable row level security;
revoke all on public.cd_ai_traffic from anon, authenticated;
grant select, insert, update, delete on public.cd_ai_traffic to service_role;

revoke all on function public.cd_ai_traffic_hit(text, text, text, text) from public, anon, authenticated;
grant execute on function public.cd_ai_traffic_hit(text, text, text, text) to service_role;

notify pgrst, 'reload schema';
commit;
