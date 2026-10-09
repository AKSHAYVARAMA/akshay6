import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { MarketplaceImage } from "@/components/marketplace-image";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { money, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your account — ReMarket" },
      {
        name: "description",
        content: "Manage your ReMarket profile, listings, favourites and notifications.",
      },
      { property: "og:title", content: "Your account — ReMarket" },
      {
        property: "og:description",
        content: "Manage your ReMarket profile, listings and favourites.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  store_name: z.string().trim().max(100),
  bio: z.string().trim().max(500),
  avatar_url: z.string().trim().max(500),
});

function Dashboard() {
  const { user, profile, roles, refreshProfile, isSeller } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    store_name: profile?.store_name ?? "",
    bio: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wishlists").select("product:products(*)");
      return (data ?? []).map((row) => row.product).filter(Boolean) as unknown as Product[];
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["recently-viewed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("recently_viewed")
        .select("product:products(*)")
        .order("viewed_at", { ascending: false })
        .limit(4);
      return (data ?? []).map((row) => row.product).filter(Boolean) as unknown as Product[];
    },
  });

  const updateListingStatus = async (id: string, status: "approved" | "sold") => {
    const { error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", id)
      .eq("seller_id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "sold" ? "Listing marked as sold" : "Listing is live again");
    await queryClient.invalidateQueries({ queryKey: ["my-listings", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing deleted");
    await queryClient.invalidateQueries({ queryKey: ["my-listings", user?.id] });
  };

  const saveProfile = async () => {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
  };

  const becomeSeller = async () => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user!.id, role: "seller" });
    if (error) {
      toast.error("Seller access is granted by an admin. Ask an admin to upgrade your account.");
      return;
    }
    toast.success("You're a seller now!");
    void queryClient.invalidateQueries();
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">
        Hello, {profile?.full_name ?? "there"}
      </h1>
      <p className="mt-1 text-muted-foreground">Roles: {roles.join(", ") || "buyer"}</p>

      <Tabs defaultValue="profile" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="profile">My profile</TabsTrigger>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="wishlist">Favourites</TabsTrigger>
          <TabsTrigger value="recent">Recently viewed</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="glass-panel max-w-2xl space-y-4 rounded-3xl p-6">
            {(
              [
                ["full_name", "Full name"],
                ["phone", "Phone"],
                ["address", "Address"],
                ["city", "City"],
                ["store_name", "Store name (sellers)"],
                ["avatar_url", "Profile photo URL"],
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
            <div className="space-y-2">
              <Label htmlFor="bio">About you</Label>
              <Textarea
                id="bio"
                value={form.bio}
                maxLength={500}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void saveProfile()}
                className="sunset-gradient rounded-full border-0 text-primary-foreground"
              >
                Save profile
              </Button>
              {!isSeller && (
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => void becomeSeller()}
                >
                  Become a seller
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4">
            <div>
              <p className="font-bold">Manage your listings</p>
              <p className="text-sm text-muted-foreground">
                Edit details, hide sold items, or remove an ad.
              </p>
            </div>
            <Button asChild className="rounded-xl bg-primary">
              <Link to="/listings/new">Post an ad</Link>
            </Button>
          </div>
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <MarketplaceImage
                src={listing.images[0] ?? ""}
                alt=""
                className="size-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{listing.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{money(Number(listing.price), listing.currency)}</span>
                  <span>·</span>
                  <span>{listing.condition}</span>
                  <span>·</span>
                  <span
                    className={
                      listing.status === "sold"
                        ? "font-bold text-muted-foreground"
                        : "font-bold text-accent"
                    }
                  >
                    {listing.status === "sold"
                      ? "Sold"
                      : listing.status === "approved"
                        ? "Live"
                        : listing.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                    <Pencil className="mr-1 size-3.5" /> Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() =>
                    void updateListingStatus(
                      listing.id,
                      listing.status === "sold" ? "approved" : "sold",
                    )
                  }
                >
                  <CheckCircle2 className="mr-1 size-3.5" />{" "}
                  {listing.status === "sold" ? "Relist" : "Mark sold"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-destructive hover:text-destructive"
                  onClick={() => void deleteListing(listing.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <p className="text-muted-foreground">You haven't listed anything yet.</p>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {wishlist.length === 0 && <p className="text-muted-foreground">Nothing saved yet.</p>}
        </TabsContent>

        <TabsContent value="recent" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {recent.length === 0 && <p className="text-muted-foreground">Nothing viewed yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
