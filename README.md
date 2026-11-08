# iPhone Hub

React + Vite + Tailwind CSS + Supabase e-commerce web app for iPhones.

## Features

**Customer**
- Welcome, Home, Shop (series/storage/price filters + search), Product Detail
- Cart, 3-step Checkout (Shipping / Payment / Review), Order Success
- Auth (signup/login/password reset) via Supabase Auth
- Orders, Order Tracking, Profile, Addresses, Wishlist
- Light mode with smooth scroll-reveal animations
- Mock payment (Cash on Delivery / Card mock) — no real charges
- MMK currency, English UI

**Admin**
- Dashboard (sales, orders, customers, products)
- Products CRUD with variants (storage/color/price/stock/images)
- Orders management with status updates
- Customers, Categories, Banners, Coupons, Settings (placeholders)

## Tech Stack

- React 19 + Vite + JavaScript (no TypeScript)
- Tailwind CSS v4
- React Router v7
- Supabase (Auth, Postgres, Storage, RLS)
- Zustand (cart), TanStack Query-ready, React Hook Form + Zod, Framer Motion, Lucide, Sonner, Recharts

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and add your Supabase keys (already in .env from this project)
cp .env.example .env

# 3. Set up the database
# Open https://app.supabase.com -> your project -> SQL Editor
# Paste and run supabase/schema.sql

# 4. Make yourself admin (replace with your auth user id)
# update public.profiles set role = 'admin' where id = '<your-user-id>';

# 5. Run dev server
npm run dev

# 6. Build
npm run build
```

## Supabase Setup

1. Create a project at https://app.supabase.com
2. Copy `Project URL` and `anon public key` into `.env`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
3. Run `supabase/schema.sql` in the SQL Editor.
4. In Authentication > Settings, add your site URL to Redirect URLs.
5. Make your user an admin:
   ```sql
   update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
   ```

## Admin Access

- Sign up at `/auth/signup`, then run the admin SQL above.
- Visit `/admin` for Dashboard, Products, Orders, Customers.

## Notes

- Images use Unsplash source URLs; replace with your own product photos.
- Payment is mocked — no real money is processed.
- Guest cart is stored in localStorage; on login it merges with Supabase cart.
- Currency is MMK (placeholder pricing).
