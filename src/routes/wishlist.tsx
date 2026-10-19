import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/marketplace";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your wishlist — ReMarket" },
      { name: "description", content: "Every listing you've saved on ReMarket, in one place." },
      { property: "og:title", content: "Your wishlist — ReMarket" },
      { property: "og:description", content: "Every listing you've saved on ReMarket, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <WishlistPage />
    </RequireAuth>
  ),
});

function WishlistPage() {
  const { user } = useAuth();
  const { data: items = [] } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wishlists").select("product:products(*)");
      return (data ?? []).map((row) => row.product).filter(Boolean) as unknown as Product[];
    },
  });

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Wishlist</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-muted-foreground">Nothing saved yet.</p>}
    </div>
  );
}
