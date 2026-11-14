-- Creative Dimensions products: optional price options and personalisation.
-- Apply to project ypevaawhxhupjxjgkwdp. Additive and rerunnable; existing rows
-- keep NULL, which means "one price, no name field" (exactly today's behaviour).
begin;

alter table public.products
  add column if not exists "priceOptions" jsonb,
  add column if not exists personalization jsonb;

comment on column public.products."priceOptions" is
  'Choices with their own price: [{"label":"Full set of 5","priceUSD":18}]. NULL = single price.';
comment on column public.products.personalization is
  'Customer-typed text: {"label":"Name","placeholder":"e.g. Emma","maxLength":20,"required":true}. NULL = none.';

notify pgrst, 'reload schema';
commit;
