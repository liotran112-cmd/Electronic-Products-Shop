-- 0009_specs_projection.sql — the products.specs JSONB projection.
-- Canonical store = the normalized product_specifications rows. products.specs
-- is a DERIVED cache rebuilt on any spec change (docs/DATA-MODEL.md §1.3, §10),
-- so PDP render and the Algolia reindex read one product with no N joins.

create or replace function rebuild_product_specs(p_product uuid)
returns void
language plpgsql
as $$
declare
  v_specs jsonb;
begin
  with per_attr as (
    select
      ad.key,
      ad.data_type,
      -- multi_enum: aggregate all option rows into arrays
      jsonb_agg(ps.value_display order by ps.created_at)                    as displays,
      jsonb_agg(coalesce(ao.value, ps.value_text) order by ps.created_at)   as raw_values,
      -- scalar attrs: a single row, take the first (only) value
      (array_agg(ps.value_num        order by ps.created_at))[1] as value_num,
      (array_agg(ps.value_base       order by ps.created_at))[1] as value_base,
      (array_agg(ps.value_base_high  order by ps.created_at))[1] as value_base_high,
      (array_agg(ps.unit             order by ps.created_at))[1] as unit,
      (array_agg(ps.value_bool       order by ps.created_at))[1] as value_bool,
      (array_agg(ps.value_text       order by ps.created_at))[1] as value_text,
      (array_agg(ps.value_display    order by ps.created_at))[1] as value_display
    from product_specifications ps
    join attribute_definitions ad on ad.id = ps.attribute_id
    left join attribute_options ao on ao.id = ps.value_option_id
    where ps.product_id = p_product
      and ps.variant_id is null                 -- product-level projection
    group by ad.key, ad.data_type
  )
  select coalesce(jsonb_object_agg(key, spec), '{}'::jsonb)
  into v_specs
  from (
    select
      key,
      case data_type
        when 'multi_enum' then
          jsonb_strip_nulls(jsonb_build_object('display', displays, 'values', raw_values))
        when 'number' then
          jsonb_strip_nulls(jsonb_build_object('display', value_display, 'num', value_num, 'base', value_base, 'unit', unit))
        when 'integer' then
          jsonb_strip_nulls(jsonb_build_object('display', value_display, 'num', value_num))
        when 'range' then
          jsonb_strip_nulls(jsonb_build_object('display', value_display, 'base', value_base, 'base_high', value_base_high, 'unit', unit))
        when 'boolean' then
          jsonb_strip_nulls(jsonb_build_object('display', value_display, 'bool', value_bool))
        when 'enum' then
          jsonb_strip_nulls(jsonb_build_object('display', value_display))
        else -- text
          jsonb_strip_nulls(jsonb_build_object('display', value_display, 'text', value_text))
      end as spec
    from per_attr
  ) s;

  update products set specs = v_specs, updated_at = now() where id = p_product;
end;
$$;

-- Keep the projection in sync on every spec-row change. Handles product_id
-- changes on UPDATE by rebuilding both the old and new product.
create or replace function trg_rebuild_product_specs()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform rebuild_product_specs(old.product_id);
    return old;
  end if;

  perform rebuild_product_specs(new.product_id);
  if tg_op = 'UPDATE' and new.product_id is distinct from old.product_id then
    perform rebuild_product_specs(old.product_id);
  end if;
  return new;
end;
$$;

create trigger product_specifications_projection
after insert or update or delete on product_specifications
for each row execute function trg_rebuild_product_specs();
