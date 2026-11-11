-- ============================================================
-- iPhone Hub — Supabase schema
-- Run with: supabase db query --linked -f supabase/schema.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Addresses
-- ------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address text not null,
  township text,
  region text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Catalog
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(12,2) not null default 0,
  highlights text[] not null default '{}',
  images text[] not null default '{}',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage text not null,
  color text not null,
  color_hex text,
  sku text unique,
  price numeric(12,2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  image text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, storage, color)
);

-- ------------------------------------------------------------
-- Cart & wishlist
-- ------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (cart_id, variant_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default (
    'IPH' || to_char(now(), 'YYMMDD') || lpad(nextval('public.order_number_seq')::text, 4, '0')
  ),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  address text,
  township text,
  region text,
  postal_code text,
  delivery_method text not null default 'standard' check (delivery_method in ('standard', 'express')),
  payment_method text not null default 'cod' check (payment_method in ('cod', 'card', 'apple_pay')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  coupon_code text,
  note text,
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_storage text,
  variant_color text,
  image text,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Reviews
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ------------------------------------------------------------
-- Content, coupons, settings
-- ------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_label text default 'Shop Now',
  cta_link text default '/shop',
  image text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percent' check (type in ('percent', 'fixed')),
  value numeric(12,2) not null default 0,
  min_spend numeric(12,2) not null default 0,
  usage_limit integer,
  per_user_limit integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Add columns introduced after the first release.
alter table public.coupons add column if not exists per_user_limit integer;

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value)
values ('announcement', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Returns, audit log, newsletter
-- ------------------------------------------------------------
create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded')),
  admin_note text,
  refund_amount numeric(12,2),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists return_requests_user_idx on public.return_requests(user_id);
create index if not exists return_requests_status_idx on public.return_requests(status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'footer',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A customer must never be able to promote themselves.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Recalculate a product's rating after reviews change.
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product uuid;
begin
  v_product := coalesce(new.product_id, old.product_id);
  update public.products
     set rating = coalesce((
           select round(avg(rating)::numeric, 1)
           from public.reviews
           where product_id = v_product and approved = true
         ), 0),
         review_count = (
           select count(*)
           from public.reviews
           where product_id = v_product and approved = true
         )
   where id = v_product;
  return null;
end;
$$;

drop trigger if exists refresh_product_rating_trigger on public.reviews;
create trigger refresh_product_rating_trigger
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- updated_at triggers
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists return_requests_updated_at on public.return_requests;
create trigger return_requests_updated_at before update on public.return_requests
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Order RPCs
-- ------------------------------------------------------------
create or replace function public.create_order(
  p_items jsonb,
  p_address text,
  p_township text,
  p_region text,
  p_postal_code text,
  p_phone text,
  p_customer_name text,
  p_delivery_method text,
  p_payment_method text,
  p_coupon_code text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_var record;
  v_qty integer;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_order_id uuid;
  v_order_number text;
  v_items jsonb := '[]'::jsonb;
  v_coupon public.coupons%rowtype;
  v_express_fee numeric(12,2) := 15000;
  v_standard_fee numeric(12,2) := 0;
  v_free_threshold numeric(12,2) := 5000000;
  v_eta date;
  v_used integer;
begin
  if v_user is null then
    raise exception 'Please sign in before placing an order';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  select
    coalesce((value->>'express')::numeric, 15000),
    coalesce((value->>'standard')::numeric, 0),
    coalesce((value->>'free_threshold')::numeric, 5000000)
  into v_express_fee, v_standard_fee, v_free_threshold
  from public.settings
  where key = 'shipping';

  v_express_fee := coalesce(v_express_fee, 15000);
  v_standard_fee := coalesce(v_standard_fee, 0);
  v_free_threshold := coalesce(v_free_threshold, 5000000);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item.value->>'quantity')::integer, 1), 1);

    select v.id, v.product_id, v.storage, v.color, v.price, v.stock,
           v.image, p.name as product_name
      into v_var
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item.value->>'variant_id')::uuid
       and v.active = true
       and p.active = true
     for update of v;

    if not found then
      raise exception 'One of the products is no longer available';
    end if;

    if v_var.stock < v_qty then
      raise exception 'Not enough stock for %', v_var.product_name;
    end if;

    v_subtotal := v_subtotal + (v_var.price * v_qty);

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'variant_id', v_var.id,
      'product_id', v_var.product_id,
      'product_name', v_var.product_name,
      'variant_storage', v_var.storage,
      'variant_color', v_var.color,
      'image', v_var.image,
      'unit_price', v_var.price,
      'quantity', v_qty
    ));
  end loop;

  if p_delivery_method = 'express' then
    v_shipping := v_express_fee;
  else
    v_shipping := v_standard_fee;
  end if;

  if p_delivery_method = 'standard' and v_subtotal >= v_free_threshold then
    v_shipping := 0;
  end if;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
      from public.coupons
     where lower(code) = lower(trim(p_coupon_code))
       and active = true
       and (expires_at is null or expires_at > now())
       and (usage_limit is null or used_count < usage_limit)
     for update;

    if not found then
      raise exception 'Invalid or expired coupon code';
    end if;

    if v_subtotal < v_coupon.min_spend then
      raise exception 'This coupon needs a minimum spend of %', v_coupon.min_spend;
    end if;

    if v_coupon.per_user_limit is not null then
      select count(*) into v_used
        from public.orders
       where user_id = v_user
         and coupon_code is not null
         and lower(coupon_code) = lower(v_coupon.code)
         and status <> 'cancelled';

      if v_used >= v_coupon.per_user_limit then
        raise exception 'You have already used this coupon the maximum number of times';
      end if;
    end if;

    if v_coupon.type = 'percent' then
      v_discount := round(v_subtotal * v_coupon.value / 100, 2);
    else
      v_discount := v_coupon.value;
    end if;

    v_discount := least(v_discount, v_subtotal);
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_total := greatest(v_subtotal + v_shipping - v_discount, 0);
  v_eta := case when p_delivery_method = 'express' then current_date + 1 else current_date + 3 end;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone,
    address, township, region, postal_code,
    delivery_method, payment_method, payment_status, status,
    subtotal, shipping_fee, discount, total_amount,
    coupon_code, note, estimated_delivery
  ) values (
    v_user,
    coalesce(nullif(p_customer_name, ''), (select full_name from public.profiles where id = v_user), 'Customer'),
    (select email from public.profiles where id = v_user),
    p_phone, p_address, p_township, p_region, p_postal_code,
    p_delivery_method, p_payment_method,
    case when p_payment_method in ('card', 'apple_pay') then 'paid' else 'unpaid' end,
    'pending',
    v_subtotal, v_shipping, v_discount, v_total,
    nullif(trim(p_coupon_code), ''), p_note, v_eta
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(v_items)
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name,
      variant_storage, variant_color, image, unit_price, quantity
    ) values (
      v_order_id,
      (v_item.value->>'product_id')::uuid,
      (v_item.value->>'variant_id')::uuid,
      v_item.value->>'product_name',
      v_item.value->>'variant_storage',
      v_item.value->>'variant_color',
      v_item.value->>'image',
      (v_item.value->>'unit_price')::numeric,
      (v_item.value->>'quantity')::integer
    );

    update public.product_variants
       set stock = stock - (v_item.value->>'quantity')::integer
     where id = (v_item.value->>'variant_id')::uuid;
  end loop;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (v_order_id, 'pending', 'Order placed', v_user);

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping,
    'discount', v_discount,
    'total', v_total,
    'estimated_delivery', v_eta
  );
