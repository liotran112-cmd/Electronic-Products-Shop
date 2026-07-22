-- 0008_indexes.sql — indexing strategy (docs/DATA-MODEL.md §10).
-- Sized for AUTHORING + REINDEX load, not storefront QPS — Algolia serves
-- faceted filtering, so these tables never take high-QPS parametric queries.

-- Catalog
create index idx_products_brand        on products(brand_id);
create index idx_products_category     on products(primary_category_id);
create index idx_products_status       on products(status) where status = 'active';
create index idx_products_specs_gin    on products using gin (specs jsonb_path_ops);
create index idx_products_title_trgm   on products using gin (title gin_trgm_ops); -- admin search only
create index idx_prodcat_category      on product_categories(category_id);

-- Taxonomy
create index idx_categories_path_gist  on categories using gist (path);
create index idx_categories_parent     on categories(parent_id);

-- Variants & inventory
create index idx_variants_product      on product_variants(product_id);
create index idx_variants_sku          on product_variants(sku);
create index idx_inventory_updated     on inventory(updated_at);        -- sync deltas

-- Attribute system (serves ADMIN + REINDEX, not storefront QPS)
create index idx_spec_product          on product_specifications(product_id);
create index idx_spec_variant          on product_specifications(variant_id) where variant_id is not null;
create index idx_spec_attr_base        on product_specifications(attribute_id, value_base);
create index idx_spec_attr_option      on product_specifications(attribute_id, value_option_id)
                                          where value_option_id is not null;
create index idx_catattr_attr          on category_attributes(attribute_id);
create index idx_attropt_attr          on attribute_options(attribute_id);

-- Content / support
create index idx_reviews_product       on reviews(product_id, status);
create index idx_reviews_rating        on reviews(product_id, rating);
create index idx_documents_product     on documents(product_id, doc_type);
create index idx_firmware_product      on firmware(product_id, channel, published_at desc);
create index idx_fw_downloads_time     on firmware_downloads using brin (at);
create index idx_tutorials_product     on product_tutorials(product_id);

-- Relationships
create index idx_relations_from        on product_relations(from_product, relation_type);
create index idx_relations_to          on product_relations(to_product);
create index idx_compat_product        on compatibility(product_id);
create index idx_compat_target         on compatibility(target_product_id) where target_product_id is not null;

-- Sourcing
create index idx_supplier_products_prod on supplier_products(product_id);
create index idx_supplier_products_pref on supplier_products(product_id) where is_preferred;

-- Quotes
create index idx_quotes_user           on quote_requests(user_id);
create index idx_quotes_status         on quote_requests(status) where status in ('new','reviewing');
create index idx_quote_items_quote     on quote_items(quote_id);

-- Account
create index idx_wishlists_user        on wishlists(user_id);
create index idx_device_ownership_prod on device_ownership(product_id);
