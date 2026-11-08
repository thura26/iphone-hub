-- ============================================================
-- iPhone Hub — seed catalog
-- Run after schema.sql:
--   supabase db query --linked -f supabase/seed.sql
-- ============================================================

-- Categories
insert into public.categories (name, slug, image, sort_order, active) values
  ('iPhone 18', 'iphone-18', '/images/products/iphone-18-pro-burgundy.webp', 1, true),
  ('iPhone 17', 'iphone-17', '/images/products/iphone-17-lavender.webp', 2, true),
  ('iPhone Air', 'iphone-air', '/images/products/iphone-air-skyblue.webp', 3, true),
  ('iPhone 16', 'iphone-16', '/images/products/iphone-16-gsm.webp', 4, true),
  ('iPhone 15', 'iphone-15', '/images/products/iphone-15.webp', 5, true),
  ('iPhone 14', 'iphone-14', '/images/products/iphone-14.webp', 6, true),
  ('Accessories', 'accessories', '/images/products/magsafe.webp', 7, true)
on conflict (slug) do update set
  name = excluded.name,
  image = excluded.image,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- Products
insert into public.products
  (category_id, name, slug, description, base_price, highlights, images, rating, review_count, featured, active)
values
  (
    (select id from public.categories where slug = 'iphone-18'),
    'iPhone 18 Pro', 'iphone-18-pro',
    'The most powerful iPhone ever. A20 Pro chip, a pro camera system, and Apple Intelligence built in.',
    4799000,
    array[
      '6.3-inch Super Retina XDR display with ProMotion',
      'A20 Pro chip with 6-core GPU',
      '48MP Fusion camera system with 8x optical-quality zoom',
      'Built for Apple Intelligence and all-day battery life'
    ],
    array[
      '/images/products/iphone-18-pro-black.webp',
      '/images/products/iphone-18-pro-burgundy.webp',
      '/images/products/iphone-18-pro-glacier.webp',
      '/images/products/iphone-18-pro-silver.webp'
    ],
    4.9, 128, true, true
  ),
  (
    (select id from public.categories where slug = 'iphone-18'),
    'iPhone 18 Pro Max', 'iphone-18-pro-max',
    'The biggest, boldest iPhone. A huge display, pro cameras, and the longest battery life in an iPhone.',
    5299000,
    array[
      '6.9-inch Super Retina XDR display with ProMotion',
      'A20 Pro chip with 6-core GPU',
      '48MP Fusion camera system with 8x optical-quality zoom',
      'The longest battery life ever in an iPhone'
    ],
    array[
      '/images/products/iphone-18-pro-max-black.webp',
      '/images/products/iphone-18-pro-max-burgundy.webp',
      '/images/products/iphone-18-pro-max-glacier.webp',
      '/images/products/iphone-18-pro-max-silver.webp'
    ],
    4.9, 96, true, true
  ),
  (
    (select id from public.categories where slug = 'iphone-air'),
    'iPhone Air', 'iphone-air',
    'Impossibly thin. Incredibly powerful. The lightest iPhone with a full-size display and A19 Pro chip.',
    3299000,
    array[
      '5.6mm ultra-thin titanium design',
      '6.5-inch Super Retina XDR display with ProMotion',
      'A19 Pro chip with 5-core GPU',
      'All-day battery life in the thinnest iPhone ever'
    ],
    array[
      '/images/products/iphone-air-spaceblack.webp',
      '/images/products/iphone-air-lightgold.webp',
      '/images/products/iphone-air-skyblue.webp',
      '/images/products/iphone-air-cloudwhite.webp'
    ],
    4.8, 74, true, true
  ),
  (
    (select id from public.categories where slug = 'iphone-17'),
    'iPhone 17', 'iphone-17',
    'A big upgrade in every way. A19 chip, a 120Hz display, and a dual-camera system that shoots like a pro.',
    2699000,
    array[
      '6.3-inch Super Retina XDR display with 120Hz ProMotion',
      'A19 chip with 5-core GPU',
      '48MP Dual Fusion camera system',
      'Center Stage front camera and all-day battery life'
    ],
    array[
      '/images/products/iphone-17-black.webp',
      '/images/products/iphone-17-lavender.webp',
      '/images/products/iphone-17-mistblue.webp',
      '/images/products/iphone-17-sage.webp',
      '/images/products/iphone-17-white.webp'
    ],
    4.8, 112, true, true
  ),
  (
    (select id from public.categories where slug = 'iphone-17'),
    'iPhone 17 Pro', 'iphone-17-pro',
    'Pro cameras, pro performance, and a stunning titanium design. A phone made for creators.',
    3999000,
    array[
      '6.3-inch Super Retina XDR display with ProMotion',
      'A19 Pro chip with 6-core GPU',
      '48MP Pro camera system with 5x telephoto',
      'Titanium design with Action button'
    ],
    array['/images/products/iphone-17-pro.webp'],
    4.7, 58, false, true
  ),
  (
    (select id from public.categories where slug = 'iphone-17'),
    'iPhone 17e', 'iphone-17e',
    'The essentials, elevated. A19 chip, a gorgeous display, and the camera you love at a great price.',
    1899000,
    array[
      '6.1-inch Super Retina XDR display',
      'A19 chip with 4-core GPU',
      '48MP Fusion camera with 2x optical-quality zoom',
      'USB-C, MagSafe, and all-day battery life'
    ],
    array[
      '/images/products/iphone-17e-black.webp',
      '/images/products/iphone-17e-white.webp',
      '/images/products/iphone-17e-softpink.webp'
    ],
    4.6, 43, false, true
  ),
  (
    (select id from public.categories where slug = 'iphone-16'),
    'iPhone 16', 'iphone-16',
    'A total powerhouse. A18 chip, Camera Control, and Apple Intelligence in a beautiful design.',
    2299000,
    array[
      '6.1-inch Super Retina XDR display',
      'A18 chip with 5-core GPU',
      '48MP Fusion camera with 2x optical-quality zoom',
      'Camera Control and Action button'
    ],
    array['/images/products/iphone-16-gsm.webp'],
    4.7, 156, false, true
  ),
  (
    (select id from public.categories where slug = 'iphone-15'),
    'iPhone 15', 'iphone-15',
    'A huge leap. Dynamic Island, a 48MP camera, and USB-C in a durable color-infused glass design.',
    1899000,
    array[
      '6.1-inch Super Retina XDR display',
      'A16 Bionic chip with 5-core GPU',
      '48MP Main camera with 2x telephoto',
      'Dynamic Island and USB-C'
    ],
    array['/images/products/iphone-15.webp'],
    4.6, 204, false, true
  ),
  (
    (select id from public.categories where slug = 'iphone-14'),
    'iPhone 14', 'iphone-14',
    'A fantastic iPhone with a big display, great cameras, and all-day battery life.',
    1599000,
    array[
      '6.1-inch Super Retina XDR display',
      'A15 Bionic chip with 5-core GPU',
      'Dual-camera system with Photonic Engine',
      'Crash Detection and all-day battery life'
    ],
    array['/images/products/iphone-14.webp'],
    4.5, 188, false, true
  ),
  (
    (select id from public.categories where slug = 'accessories'),
    '20W USB-C Power Adapter', '20w-usb-c-power-adapter',
    'Fast, efficient charging at home or on the go. Official Apple 20W USB-C power adapter.',
    89000,
    array[
      '20W fast charging',
      'USB-C connector',
      'Works with iPhone, iPad, and AirPods',
      'Compact, travel-friendly design'
    ],
    array['/images/products/adapter-unsplash.webp'],
    4.8, 62, true, true
  ),
  (
    (select id from public.categories where slug = 'accessories'),
    'USB-C to Lightning Cable', 'usb-c-to-lightning-cable',
    'A durable charging cable for Lightning devices. 1 metre, white.',
    39000,
    array[
      'USB-C to Lightning connector',
      '1 metre length',
      'Supports fast charging with a 20W adapter',
      'Apple original accessory'
    ],
    array['/images/products/usb-c-cable.webp'],
    4.7, 88, false, true
  ),
  (
    (select id from public.categories where slug = 'accessories'),
    'MagSafe Charger', 'magsafe-charger',
    'Snap on and charge wirelessly. MagSafe aligns perfectly every time.',
    149000,
    array[
      'Up to 15W wireless charging',
      'Magnetic alignment',
      'Works with iPhone 12 and later',
      '1 metre USB-C cable included'
    ],
    array['/images/products/magsafe.webp'],
    4.8, 71, false, true
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  highlights = excluded.highlights,
  images = excluded.images,
  rating = excluded.rating,
  review_count = excluded.review_count,
  featured = excluded.featured,
  active = excluded.active;

-- ------------------------------------------------------------
-- Variants
-- ------------------------------------------------------------

-- iPhone 18 Pro
do $$
declare
  v_product uuid;
  v_colors text[] := array['Black', 'Burgundy', 'Glacier', 'Silver'];
  v_files text[] := array['black', 'burgundy', 'glacier', 'silver'];
  v_hexes text[] := array['#1C1C1E', '#6E2B3A', '#D7DDE0', '#D9D9D9'];
  v_storages text[] := array['256GB', '512GB', '1TB'];
  v_prices numeric[] := array[4799000, 5499000, 6299000];
  i int; j int;
begin
  select id into v_product from public.products where slug = 'iphone-18-pro';
  for i in 1..array_length(v_colors, 1) loop
    for j in 1..array_length(v_storages, 1) loop
      insert into public.product_variants
        (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
      values (
        v_product, v_storages[j], v_colors[i], v_hexes[i],
        'IP18P-' || upper(v_files[i]) || '-' || v_storages[j],
        v_prices[j], 8, '/images/products/iphone-18-pro-' || v_files[i] || '.webp',
        i * 10 + j
      )
      on conflict (product_id, storage, color) do update set
        color_hex = excluded.color_hex,
        sku = excluded.sku,
        price = excluded.price,
        stock = excluded.stock,
        image = excluded.image,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end $$;

-- iPhone 18 Pro Max
do $$
declare
  v_product uuid;
  v_colors text[] := array['Black', 'Burgundy', 'Glacier', 'Silver'];
  v_files text[] := array['black', 'burgundy', 'glacier', 'silver'];
  v_hexes text[] := array['#1C1C1E', '#6E2B3A', '#D7DDE0', '#D9D9D9'];
  v_storages text[] := array['256GB', '512GB', '1TB'];
  v_prices numeric[] := array[5299000, 5999000, 6799000];
  i int; j int;
begin
  select id into v_product from public.products where slug = 'iphone-18-pro-max';
  for i in 1..array_length(v_colors, 1) loop
    for j in 1..array_length(v_storages, 1) loop
      insert into public.product_variants
        (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
      values (
        v_product, v_storages[j], v_colors[i], v_hexes[i],
        'IP18PM-' || upper(v_files[i]) || '-' || v_storages[j],
        v_prices[j], 6, '/images/products/iphone-18-pro-max-' || v_files[i] || '.webp',
        i * 10 + j
      )
      on conflict (product_id, storage, color) do update set
        color_hex = excluded.color_hex,
        sku = excluded.sku,
        price = excluded.price,
        stock = excluded.stock,
        image = excluded.image,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end $$;

-- iPhone Air
do $$
declare
  v_product uuid;
  v_colors text[] := array['Space Black', 'Light Gold', 'Sky Blue', 'Cloud White'];
  v_files text[] := array['spaceblack', 'lightgold', 'skyblue', 'cloudwhite'];
  v_hexes text[] := array['#2F2F31', '#E8DCC3', '#BFD8E6', '#F4F4F2'];
  v_storages text[] := array['256GB', '512GB', '1TB'];
  v_prices numeric[] := array[3299000, 3699000, 4299000];
  i int; j int;
begin
  select id into v_product from public.products where slug = 'iphone-air';
  for i in 1..array_length(v_colors, 1) loop
    for j in 1..array_length(v_storages, 1) loop
      insert into public.product_variants
        (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
      values (
        v_product, v_storages[j], v_colors[i], v_hexes[i],
        'IPAIR-' || upper(v_files[i]) || '-' || v_storages[j],
        v_prices[j], 7, '/images/products/iphone-air-' || v_files[i] || '.webp',
        i * 10 + j
      )
      on conflict (product_id, storage, color) do update set
        color_hex = excluded.color_hex,
        sku = excluded.sku,
        price = excluded.price,
        stock = excluded.stock,
        image = excluded.image,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end $$;

-- iPhone 17
do $$
declare
  v_product uuid;
  v_colors text[] := array['Black', 'Lavender', 'Mist Blue', 'Sage', 'White'];
  v_files text[] := array['black', 'lavender', 'mistblue', 'sage', 'white'];
  v_hexes text[] := array['#1B1B1D', '#C9C0E8', '#B9D4E6', '#B9C8B1', '#F7F7F7'];
  v_storages text[] := array['128GB', '256GB', '512GB'];
  v_prices numeric[] := array[2699000, 3099000, 3599000];
  i int; j int;
begin
  select id into v_product from public.products where slug = 'iphone-17';
  for i in 1..array_length(v_colors, 1) loop
    for j in 1..array_length(v_storages, 1) loop
      insert into public.product_variants
        (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
      values (
        v_product, v_storages[j], v_colors[i], v_hexes[i],
        'IP17-' || upper(v_files[i]) || '-' || v_storages[j],
        v_prices[j], 10, '/images/products/iphone-17-' || v_files[i] || '.webp',
        i * 10 + j
      )
      on conflict (product_id, storage, color) do update set
        color_hex = excluded.color_hex,
        sku = excluded.sku,
        price = excluded.price,
        stock = excluded.stock,
        image = excluded.image,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end $$;

-- iPhone 17 Pro
do $$
declare
  v_product uuid;
  v_storages text[] := array['256GB', '512GB', '1TB'];
  v_prices numeric[] := array[3999000, 4499000, 5199000];
  j int;
begin
  select id into v_product from public.products where slug = 'iphone-17-pro';
  for j in 1..array_length(v_storages, 1) loop
    insert into public.product_variants
      (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
    values (
      v_product, v_storages[j], 'Deep Blue', '#2C3E66',
      'IP17P-DEEPBLUE-' || v_storages[j],
      v_prices[j], 6, '/images/products/iphone-17-pro.webp', j
    )
    on conflict (product_id, storage, color) do update set
      color_hex = excluded.color_hex,
      sku = excluded.sku,
      price = excluded.price,
      stock = excluded.stock,
      image = excluded.image,
      sort_order = excluded.sort_order;
  end loop;
end $$;

-- iPhone 17e
do $$
declare
  v_product uuid;
  v_colors text[] := array['Black', 'White', 'Soft Pink'];
  v_files text[] := array['black', 'white', 'softpink'];
  v_hexes text[] := array['#1B1B1D', '#F7F7F7', '#F2C6C9'];
  v_storages text[] := array['128GB', '256GB'];
  v_prices numeric[] := array[1899000, 2199000];
  i int; j int;
begin
  select id into v_product from public.products where slug = 'iphone-17e';
  for i in 1..array_length(v_colors, 1) loop
    for j in 1..array_length(v_storages, 1) loop
      insert into public.product_variants
        (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
      values (
        v_product, v_storages[j], v_colors[i], v_hexes[i],
        'IP17E-' || upper(v_files[i]) || '-' || v_storages[j],
        v_prices[j], 12, '/images/products/iphone-17e-' || v_files[i] || '.webp',
        i * 10 + j
      )
      on conflict (product_id, storage, color) do update set
        color_hex = excluded.color_hex,
        sku = excluded.sku,
        price = excluded.price,
        stock = excluded.stock,
        image = excluded.image,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end $$;

-- iPhone 16
do $$
declare
  v_product uuid;
  v_storages text[] := array['128GB', '256GB', '512GB'];
  v_prices numeric[] := array[2299000, 2599000, 2999000];
  j int;
begin
  select id into v_product from public.products where slug = 'iphone-16';
  for j in 1..array_length(v_storages, 1) loop
    insert into public.product_variants
      (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
    values (
      v_product, v_storages[j], 'Ultramarine', '#4B5CC4',
      'IP16-ULTRAMARINE-' || v_storages[j],
      v_prices[j], 14, '/images/products/iphone-16-gsm.webp', j
    )
    on conflict (product_id, storage, color) do update set
      color_hex = excluded.color_hex,
      sku = excluded.sku,
      price = excluded.price,
      stock = excluded.stock,
      image = excluded.image,
      sort_order = excluded.sort_order;
  end loop;
end $$;

-- iPhone 15
do $$
declare
  v_product uuid;
  v_storages text[] := array['128GB', '256GB', '512GB'];
  v_prices numeric[] := array[1899000, 2199000, 2499000];
  j int;
begin
  select id into v_product from public.products where slug = 'iphone-15';
  for j in 1..array_length(v_storages, 1) loop
    insert into public.product_variants
      (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
    values (
      v_product, v_storages[j], 'Pink', '#F7C8D0',
      'IP15-PINK-' || v_storages[j],
      v_prices[j], 15, '/images/products/iphone-15.webp', j
    )
    on conflict (product_id, storage, color) do update set
      color_hex = excluded.color_hex,
      sku = excluded.sku,
      price = excluded.price,
      stock = excluded.stock,
      image = excluded.image,
      sort_order = excluded.sort_order;
  end loop;
end $$;

-- iPhone 14
do $$
declare
  v_product uuid;
  v_storages text[] := array['128GB', '256GB'];
  v_prices numeric[] := array[1599000, 1799000];
  j int;
begin
  select id into v_product from public.products where slug = 'iphone-14';
  for j in 1..array_length(v_storages, 1) loop
    insert into public.product_variants
      (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
    values (
      v_product, v_storages[j], 'Midnight', '#1F2937',
      'IP14-MIDNIGHT-' || v_storages[j],
      v_prices[j], 16, '/images/products/iphone-14.webp', j
    )
    on conflict (product_id, storage, color) do update set
      color_hex = excluded.color_hex,
      sku = excluded.sku,
      price = excluded.price,
      stock = excluded.stock,
      image = excluded.image,
      sort_order = excluded.sort_order;
  end loop;
end $$;

-- Accessories
insert into public.product_variants
  (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
values
  ((select id from public.products where slug = '20w-usb-c-power-adapter'),
   'One Size', 'White', '#FFFFFF', 'ACC-ADAPTER-20W', 89000, 60,
   '/images/products/adapter-unsplash.webp', 1),
  ((select id from public.products where slug = 'usb-c-to-lightning-cable'),
   '1m', 'White', '#FFFFFF', 'ACC-CABLE-USBC-LIGHTNING', 39000, 100,
   '/images/products/usb-c-cable.webp', 1),
  ((select id from public.products where slug = 'magsafe-charger'),
   '1m', 'White', '#FFFFFF', 'ACC-MAGSAFE-CHARGER', 149000, 40,
   '/images/products/magsafe.webp', 1)
on conflict (product_id, storage, color) do update set
  color_hex = excluded.color_hex,
  sku = excluded.sku,
  price = excluded.price,
  stock = excluded.stock,
  image = excluded.image,
  sort_order = excluded.sort_order;

-- Banners
insert into public.banners (title, subtitle, cta_label, cta_link, image, sort_order, active)
values
  ('iPhone 18 Pro', 'Powered by Apple Intelligence.', 'Shop Now', '/product/iphone-18-pro',
   '/images/hero/iphone-18-pro-hero.webp', 1, true),
  ('iPhone Air', 'Impossibly thin. Incredibly powerful.', 'Explore', '/product/iphone-air',
   '/images/products/iphone-air-skyblue.webp', 2, true)
on conflict do nothing;

-- Coupons
insert into public.coupons (code, type, value, min_spend, usage_limit, active)
values
  ('WELCOME10', 'percent', 10, 1000000, 1000, true),
  ('IPHONE50K', 'fixed', 50000, 3000000, 500, true)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  min_spend = excluded.min_spend,
  usage_limit = excluded.usage_limit,
  active = excluded.active;

-- Settings
insert into public.settings (key, value) values
  ('shipping', '{"standard": 0, "express": 15000, "free_threshold": 5000000}'::jsonb),
  ('store', '{"name": "iPhone Hub", "tagline": "Premium iPhones. Always.", "email": "hello@iphonehub.com", "phone": "+95 9 000 000 000", "address": "Yangon, Myanmar"}'::jsonb)
on conflict (key) do update set value = excluded.value;
