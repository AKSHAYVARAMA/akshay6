import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/marketplace";

export const Route = createFileRoute("/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing — ReMarket" },
      { name: "description", content: "Update the price, description and stock of your ReMarket listing." },
      { property: "og:title", content: "Edit listing — ReMarket" },
      { property: "og:description", content: "Update the price, description and stock of your ReMarket listing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EditListing />
    </RequireAuth>
  ),
});

const editSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(2000),
  price: z.number().positive().max(10_000_000),
  stock: z.number().int().min(0).max(9999),
});

function EditListing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: product } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      return data as Product | null;
    },
  });

  const [form, setForm] = useState({ title: "", description: "", price: "", stock: "" });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description ?? "",
        price: String(product.price),
        stock: String(product.stock),
      });
    }
  }, [product]);

  const save = async () => {
    const parsed = editSchema.safeParse({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your listing");
      return;
    }
    const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing updated");
    void navigate({ to: "/dashboard" });
  };

  const remove = async () => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing deleted");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Edit listing</h1>
      <div className="glass-panel mt-6 space-y-4 rounded-3xl p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            maxLength={120}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={form.description}
            maxLength={2000}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => void save()}
            className="sunset-gradient rounded-full border-0 text-primary-foreground"
          >
            Save changes
          </Button>
          <Button variant="destructive" className="rounded-full" onClick={() => void remove()}>
            Delete listing
          </Button>
        </div>
      </div>
    </div>
  );
}
