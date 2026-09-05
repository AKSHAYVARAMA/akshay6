import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/routes/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/marketplace";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ReMarket" },
      { name: "description", content: "Enter your delivery details and place your ReMarket order." },
      { property: "og:title", content: "Checkout — ReMarket" },
      { property: "og:description", content: "Enter your delivery details and place your ReMarket order." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  ),
});

const shippingSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  address: z.string().trim().min(5, "Enter your street address").max(200),
  city: z.string().trim().min(2, "Enter your city").max(100),
  phone: z.string().trim().min(6, "Enter a contact number").max(30),
});

function CheckoutPage() {
  const { user, profile } = useAuth();
  const { data: items = [] } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: profile?.full_name ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    phone: profile?.phone ?? "",
  });

  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  const placeOrder = async () => {
    const parsed = shippingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    if (!user || items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setBusy(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        total,
        status: "paid",
        ship_name: parsed.data.name,
        ship_address: parsed.data.address,
        ship_city: parsed.data.city,
        ship_phone: parsed.data.phone,
      })
      .select("id")
      .single();

    if (error || !order) {
      setBusy(false);
      toast.error(error?.message ?? "Could not place order");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        seller_id: item.product.seller_id,
        title: item.product.title,
        image: item.product.images[0] ?? null,
        unit_price: item.product.price,
        quantity: item.quantity,
      })),
    );
    if (itemsError) {
      setBusy(false);
      toast.error(itemsError.message);
      return;
    }

    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Order confirmed",
      body: `Your order for ${currency(total)} is being prepared.`,
    });
    setBusy(false);
    void queryClient.invalidateQueries();
    toast.success("Order placed!");
    void navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="glass-panel space-y-4 rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-xl">Delivery details</h2>
          {(
            [
              ["name", "Full name"],
              ["address", "Street address"],
              ["city", "City"],
              ["phone", "Phone number"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                maxLength={200}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Card payments aren't connected yet — orders are placed in test mode for now.
          </p>
        </div>

        <aside className="glass-panel h-fit rounded-3xl p-6">
          <h2 className="font-display text-xl">Your order</h2>
          <div className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.quantity} × {item.product.title}
                </span>
                <span>{currency(Number(item.product.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-display text-xl">
            <span>Total</span>
            <span className="text-primary">{currency(total)}</span>
          </div>
          <Button
            onClick={() => void placeOrder()}
            disabled={busy || items.length === 0}
            className="sunset-gradient mt-5 w-full rounded-full border-0 text-primary-foreground"
          >
            Place order
          </Button>
        </aside>
      </div>
    </div>
  );
}
