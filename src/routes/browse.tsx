import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { fetchCategories, fetchProducts } from "@/lib/marketplace";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  condition: z.enum(["new", "used"]).optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse listings — ReMarket" },
      {
        name: "description",
        content: "Search thousands of new and used listings on ReMarket with filters for category, condition and price.",
      },
      { property: "og:title", content: "Browse listings — ReMarket" },
      { property: "og:description", content: "Filter new and used marketplace listings by category, condition and price." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const categoryId = categories.find((category) => category.slug === search.category)?.id ?? null;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "browse", search, categoryId],
    queryFn: () =>
      fetchProducts({
        search: search.q,
        categoryId,
        condition: search.condition ?? null,
        maxPrice: search.max ?? null,
        sort: search.sort ?? "newest",
      }),
  });

  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Browse the market</h1>
      <p className="mt-2 text-muted-foreground">
        {isLoading ? "Loading listings…" : `${products.length} listings match your filters`}
      </p>

      <div className="glass-panel mt-6 flex flex-wrap items-center gap-2 rounded-3xl p-4">
        <input
          defaultValue={search.q ?? ""}
          onChange={(event) => update({ q: event.target.value || undefined })}
          placeholder="Search listings…"
          aria-label="Search listings"
          className="min-w-52 flex-1 rounded-full border border-border bg-input px-4 py-2 text-sm outline-none"
        />
        <select
          value={search.category ?? ""}
          onChange={(event) => update({ category: event.target.value || undefined })}
          aria-label="Category"
          className="rounded-full border border-border bg-input px-4 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={search.condition ?? ""}
          onChange={(event) => update({ condition: (event.target.value || undefined) as "new" | "used" | undefined })}
          aria-label="Condition"
          className="rounded-full border border-border bg-input px-4 py-2 text-sm"
        >
          <option value="">Any condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <select
          value={search.sort ?? "newest"}
          onChange={(event) => update({ sort: event.target.value as "newest" | "price_asc" | "price_desc" })}
          aria-label="Sort"
          className="rounded-full border border-border bg-input px-4 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {!isLoading && products.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">No listings found. Try widening your filters.</p>
      )}
    </div>
  );
}
