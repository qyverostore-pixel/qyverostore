-- Product weight is a display value (for example, "250 g" or "1.2 kg"),
-- rather than a quantity used for calculations. Preserve all existing values
-- while changing only the products.weight column.
alter table public.products
  drop constraint if exists products_weight_check;

alter table public.products
  alter column weight type text using weight::text;
