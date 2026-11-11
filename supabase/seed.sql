-- ============================================================
-- iPhone Hub — seed catalog
-- Run after schema.sql:
--   supabase db query --linked -f supabase/seed.sql
-- ============================================================

-- Categories
insert into public.categories (name, slug, image, sort_order, active) values
  ('iPhone 18', 'iphone-18', '/images/products/iphone-18-pro-burgundy.png', 1, true),
  ('iPhone 17', 'iphone-17', '/images/products/iphone-17-lavender.png', 2, true),
  ('iPhone Air', 'iphone-air', '/images/products/iphone-air-skyblue.png', 3, true),
  ('iPhone 16', 'iphone-16', '/images/products/iphone-16-ultramarine.png', 4, true),
  ('iPhone 15', 'iphone-15', '/images/products/iphone-15-pink.png', 5, true),
  ('iPhone 14', 'iphone-14', '/images/products/iphone-14-blue.png', 6, true),
  ('iPad', 'ipad', '/images/products/ipad-air-11-blue.png', 7, true),
  ('MacBook', 'macbook', '/images/products/macbook-air-13-skyblue.png', 8, true),
  ('AirPods', 'airpods', '/images/products/airpods-pro-3.png', 9, true),
  ('Accessories', 'accessories', '/images/products/magsafe.webp', 10, true)
on conflict (slug) do update set
  name = excluded.name,
  image = excluded.image,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- Products
insert into public.products
  (category_id, name, slug, description, base_price, highlights, images, rating, review_count, featured, active)
