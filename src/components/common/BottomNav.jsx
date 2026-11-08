import { NavLink } from "react-router-dom";
import {
  Heart,
  Home,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { useCartStore } from "@/store/cartStore";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingCart, cart: true },
  { to: "/profile", label: "Account", icon: UserRound },
];

export default function BottomNav() {
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartOpen = useCartDrawerStore((state) => state.open);
  const openCart = useCartDrawerStore((state) => state.openCart);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line glass s          afe-bottom md:hidden">
      <div className="grid grid-cols-5">
        {links.map(({ to, label, icon: Icon, end, cart }) => {
          if (cart) {
            return (
              <button
                key={label}
                type="button"
                onClick={openCart}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  cartOpen ? "text-ink" : "text-muted",
                )}
                aria-label="Open cart"
              >
                <span
                  className={cn(
                    "relative grid h-8 w-12 place-items-center rounded-pill transition-colors",
                    cartOpen && "bg-soft",
                  )}
                >
                  <Icon size={19} strokeWidth={cartOpen ? 2.4 : 2} />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                {label}
              </button>
            );
          }

          return (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-ink" : "text-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "relative grid h-8 w-12 place-items-center rounded-pill transition-colors",
                      isActive && "bg-soft",
                    )}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
