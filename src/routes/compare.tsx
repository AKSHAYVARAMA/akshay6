import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { money, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare listings — ReMarket" },
      { name: "description", content: "Compare price, condition, age and location side by side on ReMarket." },
      { property: "og:title", content: "Compare listings — ReMarket" },
      { property: "og:description", content: "Compare price, condition, age and location side by side." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem("remarket-compare") ?? "[]") as string[]);
    } catch {
      setIds([]);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["compare", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").in("id", ids);
      return (data ?? []) as Product[];
    },
  });

  const clear = () => {
    localStorage.setItem("remarket-compare", "[]");
    setIds([]);
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-tight">Compare</h1>
        {products.length > 0 && (
          <Button variant="secondary" className="rounded-full" onClick={clear}>
            Clear list
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nothing to compare yet — open a listing and tap “Compare”.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="glass-panel rounded-3xl p-5">
              <img
                src={product.images[0] ?? "/images/bag.jpg"}
                alt={product.title}
                loading="lazy"
                className="h-40 w-full rounded-2xl object-cover"
              />
              <h2 className="mt-3 font-display text-xl">{product.title}</h2>
              <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Price</dt>
                  <dd className="font-semibold text-primary">{money(Number(product.price), product.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Condition</dt>
                  <dd className="capitalize">{product.condition}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Age / usage</dt>
                  <dd>{product.item_age || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Price type</dt>
                  <dd>{product.negotiable ? "Negotiable" : "Fixed"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Location</dt>
                  <dd>{product.location}</dd>
                </div>
              </dl>
              <Button asChild className="mt-4 w-full rounded-full" variant="secondary">
                <Link to="/product/$id" params={{ id: product.id }}>
                  View listing
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
