import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency, type Product } from "@/lib/marketplace";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to add items to your cart.");
      const { error } = await supabase
        .from("cart_items")
        .upsert({ user_id: user.id, product_id: product.id, quantity: 1 }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveItem = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save items.");
      const { error } = await supabase
        .from("wishlists")
        .upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved to wishlist");
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="glass-panel group rounded-3xl p-3">
      <div className="relative">
        <Link to="/product/$id" params={{ id: product.id }}>
          <img
            src={product.images[0] ?? "/images/camera.jpg"}
            alt={product.title}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-square w-full rounded-2xl bg-muted object-cover"
          />
        </Link>
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            product.condition === "new" ? "bg-accent text-accent-foreground" : "bg-gold text-ink"
          }`}
        >
          {product.condition.toUpperCase()}
        </span>
        <button
          onClick={() => saveItem.mutate()}
          aria-label="Save to wishlist"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground backdrop-blur"
        >
          <Heart className="size-4" />
        </button>
      </div>
      <div className="p-2">
        <Link to="/product/$id" params={{ id: product.id }}>
          <h3 className="font-display text-lg leading-tight">{product.title}</h3>
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.location} · {product.views} views
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-xl font-semibold text-primary">{currency(product.price)}</p>
            {product.compare_at_price ? (
              <p className="text-[10px] text-muted-foreground line-through">{currency(product.compare_at_price)}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">{product.seller_name}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => addToCart.mutate()}
            className="rounded-full bg-foreground px-3.5 text-xs text-background hover:bg-foreground/90"
          >
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}
