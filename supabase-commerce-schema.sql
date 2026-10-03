-- Creative Dimensions only. Apply to project ypevaawhxhupjxjgkwdp.
-- Additive and rerunnable; does not overwrite records or seed discounts.
begin;

create table if not exists public.cd_promo_codes (
  code text primary key check (code <> '' and code = upper(trim(code))),
  record jsonb not null check (
    jsonb_typeof(record) = 'object' and record ? 'code' and record->>'code' = code
  )
);
create table if not exists public.cd_filaments (
  id text primary key,
  record jsonb not null check (
    jsonb_typeof(record) = 'object' and record ? 'id' and record->>'id' = id
  )
);
create table if not exists public.cd_document_counters (
  name text primary key check (name in ('order', 'invoice')),
  value bigint not null check (value >= 0)
);

-- No direct browser access. Next.js routes use the server-only service role.
alter table public.cd_promo_codes enable row level security;
alter table public.cd_filaments enable row level security;
alter table public.cd_document_counters enable row level security;
revoke all on public.cd_promo_codes, public.cd_filaments, public.cd_document_counters from anon, authenticated;
grant select, insert, update, delete on public.cd_promo_codes, public.cd_filaments, public.cd_document_counters to service_role;

-- Resume above existing numeric order/invoice numbers, preserving counters on rerun.
insert into public.cd_document_counters (name, value)
select 'order', coalesce(max(substring(order_number from '^CD-([0-9]+)$')::bigint), 0) from public.orders
on conflict (name) do update set value = greatest(cd_document_counters.value, excluded.value);
insert into public.cd_document_counters (name, value)
select 'invoice', coalesce(max(substring(invoice->>'invoiceNumber' from '^INV-([0-9]+)$')::bigint), 0) from public.orders
on conflict (name) do update set value = greatest(cd_document_counters.value, excluded.value);

create or replace function public.cd_next_document_numbers()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  order_value bigint;
  invoice_value bigint;
begin
  -- Fixed lock order; both increments commit together and are safe across requests.
  update public.cd_document_counters set value = value + 1 where name = 'order' returning value into order_value;
  update public.cd_document_counters set value = value + 1 where name = 'invoice' returning value into invoice_value;
  if order_value is null or invoice_value is null then
    raise exception 'Document counters have not been initialized';
  end if;
  return jsonb_build_object('orderNumber', 'CD-' || lpad(order_value::text, greatest(7, length(order_value::text)), '0'),
    'invoiceNumber', 'INV-' || lpad(invoice_value::text, greatest(7, length(invoice_value::text)), '0'));
end;
$$;
revoke all on function public.cd_next_document_numbers() from public, anon, authenticated;
grant execute on function public.cd_next_document_numbers() to service_role;
notify pgrst, 'reload schema';
commit;