end;
$$;

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  d numeric(12,2) := 0;
  v_used integer;
begin
  select * into c
    from public.coupons
   where lower(code) = lower(trim(p_code))
     and active = true
     and (expires_at is null or expires_at > now())
     and (usage_limit is null or used_count < usage_limit);

  if not found then
    return jsonb_build_object('valid', false, 'discount', 0, 'message', 'Invalid or expired coupon code');
  end if;

  if p_subtotal < c.min_spend then
    return jsonb_build_object(
      'valid', false,
      'discount', 0,
      'message', 'Minimum spend is ' || to_char(c.min_spend, 'FM999,999,999') || ' Ks'
    );
  end if;

  if c.per_user_limit is not null and auth.uid() is not null then
    select count(*) into v_used
      from public.orders
     where user_id = auth.uid()
       and coupon_code is not null
       and lower(coupon_code) = lower(c.code)
       and status <> 'cancelled';

    if v_used >= c.per_user_limit then
      return jsonb_build_object(
        'valid', false,
        'discount', 0,
        'message', 'You have already used this coupon the maximum number of times'
      );
    end if;
  end if;

  if c.type = 'percent' then
    d := round(p_subtotal * c.value / 100, 2);
  else
    d := c.value;
  end if;

  d := least(d, p_subtotal);

  return jsonb_build_object(
    'valid', true,
    'code', c.code,
    'type', c.type,
    'value', c.value,
    'discount', d,
    'message', 'Coupon applied'
  );
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  it record;
begin
  select * into o from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if o.user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'You are not allowed to cancel this order';
  end if;

  if o.status not in ('pending', 'confirmed') then
    raise exception 'This order can no longer be cancelled';
  end if;

  for it in select * from public.order_items where order_id = p_order_id
  loop
    if it.variant_id is not null then
      update public.product_variants
         set stock = stock + it.quantity
       where id = it.variant_id;
    end if;
  end loop;

  update public.orders set status = 'cancelled' where id = p_order_id;
  insert into public.order_status_history (order_id, status, note, created_by)
  values (p_order_id, 'cancelled', 'Order cancelled', auth.uid());
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  it record;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select * into o from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if p_status = 'cancelled' and o.status <> 'cancelled' then
    for it in select * from public.order_items where order_id = p_order_id
    loop
      if it.variant_id is not null then
        update public.product_variants
           set stock = stock + it.quantity
         where id = it.variant_id;
      end if;
    end loop;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (p_order_id, p_status, p_note, auth.uid());
