import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { money, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — ReMarket" },
      { name: "description", content: "Track your listings, views and buyer conversations on ReMarket." },
      { property: "og:title", content: "Seller dashboard — ReMarket" },
      { property: "og:description", content: "Track your listings, views and buyer conversations on ReMarket." },
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
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user!.id);
      return { listings: (listings ?? []) as Product[], inquiries: count ?? 0 };
    },
  });

  const listings = data?.listings ?? [];
  const inquiries = data?.inquiries ?? 0;
  const views = listings.reduce((sum, listing) => sum + (listing.views ?? 0), 0);
  const live = listings.filter((l) => l.status === "approved").length;

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-tight">Seller dashboard</h1>
        <Button asChild className="sunset-gradient rounded-full border-0 text-primary-foreground">
          <Link to="/listings/new">Post an ad</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Live ads", String(live)],
          ["Total ads", String(listings.length)],
          ["Listing views", String(views)],
          ["Buyer chats", String(inquiries)],
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
            <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{listing.condition}</span>
            <span className="text-sm text-muted-foreground">{listing.views} views</span>
            <span className="text-primary">{money(Number(listing.price), listing.currency)}</span>
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                Manage
              </Link>
            </Button>
          </div>
        ))}
        {listings.length === 0 && <p className="text-muted-foreground">No listings yet.</p>}
      </div>

      <h2 className="mt-10 font-display text-2xl">Buyer messages</h2>
      <p className="mt-2 text-muted-foreground">
        All negotiation happens in chat.{" "}
        <Link to="/messages" className="font-semibold text-primary hover:underline">
          Open your chat inbox →
        </Link>
      </p>
    </div>
  );
}
