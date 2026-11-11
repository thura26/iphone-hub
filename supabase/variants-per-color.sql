-- ============================================================
-- iPhone Hub — one variant per color image
-- Removes storage-multiplied variants so every product has exactly
-- one variant per product image. Stock from removed variants is
-- merged into the surviving variant.
-- Run once:
--   supabase db query --linked -f supabase/variants-per-color.sql
-- ============================================================

begin;

with totals as (
  select product_id, color, sum(stock)::integer as stock
  from public.product_variants
  group by product_id, color
)
update public.product_variants v
set stock = totals.stock
from totals
where v.product_id = totals.product_id
  and v.color = totals.color
  and v.stock is distinct from totals.stock;

delete from public.product_variants v
using (
  select id, row_number() over (
    partition by product_id, color order by sort_order, storage
  ) as rn
  from public.product_variants
) ranked
where v.id = ranked.id
  and ranked.rn > 1;

-- Keep the catalog price aligned with the surviving variant
update public.products p
set base_price = v.price
from public.product_variants v
where v.product_id = p.id
  and v.sort_order = (
    select min(v2.sort_order)
    from public.product_variants v2
    where v2.product_id = p.id
  );

commit;
