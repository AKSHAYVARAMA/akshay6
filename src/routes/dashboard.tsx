import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — ReMarket" },
      { name: "description", content: "Manage your ReMarket profile, orders, listings, wishlist and notifications." },
      { property: "og:title", content: "Your dashboard — ReMarket" },
      { property: "og:description", content: "Manage your ReMarket profile, orders, listings and wishlist." },
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

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
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
    const { error } = await supabase.from("user_roles").insert({ user_id: user!.id, role: "seller" });
    if (error) {
      toast.error("Seller access is granted by an admin. Ask an admin to upgrade your account.");
      return;
    }
    toast.success("You're a seller now!");
    void queryClient.invalidateQueries();
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Hello, {profile?.full_name ?? "there"}</h1>
      <p className="mt-1 text-muted-foreground">Roles: {roles.join(", ") || "buyer"}</p>

      <Tabs defaultValue="profile" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="profile">My profile</TabsTrigger>
          <TabsTrigger value="orders">My orders</TabsTrigger>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
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
                <Button variant="secondary" className="rounded-full" onClick={() => void becomeSeller()}>
                  Become a seller
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to="/orders/$id"
              params={{ id: order.id }}
              className="glass-panel flex items-center justify-between rounded-3xl p-5"
            >
              <span className="font-display text-lg">#{order.id.slice(0, 8)}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{order.status}</span>
              <span className="font-display text-lg text-primary">{currency(Number(order.total))}</span>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-muted-foreground">No purchases yet.</p>}
        </TabsContent>

        <TabsContent value="listings" className="mt-6 space-y-3">
          <Button asChild className="sunset-gradient rounded-full border-0 text-primary-foreground">
            <Link to="/listings/new">List a new item</Link>
          </Button>
          {listings.map((listing) => (
            <div key={listing.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
              <span className="font-display text-lg">{listing.title}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{listing.status}</span>
              <span className="text-primary">{currency(Number(listing.price))}</span>
              <Button asChild size="sm" variant="secondary" className="rounded-full">
                <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                  Edit
                </Link>
              </Button>
            </div>
          ))}
          {listings.length === 0 && <p className="text-muted-foreground">You haven't listed anything yet.</p>}
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
