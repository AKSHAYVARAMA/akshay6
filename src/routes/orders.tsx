import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/marketplace";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Order history — ReMarket" },
      { name: "description", content: "Track your ReMarket purchases and delivery status." },
      { property: "og:title", content: "Order history — ReMarket" },
      { property: "og:description", content: "Track your ReMarket purchases and delivery status." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrdersPage />
    </RequireAuth>
  ),
});

interface OrderRow {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as OrderRow[];
    },
  });

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Your orders</h1>
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to="/orders/$id"
            params={{ id: order.id }}
            className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5"
          >
            <div>
              <p className="font-display text-lg">Order #{order.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase">{order.status}</span>
            <span className="font-display text-xl text-primary">{currency(Number(order.total))}</span>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}
