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
import { ListingPhotoPicker } from "@/components/listing-photo-picker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CONDITIONS, CURRENCIES, type Condition, type Product } from "@/lib/marketplace";
import { removeListingPhotos, uploadListingPhotos } from "@/lib/listing-photos";

export const Route = createFileRoute("/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit ad — ReMarket" },
      { name: "description", content: "Update the price, description, condition and location of your ReMarket ad." },
      { property: "og:title", content: "Edit ad — ReMarket" },
      { property: "og:description", content: "Update the price, description, condition and location of your ad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  title: z.string().trim().min(4, "Title is too short").max(120),
  description: z.string().trim().min(10, "Description is too short").max(2000),
  price: z.number().positive("Enter a price").max(100_000_000),
  location: z.string().trim().min(2, "Where is the item?").max(100),
  item_age: z.string().trim().max(60),
});

function EditListing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const { data: product } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      return data as Product | null;
    },
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "INR",
    location: "",
    item_age: "",
    negotiable: true,
    condition: "used" as Condition,
  });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description ?? "",
        price: String(product.price),
        currency: product.currency ?? "INR",
        location: product.location ?? "",
        item_age: product.item_age ?? "",
        negotiable: product.negotiable ?? true,
        condition: product.condition,
      });
      setExistingImages(product.images ?? []);
    }
  }, [product]);

  const save = async () => {
    const parsed = editSchema.safeParse({
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
      toast.error("Sign in to update this ad.");
      return;
    }
    let uploadedImages: string[] = [];
    try {
      uploadedImages = await uploadListingPhotos(user.id, photoFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photos could not be uploaded.");
      return;
    }
    const nextImages = [...existingImages, ...uploadedImages];
    const { error } = await supabase
      .from("products")
      .update({ ...parsed.data, currency: form.currency, negotiable: form.negotiable, condition: form.condition, images: nextImages })
      .eq("id", id)
      .eq("seller_id", user.id);
    if (error) {
      await removeListingPhotos(user.id, uploadedImages).catch(() => undefined);
      toast.error(error.message);
      return;
    }
    const removedImages = (product?.images ?? []).filter((image) => !nextImages.includes(image));
    await removeListingPhotos(user.id, removedImages).catch(() => undefined);
    toast.success("Ad updated");
    void navigate({ to: "/dashboard" });
  };

  const remove = async () => {
    if (!user) {
      toast.error("Sign in to delete this ad.");
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", id).eq("seller_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await removeListingPhotos(user.id, product?.images ?? []).catch(() => undefined);
    toast.success("Ad deleted");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Edit ad</h1>
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
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item_age">Age / usage</Label>
            <Input
              id="item_age"
              value={form.item_age}
              maxLength={60}
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
        <ListingPhotoPicker images={existingImages} onImagesChange={setExistingImages} files={photoFiles} onFilesChange={setPhotoFiles} />
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
        <div className="flex gap-2">
          <Button onClick={() => void save()} className="sunset-gradient rounded-full border-0 text-primary-foreground">
            Save changes
          </Button>
          <Button variant="destructive" className="rounded-full" onClick={() => void remove()}>
            Delete ad
          </Button>
        </div>
      </div>
    </div>
  );
}
