-- seed.sql — the ESP32 dev board example, end to end (docs/DATA-MODEL.md §9).
-- Loaded by `supabase db reset`. Demonstrates the flexible attribute system;
-- the specs projection trigger (0009) fills products.specs automatically.

insert into brands (id, slug, name) values
  ('b1000000-0000-0000-0000-000000000001','espressif','Espressif');

insert into categories (id, parent_id, slug, name, path, depth) values
  ('c0000000-0000-0000-0000-000000000001', null, 'dev-boards','Development Boards','dev_boards',0),
  ('c0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000001','mcu-boards','MCU Boards','dev_boards.mcu_boards',1);

insert into products (id, shopify_product_id, handle, title, brand_id,
                      primary_category_id, kind, status, mpn) values
  ('a0000000-0000-0000-0000-000000000001',
   'gid://shopify/Product/8801', 'esp32-devkit-v1','ESP32 DevKit V1',
   'b1000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002','consumer','active','ESP32-DEVKITC-32D');

insert into attribute_definitions (id, key, name, data_type, unit, base_unit, base_factor,
                                   is_key_spec, display_group, sort) values
  ('d0000000-0000-0000-0000-000000000001','voltage_supply','Supply Voltage','number','V','V',1,        true, 'Power',       10),
  ('d0000000-0000-0000-0000-000000000002','cpu','CPU','text',null,null,null,                            true, 'Processor',   10),
  ('d0000000-0000-0000-0000-000000000003','connectivity','Connectivity','multi_enum',null,null,null,    true, 'Connectivity',10),
  ('d0000000-0000-0000-0000-000000000004','battery_capacity','Battery Capacity','number','mAh','Ah',0.001, true,'Power',    20),
  ('d0000000-0000-0000-0000-000000000005','op_temp','Operating Temp.','range','°C','°C',1,               false,'Environment',10);

insert into attribute_options (id, attribute_id, value, label, sort) values
  ('e0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','WiFi','Wi-Fi 802.11 b/g/n',10),
  ('e0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003','Bluetooth','Bluetooth 4.2 + BLE',20),
  ('e0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000003','Zigbee','Zigbee 3.0',30);

insert into category_attributes (category_id, attribute_id, sort) values
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001',10),
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002',20),
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003',30),
  ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000005',40);

-- Specifications (values). The projection trigger rebuilds products.specs on each write.
insert into product_specifications
  (product_id, attribute_id, value_num, value_base, unit, value_display) values
  ('a0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001', 5, 5, 'V', '5 V');

insert into product_specifications
  (product_id, attribute_id, value_text, value_display) values
  ('a0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','ESP32-D0WD','ESP32');

-- Connectivity = WiFi + Bluetooth -> two rows (multi_enum)
insert into product_specifications
  (product_id, attribute_id, value_option_id, value_display) values
  ('a0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001','Wi-Fi'),
  ('a0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000002','Bluetooth');

-- Operating temperature range -40..85 °C
insert into product_specifications
  (product_id, attribute_id, value_num, value_num_high, value_base, value_base_high, unit, value_display) values
  ('a0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000005',-40,85,-40,85,'°C','-40 to 85 °C');
