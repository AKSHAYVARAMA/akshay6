import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from "@/lib/marketplace";

export const Route = createFileRoute("/listings/new")({
  head: () => ({
    meta: [
      { title: "List an item — ReMarket" },
      { name: "description", content: "Create a listing on ReMarket and sell new or used items fast." },
      { property: "og:title", content: "List an item — ReMarket" },
      { property: "og:description", content: "Create a listing on ReMarket and sell new or used items fast." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewListing />
    </RequireAuth>
  ),
});

const listingSchema = z.object({
  title: z.string().trim().min(4, "Give your item a title").max(120),
  description: z.string().trim().min(10, "Describe your item").max(2000),
  price: z.number().positive("Enter a price").max(10_000_000),
  stock: z.number().int().min(1).max(9999),
  location: z.string().trim().min(2, "Where is the item?").max(100),
});

function NewListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "1",
    location: "",
    condition: "used" as "new" | "used",
    categoryId: "",
    images: "",
  });

  const submit = async () => {
    const parsed = listingSchema.safeParse({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      location: form.location,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your listing");
      return;
    }
    setBusy(true);
    const images = form.images
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 6);
    const { error } = await supabase.from("products").insert({
      seller_id: user!.id,
      seller_name: profile?.store_name || profile?.full_name || "ReMarket seller",
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      stock: parsed.data.stock,
      location: parsed.data.location,
      condition: form.condition,
      category_id: form.categoryId || null,
      images: images.length ? images : ["/images/bag.jpg"],
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing submitted for review");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">List an item</h1>
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
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Quantity</Label>
            <Input
              id="stock"
              type="number"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              maxLength={100}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {(["new", "used"] as const).map((condition) => (
            <Button
              key={condition}
              type="button"
              variant={form.condition === condition ? "default" : "secondary"}
              className="rounded-full capitalize"
              onClick={() => setForm({ ...form, condition })}
            >
              {condition}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="images">Image URLs (one per line)</Label>
          <Textarea
            id="images"
            rows={3}
            value={form.images}
            onChange={(event) => setForm({ ...form, images: event.target.value })}
          />
        </div>
        <Button
          disabled={busy}
          onClick={() => void submit()}
          className="sunset-gradient w-full rounded-full border-0 text-primary-foreground"
        >
          Submit for review
        </Button>
      </div>
    </div>
  );
}
