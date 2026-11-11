-- Point historical order items at the transparent PNG product images
-- that replaced the legacy .webp renders.
begin;

update public.order_items
set image = '/images/products/iphone-17-black.png'
where image = '/images/products/iphone-17-black.webp';

update public.order_items
set image = '/images/products/iphone-17-pro-deepblue.png'
where image = '/images/products/iphone-17-pro.webp';

update public.order_items
set image = '/images/products/iphone-18-pro-black.png'
where image = '/images/products/iphone-18-pro-black.webp';

update public.order_items
set image = '/images/products/iphone-18-pro-glacier.png'
where image = '/images/products/iphone-18-pro-glacier.webp';

update public.order_items
set image = '/images/products/iphone-18-pro-silver.png'
where image = '/images/products/iphone-18-pro-silver.webp';

update public.order_items
set image = '/images/products/iphone-18-pro-max-black.png'
where image = '/images/products/iphone-18-pro-max-black.webp';

update public.order_items
set image = '/images/products/iphone-air-spaceblack.png'
where image = '/images/products/iphone-air-spaceblack.webp';

commit;