values
  ((select id from public.categories where slug = 'accessories'),
   '20W USB-C Power Adapter', '20w-usb-c-power-adapter',
   'Fast, efficient charging at home or on the go. Official Apple 20W USB-C power adapter.',
   89000,
   array['20W fast charging', 'USB-C connector', 'Works with iPhone, iPad, and AirPods', 'Compact, travel-friendly design']::text[],
   array['/images/products/adapter-unsplash.webp']::text[],
   4.8, 62, true, true),
  ((select id from public.categories where slug = 'accessories'),
   'USB-C to Lightning Cable', 'usb-c-to-lightning-cable',
   'A durable charging cable for Lightning devices. 1 metre, white.',
   39000,
   array['USB-C to Lightning connector', '1 metre length', 'Supports fast charging with a 20W adapter', 'Apple original accessory']::text[],
   array['/images/products/usb-c-cable.webp']::text[],
   4.7, 88, false, true),
  ((select id from public.categories where slug = 'accessories'),
   'MagSafe Charger', 'magsafe-charger',
   'Snap on and charge wirelessly. MagSafe aligns perfectly every time.',
   149000,
   array['Up to 15W wireless charging', 'Magnetic alignment', 'Works with iPhone 12 and later', '1 metre USB-C cable included']::text[],
   array['/images/products/magsafe.webp']::text[],
   4.8, 71, false, true),
  ((select id from public.categories where slug = 'iphone-18'),
   'iPhone 18 Pro', 'iphone-18-pro',
   'The most powerful iPhone ever. A20 Pro chip, a pro camera system, and Apple Intelligence built in.',
   4799000,
   array['6.3-inch Super Retina XDR display with ProMotion', 'A20 Pro chip with 6-core GPU', '48MP Fusion camera system with 8x optical-quality zoom', 'Built for Apple Intelligence and all-day battery life']::text[],
   array['/images/products/iphone-18-pro-black.png', '/images/products/iphone-18-pro-burgundy.png', '/images/products/iphone-18-pro-glacier.png', '/images/products/iphone-18-pro-silver.png']::text[],
   4.9, 128, true, true),
  ((select id from public.categories where slug = 'iphone-18'),
   'iPhone 18 Pro Max', 'iphone-18-pro-max',
   'The biggest, boldest iPhone. A huge display, pro cameras, and the longest battery life in an iPhone.',
   5299000,
   array['6.9-inch Super Retina XDR display with ProMotion', 'A20 Pro chip with 6-core GPU', '48MP Fusion camera system with 8x optical-quality zoom', 'The longest battery life ever in an iPhone']::text[],
   array['/images/products/iphone-18-pro-max-black.png', '/images/products/iphone-18-pro-max-burgundy.png', '/images/products/iphone-18-pro-max-glacier.png', '/images/products/iphone-18-pro-max-silver.png']::text[],
   4.9, 96, true, true),
  ((select id from public.categories where slug = 'iphone-air'),
   'iPhone Air', 'iphone-air',
   'Impossibly thin. Incredibly powerful. The lightest iPhone with a full-size display and A19 Pro chip.',
   3299000,
   array['5.6mm ultra-thin titanium design', '6.5-inch Super Retina XDR display with ProMotion', 'A19 Pro chip with 5-core GPU', 'All-day battery life in the thinnest iPhone ever']::text[],
   array['/images/products/iphone-air-spaceblack.png', '/images/products/iphone-air-lightgold.png', '/images/products/iphone-air-skyblue.png', '/images/products/iphone-air-cloudwhite.png']::text[],
   4.8, 74, true, true),
  ((select id from public.categories where slug = 'iphone-17'),
   'iPhone 17', 'iphone-17',
   'A big upgrade in every way. A19 chip, a 120Hz display, and a dual-camera system that shoots like a pro.',
   2699000,
   array['6.3-inch Super Retina XDR display with 120Hz ProMotion', 'A19 chip with 5-core GPU', '48MP Dual Fusion camera system', 'Center Stage front camera and all-day battery life']::text[],
   array['/images/products/iphone-17-black.png', '/images/products/iphone-17-lavender.png', '/images/products/iphone-17-mistblue.png', '/images/products/iphone-17-sage.png', '/images/products/iphone-17-white.png']::text[],
   4.8, 112, true, true),
  ((select id from public.categories where slug = 'iphone-17'),
   'iPhone 17e', 'iphone-17e',
   'The essentials, elevated. A19 chip, a gorgeous display, and the camera you love at a great price.',
   1899000,
   array['6.1-inch Super Retina XDR display', 'A19 chip with 4-core GPU', '48MP Fusion camera with 2x optical-quality zoom', 'USB-C, MagSafe, and all-day battery life']::text[],
   array['/images/products/iphone-17e-black.png', '/images/products/iphone-17e-white.png', '/images/products/iphone-17e-softpink.png']::text[],
   4.6, 43, false, true),
  ((select id from public.categories where slug = 'iphone-17'),
   'iPhone 17 Pro', 'iphone-17-pro',
   'Pro cameras, pro performance, and a stunning titanium design. A phone made for creators.',
   3999000,
   array['6.3-inch Super Retina XDR display with ProMotion', 'A19 Pro chip with 6-core GPU', '48MP Pro camera system with 5x telephoto', 'Titanium design with Action button']::text[],
   array['/images/products/iphone-17-pro-cosmicorange.png', '/images/products/iphone-17-pro-deepblue.png', '/images/products/iphone-17-pro-silver.png']::text[],
   4.7, 58, false, true),
  ((select id from public.categories where slug = 'iphone-17'),
   'iPhone 17 Pro Max', 'iphone-17-pro-max',
   'The biggest Pro. A huge ProMotion display, the best cameras, and battery life that goes the distance.',
   5299000,
   array['6.9-inch Super Retina XDR display with ProMotion', 'A19 Pro chip with 6-core GPU', '48MP Pro camera system with 8x optical-quality zoom', 'Titanium design with the longest battery life']::text[],
   array['/images/products/iphone-17-pro-max-cosmicorange.png', '/images/products/iphone-17-pro-max-deepblue.png', '/images/products/iphone-17-pro-max-silver.png']::text[],
   4.8, 64, false, true),
  ((select id from public.categories where slug = 'iphone-16'),
   'iPhone 16', 'iphone-16',
   'A total powerhouse. A18 chip, Camera Control, and Apple Intelligence in a beautiful design.',
   2299000,
   array['6.1-inch Super Retina XDR display', 'A18 chip with 5-core GPU', '48MP Fusion camera with 2x optical-quality zoom', 'Camera Control and Action button']::text[],
   array['/images/products/iphone-16-black.png', '/images/products/iphone-16-pink.png', '/images/products/iphone-16-teal.png', '/images/products/iphone-16-ultramarine.png', '/images/products/iphone-16-white.png']::text[],
   4.7, 156, false, true),
  ((select id from public.categories where slug = 'iphone-16'),
   'iPhone 16e', 'iphone-16e',
   'The iPhone you love, at a price you will love. A18 chip, a brilliant display, and all-day battery life.',
   1699000,
   array['6.1-inch Super Retina XDR display', 'A18 chip with 4-core GPU', '48MP Fusion camera with 2x optical-quality zoom', 'USB-C, Face ID, and all-day battery life']::text[],
   array['/images/products/iphone-16e-black.png', '/images/products/iphone-16e-white.png']::text[],
   4.6, 52, false, true),
  ((select id from public.categories where slug = 'iphone-15'),
   'iPhone 15', 'iphone-15',
   'A huge leap. Dynamic Island, a 48MP camera, and USB-C in a durable color-infused glass design.',
   1899000,
   array['6.1-inch Super Retina XDR display', 'A16 Bionic chip with 5-core GPU', '48MP Main camera with 2x telephoto', 'Dynamic Island and USB-C']::text[],
   array['/images/products/iphone-15-black.png', '/images/products/iphone-15-blue.png', '/images/products/iphone-15-green.png', '/images/products/iphone-15-pink.png', '/images/products/iphone-15-yellow.png']::text[],
   4.6, 204, false, true),
  ((select id from public.categories where slug = 'iphone-14'),
   'iPhone 14', 'iphone-14',
   'A fantastic iPhone with a big display, great cameras, and all-day battery life.',
   1599000,
   array['6.1-inch Super Retina XDR display', 'A15 Bionic chip with 5-core GPU', 'Dual-camera system with Photonic Engine', 'Crash Detection and all-day battery life']::text[],
   array['/images/products/iphone-14-blue.png', '/images/products/iphone-14-midnight.png', '/images/products/iphone-14-purple.png', '/images/products/iphone-14-red.png', '/images/products/iphone-14-starlight.png']::text[],
   4.5, 188, false, true),
  ((select id from public.categories where slug = 'iphone-18'),
   'iPhone Duo', 'iphone-duo',
   'The first foldable iPhone. A seamless inner display that unfolds into a canvas for work, play, and everything in between.',
   6999000,
   array['7.8-inch folding Super Retina XDR display', 'A20 Pro chip with 6-core GPU', 'Dual camera system with 4x optical-quality zoom', 'Titanium hinge and all-day battery life']::text[],
   array['/images/products/iphone-duo-night-sky.png', '/images/products/iphone-duo-star-white.png']::text[],
   4.8, 37, true, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad', 'ipad',
   'Colorful, powerful, and ready for everything. The new iPad brings a bright display and A16 chip to every day.',
   1299000,
   array['11-inch Liquid Retina display', 'A16 chip with 5-core CPU', '12MP front and rear cameras', 'USB-C and all-day battery life']::text[],
   array['/images/products/ipad-blue.png', '/images/products/ipad-pink.png', '/images/products/ipad-silver.png', '/images/products/ipad-yellow.png']::text[],
   4.8, 84, false, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad mini', 'ipad-mini',
   'Big power in one hand. The new iPad mini is built for notes, reading, and everything on the go.',
   1899000,
   array['8.3-inch Liquid Retina display', 'A17 Pro chip with 5-core GPU', '12MP wide camera with Smart HDR 4', 'Apple Pencil Pro and USB-C support']::text[],
   array['/images/products/ipad-mini-midnight.png', '/images/products/ipad-mini-starlight.png']::text[],
   4.8, 61, false, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad Air 11-inch', 'ipad-air-11',
   'Thin, light, and powerful. iPad Air with the M3 chip turns everyday tasks into something extraordinary.',
   2299000,
   array['11-inch Liquid Retina display', 'M3 chip with 9-core CPU', '12MP Center Stage front camera', 'Apple Pencil Pro and Magic Keyboard support']::text[],
   array['/images/products/ipad-air-11-blue.png', '/images/products/ipad-air-11-purple.png', '/images/products/ipad-air-11-spacegray.png', '/images/products/ipad-air-11-starlight.png']::text[],
   4.9, 97, true, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad Air 13-inch', 'ipad-air-13',
   'A bigger canvas for bigger ideas. The 13-inch iPad Air pairs a stunning display with M3 performance.',
   2999000,
   array['13-inch Liquid Retina display', 'M3 chip with 9-core CPU', '12MP Center Stage front camera', 'Apple Pencil Pro and Magic Keyboard support']::text[],
   array['/images/products/ipad-air-13-blue.png', '/images/products/ipad-air-13-purple.png', '/images/products/ipad-air-13-spacegray.png', '/images/products/ipad-air-13-starlight.png']::text[],
   4.9, 73, false, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad Pro 11-inch', 'ipad-pro-11',
   'The ultimate iPad experience. An Ultra Retina XDR display, M4 chip, and impossibly thin design.',
   3999000,
   array['11-inch Ultra Retina XDR display', 'M4 chip with 10-core CPU', '12MP wide camera with LiDAR Scanner', 'Thunderbolt and Apple Pencil Pro support']::text[],
   array['/images/products/ipad-pro-11-silver.png', '/images/products/ipad-pro-11-spaceblack.png']::text[],
   4.9, 66, false, true),
  ((select id from public.categories where slug = 'ipad'),
   'iPad Pro 13-inch', 'ipad-pro-13',
   'The biggest, thinnest, most advanced iPad. A massive Ultra Retina XDR canvas powered by M4.',
   4999000,
   array['13-inch Ultra Retina XDR display', 'M4 chip with 10-core CPU', '12MP wide camera with LiDAR Scanner', 'Thunderbolt and Apple Pencil Pro support']::text[],
   array['/images/products/ipad-pro-13-silver.png', '/images/products/ipad-pro-13-spaceblack.png']::text[],
   4.9, 54, false, true),
  ((select id from public.categories where slug = 'macbook'),
   'MacBook Air 13-inch', 'macbook-air-13',
   'Thin, light, and seriously fast. The 13-inch MacBook Air with M4 is the perfect everyday laptop.',
   3499000,
   array['13.6-inch Liquid Retina display', 'Apple M4 chip with 10-core CPU', 'Up to 18 hours of battery life', 'Fanless design and MagSafe charging']::text[],
   array['/images/products/macbook-air-13-midnight.png', '/images/products/macbook-air-13-silver.png', '/images/products/macbook-air-13-skyblue.png', '/images/products/macbook-air-13-starlight.png']::text[],
   4.9, 88, true, true),
  ((select id from public.categories where slug = 'macbook'),
   'MacBook Air 15-inch', 'macbook-air-15',
   'More room to do more. The 15-inch MacBook Air brings a spacious display and M4 power in a thin design.',
   4199000,
   array['15.3-inch Liquid Retina display', 'Apple M4 chip with 10-core CPU', 'Up to 18 hours of battery life', 'Six-speaker sound system and MagSafe']::text[],
   array['/images/products/macbook-air-15-midnight.png', '/images/products/macbook-air-15-silver.png', '/images/products/macbook-air-15-skyblue.png', '/images/products/macbook-air-15-starlight.png']::text[],
   4.8, 59, false, true),
  ((select id from public.categories where slug = 'macbook'),
   'MacBook Pro 14-inch', 'macbook-pro-14',
   'A pro laptop in a take-anywhere size. The 14-inch MacBook Pro pairs M4 Pro power with a stunning XDR display.',
   5999000,
   array['14.2-inch Liquid Retina XDR display', 'Apple M4 Pro chip with 12-core CPU', 'Up to 22 hours of battery life', 'Thunderbolt 5 and HDMI ports']::text[],
   array['/images/products/macbook-pro-14-spaceblack.png', '/images/products/macbook-pro-14-silver.png']::text[],
   4.9, 47, false, true),
  ((select id from public.categories where slug = 'macbook'),
   'MacBook Pro 16-inch', 'macbook-pro-16',
   'The most powerful MacBook Pro. A massive XDR canvas, M4 Pro performance, and all-day battery life.',
   7499000,
   array['16.2-inch Liquid Retina XDR display', 'Apple M4 Pro chip with 14-core CPU', 'Up to 24 hours of battery life', 'Six-speaker sound system and Thunderbolt 5']::text[],
   array['/images/products/macbook-pro-16-spaceblack.png', '/images/products/macbook-pro-16-silver.png']::text[],
   4.9, 39, false, true),
  ((select id from public.categories where slug = 'airpods'),
   'AirPods 4', 'airpods-4',
   'A new level of comfort and sound. AirPods 4 deliver rich audio, Voice Isolation, and a redesigned fit.',
   449000,
   array['Personalized Spatial Audio', 'Up to 30 hours of listening time with the case', 'USB-C charging case', 'IP54 dust, sweat, and water resistance']::text[],
   array['/images/products/airpods-4.png']::text[],
   4.7, 132, false, true),
  ((select id from public.categories where slug = 'airpods'),
   'AirPods 5', 'airpods-5',
   'Everyday sound, elevated. AirPods 5 bring richer bass, clearer calls, and all-day comfort.',
   549000,
   array['Active Noise Cancellation', 'Adaptive Audio and Personalized Spatial Audio', 'Up to 36 hours of listening time with the case', 'USB-C and wireless charging']::text[],
   array['/images/products/airpods-5.png']::text[],
   4.8, 91, false, true),
  ((select id from public.categories where slug = 'airpods'),
   'AirPods Pro 3', 'airpods-pro-3',
   'The ultimate AirPods experience. Pro-level noise cancellation, immersive audio, and a healthier way to listen.',
   799000,
   array['Active Noise Cancellation with Adaptive Audio', 'Heart rate sensing during workouts', 'Up to 32 hours of listening time with the case', 'IP57 dust and water resistance']::text[],
   array['/images/products/airpods-pro-3.png']::text[],
   4.9, 145, true, true),
  ((select id from public.categories where slug = 'airpods'),
   'AirPods Max', 'airpods-max',
   'A stunning listening experience. AirPods Max combine high-fidelity audio with exceptional comfort.',
   1499000,
   array['High-fidelity over-ear audio', 'Active Noise Cancellation and Transparency mode', 'Up to 20 hours of listening time', 'USB-C charging and Spatial Audio']::text[],
   array['/images/products/airpods-max-blue.png', '/images/products/airpods-max-midnight.png', '/images/products/airpods-max-orange.png', '/images/products/airpods-max-purple.png', '/images/products/airpods-max-starlight.png']::text[],
   4.8, 67, false, true)
