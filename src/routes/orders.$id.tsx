import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/marketplace";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details & invoice — ReMarket" },
      { name: "description", content: "View your ReMarket order invoice and delivery status." },
      { property: "og:title", content: "Order details — ReMarket" },
      { property: "og:description", content: "View your ReMarket order invoice and delivery status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  ),
});

const steps = ["pending", "paid", "shipped", "delivered"];

function OrderDetail() {
  const { id } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
      return { order, items: items ?? [] };
    },
  });

  const order = data?.order;
  if (!order) return <div className="px-6 py-20 text-center text-muted-foreground">Loading order…</div>;

  const stepIndex = steps.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invoice</p>
            <h1 className="font-display text-3xl">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Button variant="secondary" className="rounded-full" onClick={() => window.print()}>
            Print invoice
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                index <= stepIndex ? "sunset-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {step}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-lg">Delivery to</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.ship_name}
              <br />
              {order.ship_address}
              <br />
              {order.ship_city}
              <br />
              {order.ship_phone}
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg">Items</h2>
            <div className="mt-2 space-y-2 text-sm">
              {(data?.items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.quantity} × {item.title}
                  </span>
                  <span>{currency(Number(item.unit_price) * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between border-t border-border pt-4 font-display text-2xl">
          <span>Total paid</span>
          <span className="text-primary">{currency(Number(order.total))}</span>
        </div>
      </div>
    </div>
  );
}
