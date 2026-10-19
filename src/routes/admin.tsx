import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, money, type Product } from "@/lib/marketplace";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — ReMarket" },
      { name: "description", content: "Moderate listings, review reports, manage members and categories on ReMarket." },
      { property: "og:title", content: "Admin panel — ReMarket" },
      { property: "og:description", content: "Moderate listings, review reports, manage members and categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth role="admin">
      <AdminPanel />
    </RequireAuth>
  ),
});

interface ReportRow {
  id: string;
  product_id: string;
  reason: string;
  details: string;
  resolved: boolean;
  created_at: string;
}

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

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      return (data ?? []) as ReportRow[];
    },
  });

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Listing restored" : "Listing taken down");
    void queryClient.invalidateQueries();
  };

  const resolveReport = async (id: string) => {
    const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report closed");
    void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
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

  const openReports = reports.filter((report) => !report.resolved).length;

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Admin panel</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Members", String(users.length)],
          ["Listings", String(products.length)],
          ["Live listings", String(products.filter((p) => p.status === "approved").length)],
          ["Open reports", String(openReports)],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="moderation" className="mt-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="moderation">Listings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="users">Members</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-6 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
              <Link to="/product/$id" params={{ id: product.id }} className="font-display text-lg hover:underline">
                {product.title}
              </Link>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">
                {product.status === "approved" ? "live" : product.status}
              </span>
              <span className="text-primary">{money(Number(product.price), product.currency)}</span>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => void setStatus(product.id, "approved")}>
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => void setStatus(product.id, "rejected")}
                >
                  Take down
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
              <div>
                <p className="font-semibold">{report.reason}</p>
                <p className="text-sm text-muted-foreground">{report.details || "No extra details"}</p>
              </div>
              <Link
                to="/product/$id"
                params={{ id: report.product_id }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View listing →
              </Link>
              {report.resolved ? (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">closed</span>
              ) : (
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void resolveReport(report.id)}>
                  Mark reviewed
                </Button>
              )}
            </div>
          ))}
          {reports.length === 0 && <p className="text-muted-foreground">No reports yet.</p>}
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-3">
          {users.map((profile) => (
            <div key={profile.id} className="glass-panel flex items-center justify-between rounded-3xl p-5">
              <span>{profile.full_name ?? "Unnamed member"}</span>
              <span className="text-sm text-muted-foreground">{profile.store_name ?? profile.city ?? "—"}</span>
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
