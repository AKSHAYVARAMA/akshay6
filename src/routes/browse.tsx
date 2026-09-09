import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { CONDITIONS, CURRENCIES, fetchCategories, fetchProducts } from "@/lib/marketplace";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  cur: z.enum(CURRENCIES).optional(),
  loc: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse listings — ReMarket" },
      {
        name: "description",
        content:
          "Search new, used and refurbished listings on ReMarket with filters for category, condition, price, currency and location.",
      },
      { property: "og:title", content: "Browse listings — ReMarket" },
      {
        property: "og:description",
        content: "Filter new, used and refurbished listings by category, condition, price and location.",
      },
    ],
  }),
  component: Browse,
});

const inputClass = "rounded-full border border-border bg-input px-4 py-2 text-sm outline-none";

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
        minPrice: search.min ?? null,
        maxPrice: search.max ?? null,
        currency: search.cur ?? null,
        location: search.loc ?? null,
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
          className={`min-w-52 flex-1 ${inputClass}`}
        />
        <input
          defaultValue={search.loc ?? ""}
          onChange={(event) => update({ loc: event.target.value || undefined })}
          placeholder="Location"
          aria-label="Location"
          className={`w-36 ${inputClass}`}
        />
        <select
          value={search.category ?? ""}
          onChange={(event) => update({ category: event.target.value || undefined })}
          aria-label="Category"
          className={inputClass}
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
          onChange={(event) =>
            update({ condition: (event.target.value || undefined) as z.infer<typeof searchSchema>["condition"] })
          }
          aria-label="Condition"
          className={inputClass}
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((condition) => (
            <option key={condition.value} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
        <select
          value={search.cur ?? ""}
          onChange={(event) =>
            update({ cur: (event.target.value || undefined) as z.infer<typeof searchSchema>["cur"] })
          }
          aria-label="Currency"
          className={inputClass}
        >
          <option value="">Any currency</option>
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          type="number"
          defaultValue={search.min ?? ""}
          onChange={(event) => update({ min: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Min price"
          aria-label="Minimum price"
          className={`w-28 ${inputClass}`}
        />
        <input
          type="number"
          defaultValue={search.max ?? ""}
          onChange={(event) => update({ max: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Max price"
          aria-label="Maximum price"
          className={`w-28 ${inputClass}`}
        />
        <select
          value={search.sort ?? "newest"}
          onChange={(event) => update({ sort: event.target.value as "newest" | "price_asc" | "price_desc" })}
          aria-label="Sort"
          className={inputClass}
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