on conflict (slug) do update set
  category_id = excluded.category_id,
  images = excluded.images,
  active = true;

-- One variant per color image (no storage multiplication)
with specs (slug, colors, files, hexes, storage, price, stock, single_image) as (
  values
  ('iphone-18-pro', array['Black', 'Burgundy', 'Glacier', 'Silver']::text[], array['black', 'burgundy', 'glacier', 'silver']::text[], array['#1C1C1E', '#6E2B3A', '#D7DDE0', '#D9D9D9']::text[], '256GB', 4799000, 8, null),
  ('iphone-18-pro-max', array['Black', 'Burgundy', 'Glacier', 'Silver']::text[], array['black', 'burgundy', 'glacier', 'silver']::text[], array['#1C1C1E', '#6E2B3A', '#D7DDE0', '#D9D9D9']::text[], '256GB', 5299000, 6, null),
  ('iphone-air', array['Space Black', 'Light Gold', 'Sky Blue', 'Cloud White']::text[], array['spaceblack', 'lightgold', 'skyblue', 'cloudwhite']::text[], array['#2F2F31', '#E8DCC3', '#BFD8E6', '#F4F4F2']::text[], '256GB', 3299000, 7, null),
  ('iphone-17', array['Black', 'Lavender', 'Mist Blue', 'Sage', 'White']::text[], array['black', 'lavender', 'mistblue', 'sage', 'white']::text[], array['#1B1B1D', '#C9C0E8', '#B9D4E6', '#B9C8B1', '#F7F7F7']::text[], '128GB', 2699000, 10, null),
  ('iphone-17e', array['Black', 'White', 'Soft Pink']::text[], array['black', 'white', 'softpink']::text[], array['#1B1B1D', '#F7F7F7', '#F2C6C9']::text[], '128GB', 1899000, 12, null),
  ('iphone-17-pro', array['Cosmic Orange', 'Deep Blue', 'Silver']::text[], array['cosmicorange', 'deepblue', 'silver']::text[], array['#E8793B', '#2C3E66', '#D9D9D9']::text[], '256GB', 3999000, 6, null),
  ('iphone-17-pro-max', array['Cosmic Orange', 'Deep Blue', 'Silver']::text[], array['cosmicorange', 'deepblue', 'silver']::text[], array['#E8793B', '#2C3E66', '#D9D9D9']::text[], '256GB', 5299000, 6, null),
  ('iphone-16', array['Black', 'Pink', 'Teal', 'Ultramarine', 'White']::text[], array['black', 'pink', 'teal', 'ultramarine', 'white']::text[], array['#1B1B1D', '#F2C6C9', '#7FB6B0', '#4B5CC4', '#F7F7F7']::text[], '128GB', 2299000, 14, null),
  ('iphone-16e', array['Black', 'White']::text[], array['black', 'white']::text[], array['#1B1B1D', '#F7F7F7']::text[], '128GB', 1699000, 16, null),
  ('iphone-15', array['Black', 'Blue', 'Green', 'Pink', 'Yellow']::text[], array['black', 'blue', 'green', 'pink', 'yellow']::text[], array['#1B1B1D', '#C9D9E6', '#CFE0CF', '#F7C8D0', '#F2E6B8']::text[], '128GB', 1899000, 15, null),
  ('iphone-14', array['Blue', 'Midnight', 'Purple', 'Red', 'Starlight']::text[], array['blue', 'midnight', 'purple', 'red', 'starlight']::text[], array['#A7C1D9', '#1F2937', '#D8CDE8', '#C8102E', '#F5F1E8']::text[], '128GB', 1599000, 16, null),
  ('iphone-duo', array['Night Sky', 'Star White']::text[], array['night-sky', 'star-white']::text[], array['#2B2F3A', '#F4F2EC']::text[], '256GB', 6999000, 4, null),
  ('ipad', array['Blue', 'Pink', 'Silver', 'Yellow']::text[], array['blue', 'pink', 'silver', 'yellow']::text[], array['#8EC5E8', '#F2A7C3', '#D9D9D9', '#F2D06B']::text[], '128GB', 1299000, 8, null),
  ('ipad-mini', array['Midnight', 'Starlight']::text[], array['midnight', 'starlight']::text[], array['#2B2F3A', '#F5F1E8']::text[], '128GB', 1899000, 8, null),
  ('ipad-air-11', array['Blue', 'Purple', 'Space Gray', 'Starlight']::text[], array['blue', 'purple', 'spacegray', 'starlight']::text[], array['#8EC5E8', '#C9B8E8', '#4A4A4C', '#F5F1E8']::text[], '128GB', 2299000, 8, null),
  ('ipad-air-13', array['Blue', 'Purple', 'Space Gray', 'Starlight']::text[], array['blue', 'purple', 'spacegray', 'starlight']::text[], array['#8EC5E8', '#C9B8E8', '#4A4A4C', '#F5F1E8']::text[], '128GB', 2999000, 8, null),
  ('ipad-pro-11', array['Silver', 'Space Black']::text[], array['silver', 'spaceblack']::text[], array['#D9D9D9', '#2B2B2D']::text[], '256GB', 3999000, 6, null),
  ('ipad-pro-13', array['Silver', 'Space Black']::text[], array['silver', 'spaceblack']::text[], array['#D9D9D9', '#2B2B2D']::text[], '256GB', 4999000, 6, null),
  ('macbook-air-13', array['Midnight', 'Silver', 'Sky Blue', 'Starlight']::text[], array['midnight', 'silver', 'skyblue', 'starlight']::text[], array['#2B2F3A', '#D9D9D9', '#BFD8E6', '#F5F1E8']::text[], '256GB', 3499000, 6, null),
  ('macbook-air-15', array['Midnight', 'Silver', 'Sky Blue', 'Starlight']::text[], array['midnight', 'silver', 'skyblue', 'starlight']::text[], array['#2B2F3A', '#D9D9D9', '#BFD8E6', '#F5F1E8']::text[], '256GB', 4199000, 6, null),
  ('macbook-pro-14', array['Space Black', 'Silver']::text[], array['spaceblack', 'silver']::text[], array['#2B2B2D', '#D9D9D9']::text[], '512GB', 5999000, 4, null),
  ('macbook-pro-16', array['Space Black', 'Silver']::text[], array['spaceblack', 'silver']::text[], array['#2B2B2D', '#D9D9D9']::text[], '512GB', 7499000, 4, null),
  ('airpods-4', array['White']::text[], array['white']::text[], array['#FFFFFF']::text[], 'One Size', 449000, 20, '/images/products/airpods-4.png'),
  ('airpods-5', array['White']::text[], array['white']::text[], array['#FFFFFF']::text[], 'One Size', 549000, 20, '/images/products/airpods-5.png'),
  ('airpods-pro-3', array['White']::text[], array['white']::text[], array['#FFFFFF']::text[], 'One Size', 799000, 20, '/images/products/airpods-pro-3.png'),
  ('airpods-max', array['Blue', 'Midnight', 'Orange', 'Purple', 'Starlight']::text[], array['blue', 'midnight', 'orange', 'purple', 'starlight']::text[], array['#6C8EBF', '#2B2F3A', '#E8A07A', '#C9B8E8', '#F5F1E8']::text[], 'One Size', 1499000, 15, null)
)
insert into public.product_variants
  (product_id, storage, color, color_hex, sku, price, stock, image, sort_order)
