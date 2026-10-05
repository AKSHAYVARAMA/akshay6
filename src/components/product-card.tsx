import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MarketplaceImage } from "@/components/marketplace-image";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { money, type Product } from "@/lib/marketplace";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const saveItem = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save items.");
      const { error } = await supabase
        .from("wishlists")
        .upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved to favourites");
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const conditionLabel =
    product.condition === "refurbished" ? "REFURBISHED" : product.condition.toUpperCase();
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <Link to="/product/$id" params={{ id: product.id }}>
          <MarketplaceImage
            src={product.images[0] ?? ""}
            alt={product.title}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-square w-full bg-muted object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <span
          className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-extrabold tracking-wide condition-${product.condition}`}
        >
          {conditionLabel}
        </span>
        <button
          onClick={() => saveItem.mutate()}
          aria-label="Save to favourites"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-muted-foreground shadow-sm backdrop-blur hover:text-red-500"
        >
          <Heart className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <Link to="/product/$id" params={{ id: product.id }}>
          <h3 className="line-clamp-2 text-base font-extrabold leading-tight">{product.title}</h3>
        </Link>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {product.location || "Location not set"}
        </p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-extrabold text-[#111827]">
              {money(product.price, product.currency)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {product.negotiable ? "Negotiable" : "Fixed price"} · {product.seller_name}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-lg bg-[#111827] px-3 text-xs text-white hover:bg-primary"
          >
            <Link to="/product/$id" params={{ id: product.id }}>
              <MessageCircle className="mr-1 size-3.5" /> Chat
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