end;
$$;

create or replace function public.resolve_return_request(
  p_id uuid,
  p_status text,
  p_admin_note text default null,
  p_refund_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.return_requests%rowtype;
  v_order_total numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('approved', 'rejected', 'refunded') then
    raise exception 'Invalid return status';
  end if;

  select * into r from public.return_requests where id = p_id for update;

  if not found then
    raise exception 'Return request not found';
  end if;

  if r.status in ('rejected', 'refunded') then
    raise exception 'This return request is already closed';
  end if;

  select total_amount into v_order_total from public.orders where id = r.order_id;

  update public.return_requests
     set status = p_status,
         admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note),
         refund_amount = case
           when p_status in ('approved', 'refunded')
             then coalesce(p_refund_amount, refund_amount, v_order_total)
           else refund_amount
         end,
         resolved_by = auth.uid(),
         resolved_at = case when p_status in ('rejected', 'refunded') then now() else resolved_at end
   where id = p_id;

  if p_status = 'refunded' then
    update public.orders set payment_status = 'refunded' where id = r.order_id;
  end if;
end;
$$;

grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.validate_coupon(text, numeric) to authenticated, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.resolve_return_request(uuid, text, text, numeric) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.banners enable row level security;
alter table public.coupons enable row level security;
alter table public.settings enable row level security;
alter table public.return_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Drop policies from earlier versions of this file.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Addresses
create policy "addresses_own" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_admin_read" on public.addresses
  for select using (public.is_admin());

-- Catalog: public can read active rows
create policy "categories_public_read" on public.categories
  for select using (active = true or public.is_admin());
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "products_public_read" on public.products
  for select using (active = true or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "variants_public_read" on public.product_variants
  for select using (active = true or public.is_admin());
create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());
create policy "banners_public_read" on public.banners
  for select using (active = true or public.is_admin());
create policy "banners_admin_write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- Cart & wishlist
create policy "carts_own" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_items_own" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "wishlists_own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_history_select" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Reviews
create policy "reviews_public_read" on public.reviews
  for select using (approved = true or auth.uid() = user_id or public.is_admin());
create policy "reviews_own_write" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_own_update" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews_admin_all" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Coupons & settings
create policy "coupons_read_active" on public.coupons
  for select using (active = true or public.is_admin());
create policy "coupons_admin_write" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "settings_public_read" on public.settings
  for select using (true);
create policy "settings_admin_write" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Returns
create policy "returns_select_own_or_admin" on public.return_requests
  for select using (auth.uid() = user_id or public.is_admin());
create policy "returns_insert_own" on public.return_requests
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'delivered'
    )
  );
create policy "returns_admin_update" on public.return_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Audit log (admins read; entries are written by signed-in admins)
create policy "audit_logs_admin_read" on public.audit_logs
  for select using (public.is_admin());
create policy "audit_logs_admin_insert" on public.audit_logs
  for insert with check (public.is_admin());

-- Newsletter (anyone can subscribe; admins manage the list)
create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter_admin_read" on public.newsletter_subscribers
  for select using (public.is_admin());
create policy "newsletter_admin_update" on public.newsletter_subscribers
  for update using (public.is_admin()) with check (public.is_admin());
create policy "newsletter_admin_delete" on public.newsletter_subscribers
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.categories, public.products, public.product_variants,
  public.banners, public.settings to anon, authenticated;
grant select on public.coupons to authenticated;
grant select, insert, update, delete on public.profiles, public.addresses,
  public.carts, public.cart_items, public.wishlists, public.orders,
  public.order_items, public.order_status_history, public.reviews,
  public.categories, public.products, public.product_variants,
  public.banners, public.coupons, public.settings to authenticated;

grant select, insert, update on public.return_requests to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;

grant usage, select on sequence public.order_number_seq to authenticated;

-- ------------------------------------------------------------
-- Storage bucket for admin product images
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_status_history'
  ) then
    execute 'alter publication supabase_realtime add table public.order_status_history';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'return_requests'
  ) then
    execute 'alter publication supabase_realtime add table public.return_requests';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'audit_logs'
  ) then
    execute 'alter publication supabase_realtime add table public.audit_logs';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings'
  ) then
    execute 'alter publication supabase_realtime add table public.settings';
  end if;
end $$;
