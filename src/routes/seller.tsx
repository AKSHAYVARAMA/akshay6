import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — ReMarket" },
      { name: "description", content: "Track sales, revenue and listings performance on ReMarket." },
      { property: "og:title", content: "Seller dashboard — ReMarket" },
      { property: "og:description", content: "Track sales, revenue and listings performance on ReMarket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth role="seller">
      <SellerDashboard />
    </RequireAuth>
  ),
});

function SellerDashboard() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["seller-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: listings } = await supabase.from("products").select("*").eq("seller_id", user!.id);
      const { data: sales } = await supabase.from("order_items").select("*").eq("seller_id", user!.id);
      return { listings: (listings ?? []) as Product[], sales: sales ?? [] };
    },
  });

  const listings = data?.listings ?? [];
  const sales = data?.sales ?? [];
  const revenue = sales.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const unitsSold = sales.reduce((sum, item) => sum + item.quantity, 0);
  const views = listings.reduce((sum, listing) => sum + (listing.views ?? 0), 0);

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-tight">Seller dashboard</h1>
        <Button asChild className="sunset-gradient rounded-full border-0 text-primary-foreground">
          <Link to="/listings/new">New listing</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenue", currency(revenue)],
          ["Units sold", String(unitsSold)],
          ["Active listings", String(listings.filter((l) => l.status === "approved").length)],
          ["Listing views", String(views)],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl">Your listings</h2>
      <div className="mt-4 space-y-3">
        {listings.map((listing) => (
          <div key={listing.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
            <span className="font-display text-lg">{listing.title}</span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{listing.status}</span>
            <span className="text-sm text-muted-foreground">{listing.stock} in stock</span>
            <span className="text-primary">{currency(Number(listing.price))}</span>
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                Manage
              </Link>
            </Button>
          </div>
        ))}
        {listings.length === 0 && <p className="text-muted-foreground">No listings yet.</p>}
      </div>

      <h2 className="mt-10 font-display text-2xl">Recent sales</h2>
      <div className="mt-4 space-y-3">
        {sales.slice(0, 10).map((sale) => (
          <div key={sale.id} className="glass-panel flex items-center justify-between rounded-3xl p-5">
            <span>{sale.title}</span>
            <span className="text-sm text-muted-foreground">×{sale.quantity}</span>
            <span className="text-primary">{currency(Number(sale.unit_price) * sale.quantity)}</span>
          </div>
        ))}
        {sales.length === 0 && <p className="text-muted-foreground">No sales yet.</p>}
      </div>
    </div>
  );
}
