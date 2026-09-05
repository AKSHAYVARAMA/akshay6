import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — ReMarket" },
      { name: "description", content: "Review the items in your ReMarket cart before checkout." },
      { property: "og:title", content: "Your cart — ReMarket" },
      { property: "og:description", content: "Review the items in your ReMarket cart before checkout." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CartPage />
    </RequireAuth>
  ),
});

export interface CartRow {
  id: string;
  quantity: number;
  product: Product;
}

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items").select("id, quantity, product:products(*)");
      if (error) throw error;
      return (data ?? []).filter((row) => row.product) as unknown as CartRow[];
    },
  });
}

function CartPage() {
  const { data: items = [], isLoading } = useCart();
  const queryClient = useQueryClient();

  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  const setQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    void queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    void queryClient.invalidateQueries({ queryKey: ["cart"] });
    void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Your cart</h1>
      {isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="glass-panel flex items-center gap-4 rounded-3xl p-4">
              <img
                src={item.product.images[0] ?? "/images/camera.jpg"}
                alt={item.product.title}
                loading="lazy"
                width={128}
                height={128}
                className="size-20 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link to="/product/$id" params={{ id: item.product.id }} className="font-display text-lg">
                  {item.product.title}
                </Link>
                <p className="text-xs text-muted-foreground">{item.product.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => void setQuantity(item.id, item.quantity - 1)}>
                  −
                </Button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <Button size="sm" variant="secondary" onClick={() => void setQuantity(item.id, item.quantity + 1)}>
                  +
                </Button>
              </div>
              <p className="w-20 text-right font-display text-lg text-primary">
                {currency(Number(item.product.price) * item.quantity)}
              </p>
              <button onClick={() => void remove(item.id)} aria-label="Remove item" className="text-muted-foreground">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {!isLoading && items.length === 0 && (
            <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
              Your cart is empty.{" "}
              <Link to="/browse" className="text-primary hover:underline">
                Browse listings
              </Link>
            </div>
          )}
        </div>

        <aside className="glass-panel h-fit rounded-3xl p-6">
          <h2 className="font-display text-xl">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{currency(total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-display text-xl">
            <span>Total</span>
            <span className="text-primary">{currency(total)}</span>
          </div>
          <Button
            asChild
            className="sunset-gradient mt-5 w-full rounded-full border-0 text-primary-foreground"
            disabled={items.length === 0}
          >
            <Link to="/checkout">Checkout</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