select
  p.id,
  s.storage,
  s.colors[i],
  s.hexes[i],
  upper(replace(p.slug, '-', '')) || '-' ||
    upper(replace(s.files[i], '-', '')) || '-' ||
    upper(replace(s.storage, ' ', '')),
  s.price,
  s.stock,
  coalesce(s.single_image, '/images/products/' || p.slug || '-' || s.files[i] || '.png'),
  i
from specs s
join public.products p on p.slug = s.slug
cross join generate_subscripts(s.colors, 1) as i
on conflict (product_id, storage, color) do update set
  image = excluded.image,
  price = excluded.price,
  stock = excluded.stock,
  sort_order = excluded.sort_order;

-- Drop any legacy storage-multiplied variants so one image = one variant
delete from public.product_variants v
using (
  select id, row_number() over (
    partition by product_id, color order by sort_order, storage
  ) as rn
  from public.product_variants
) ranked
where v.id = ranked.id and ranked.rn > 1;

-- Accessory variants
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
select * from (values
  ('iPhone 18 Pro', 'Powered by Apple Intelligence.', 'Shop Now', '/product/iphone-18-pro',
   '/images/hero/iphone-18-pro-hero-v2.webp', 1, true),
  ('iPhone Air', 'Impossibly thin. Incredibly powerful.', 'Explore', '/product/iphone-air',
   '/images/products/iphone-air-skyblue.png', 2, true)
) as v(title, subtitle, cta_label, cta_link, image, sort_order, active)
where not exists (select 1 from public.banners);

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
  ('store', '{"name": "iPhone Hub", "tagline": "Premium Apple products. Always.", "email": "hello@iphonehub.com", "phone": "+95 9 000 000 000", "address": "Yangon, Myanmar"}'::jsonb)
on conflict (key) do update set value = excluded.value;
