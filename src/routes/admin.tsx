import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { currency, fetchCategories, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — ReMarket" },
      { name: "description", content: "Moderate listings, manage users, categories and orders on ReMarket." },
      { property: "og:title", content: "Admin panel — ReMarket" },
      { property: "og:description", content: "Moderate listings, manage users, categories and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth role="admin">
      <AdminPanel />
    </RequireAuth>
  ),
});

function AdminPanel() {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, city, store_name");
      return data ?? [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Listing ${status}`);
    void queryClient.invalidateQueries();
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (name.length < 2) {
      toast.error("Enter a category name");
      return;
    }
    const { error } = await supabase
      .from("categories")
      .insert({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), emoji: "🏷️" });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewCategory("");
    toast.success("Category added");
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Admin panel</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", String(users.length)],
          ["Listings", String(products.length)],
          ["Orders", String(orders.length)],
          ["Gross revenue", currency(revenue)],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="moderation" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-6 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
              <span className="font-display text-lg">{product.title}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{product.status}</span>
              <span className="text-primary">{currency(Number(product.price))}</span>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => void setStatus(product.id, "approved")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => void setStatus(product.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-3">
          {users.map((profile) => (
            <div key={profile.id} className="glass-panel flex items-center justify-between rounded-3xl p-5">
              <span>{profile.full_name ?? "Unnamed member"}</span>
              <span className="text-sm text-muted-foreground">{profile.store_name ?? profile.city ?? "—"}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel flex items-center justify-between rounded-3xl p-5">
              <span>#{order.id.slice(0, 8)}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">{order.status}</span>
              <span className="text-primary">{currency(Number(order.total))}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="glass-panel max-w-lg rounded-3xl p-5">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                maxLength={50}
                placeholder="New category name"
                onChange={(event) => setNewCategory(event.target.value)}
              />
              <Button
                onClick={() => void addCategory()}
                className="sunset-gradient rounded-full border-0 text-primary-foreground"
              >
                Add
              </Button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  {category.emoji} {category.name}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
