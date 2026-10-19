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
import { ListingPhotoPicker } from "@/components/listing-photo-picker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CONDITIONS, CURRENCIES, fetchCategories, type Condition } from "@/lib/marketplace";
import { removeListingPhotos, uploadListingPhotos } from "@/lib/listing-photos";

export const Route = createFileRoute("/listings/new")({
  head: () => ({
    meta: [
      { title: "Post an ad — ReMarket" },
      { name: "description", content: "Post a free ad on ReMarket and sell new, used or refurbished items fast." },
      { property: "og:title", content: "Post an ad — ReMarket" },
      { property: "og:description", content: "Post a free ad and sell new, used or refurbished items fast." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  price: z.number().positive("Enter a price").max(100_000_000),
  location: z.string().trim().min(2, "Where is the item?").max(100),
  item_age: z.string().trim().max(60),
});

function NewListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [busy, setBusy] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "INR",
    location: "",
    item_age: "",
    negotiable: true,
    condition: "used" as Condition,
    categoryId: "",
  });

  const submit = async () => {
    const parsed = listingSchema.safeParse({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      location: form.location,
      item_age: form.item_age,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your listing");
      return;
    }
    if (!user) {
      toast.error("Sign in to post an ad.");
      return;
    }
    if (photoFiles.length === 0) {
      toast.error("Add at least one photo of your item.");
      return;
    }
    setBusy(true);
    let uploadedImages: string[] = [];
    try {
      uploadedImages = await uploadListingPhotos(user.id, photoFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photos could not be uploaded.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("products").insert({
      seller_id: user.id,
      seller_name: profile?.store_name || profile?.full_name || "ReMarket seller",
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      currency: form.currency,
      item_age: parsed.data.item_age,
      negotiable: form.negotiable,
      location: parsed.data.location,
      condition: form.condition,
      category_id: form.categoryId || null,
      images: uploadedImages,
      status: "approved",
    });
    setBusy(false);
    if (error) {
      await removeListingPhotos(user.id, uploadedImages).catch(() => undefined);
      toast.error(error.message);
      return;
    }
    toast.success("Your ad is live!");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Post an ad</h1>
      <p className="mt-2 text-muted-foreground">
        Buyers contact you in chat, you agree a price, then meet and complete the deal in person.
      </p>
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
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              maxLength={100}
              placeholder="City or area"
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item_age">Age / usage (for used and refurbished items)</Label>
            <Input
              id="item_age"
              value={form.item_age}
              maxLength={60}
              placeholder="e.g. 2 years old, lightly used"
              onChange={(event) => setForm({ ...form, item_age: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Condition</Label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((condition) => (
              <Button
                key={condition.value}
                type="button"
                variant={form.condition === condition.value ? "default" : "secondary"}
                className="rounded-full"
                onClick={() => setForm({ ...form, condition: condition.value })}
              >
                {condition.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Negotiable", value: true },
            { label: "Fixed price", value: false },
          ].map((option) => (
            <Button
              key={option.label}
              type="button"
              variant={form.negotiable === option.value ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => setForm({ ...form, negotiable: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <ListingPhotoPicker images={[]} onImagesChange={() => undefined} files={photoFiles} onFilesChange={setPhotoFiles} />
        <Button
          disabled={busy || photoFiles.length === 0}
          onClick={() => void submit()}
          className="sunset-gradient w-full rounded-full border-0 text-primary-foreground"
        >
          Publish ad
        </Button>
      </div>
    </div>
  );
}
