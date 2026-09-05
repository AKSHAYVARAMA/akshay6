import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { fetchCategories, fetchProducts } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReMarket — Buy Smart. Sell Fast." },
      {
        name: "description",
        content:
          "Shop featured new and used listings on ReMarket: electronics, furniture, fashion, sports and more. List your own item in minutes.",
      },
      { property: "og:title", content: "ReMarket — Buy Smart. Sell Fast." },
      {
        property: "og:description",
        content: "The circular marketplace for new and used goods. Buy with confidence, sell in minutes.",
      },
    ],
  }),
  component: Home,
});

const conditionChips = [
  { label: "All", value: null },
  { label: "New", value: "new" as const },
  { label: "Used", value: "used" as const },
];

function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [condition, setCondition] = useState<"new" | "used" | null>(null);

  const { data: featured = [] } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true, limit: 4 }),
  });
  const { data: latest = [] } = useQuery({
    queryKey: ["products", "latest"],
    queryFn: () => fetchProducts({ limit: 8 }),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const search = () => void navigate({ to: "/browse", search: { q: term || undefined, condition: condition ?? undefined } });

  return (
    <>
      <section className="px-4 pb-6 pt-12 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-secondary px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary" /> {latest.length * 1560} new listings today
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
              New finds,
              <br />
              <span className="sunset-text">previously lived.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              The circular marketplace for new and used goods — list in minutes, negotiate in real time, and ship with
              confidence.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="sunset-gradient rounded-full border-0 text-primary-foreground">
                <Link to="/browse">Browse the market</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/listings/new">Become a seller</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div>
                <p className="font-display text-2xl font-semibold">2.4M</p>
                <p className="text-xs text-muted-foreground">Items rehomed</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-2xl font-semibold">4.9</p>
                <p className="text-xs text-muted-foreground">Avg. rating</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-2xl font-semibold">38k</p>
                <p className="text-xs text-muted-foreground">Active sellers</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-panel rounded-[28px] p-6" style={{ boxShadow: "var(--shadow-panel)" }}>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  search();
                }}
              >
                <input
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="vintage camera, leather bag, e-bike…"
                  aria-label="Search the marketplace"
                  className="flex-1 rounded-2xl border border-border bg-input px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" className="rounded-2xl bg-foreground px-6 py-3.5 text-background hover:bg-foreground/90">
                  Search
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {conditionChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setCondition(chip.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      condition === chip.value
                        ? "border-primary/20 bg-primary/15 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
                {categories.slice(0, 3).map((category) => (
                  <Link
                    key={category.id}
                    to="/browse"
                    search={{ category: category.slug }}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Category", value: categories[0]?.name ?? "Electronics" },
                  { label: "Condition", value: condition ? condition.toUpperCase() : "Any" },
                  { label: "Price", value: "$50 – $900" },
                  { label: "Location", value: "Portland, OR" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-secondary p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Featured this week</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked by our team and trending in your area</p>
          </div>
          <Link to="/browse" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="px-4 py-6 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to="/browse"
              search={{ category: category.slug }}
              className="glass-panel rounded-3xl p-4 transition hover:bg-background/70"
            >
              <div className="text-2xl">{category.emoji}</div>
              <p className="mt-3 font-display text-base">{category.name}</p>
              <p className="text-xs text-muted-foreground">Browse listings</p>
            </Link>
          ))}
          <Link
            to="/browse"
            className="cursor-pointer rounded-3xl border border-primary/30 bg-gradient-to-br from-gold/25 via-primary/20 to-accent/25 p-4 backdrop-blur-xl"
          >
            <div className="text-2xl">✨</div>
            <p className="mt-3 font-display text-base">All categories</p>
            <p className="text-xs text-muted-foreground">Explore everything</p>
          </Link>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Latest listings</h2>
            <p className="mt-1 text-muted-foreground">Fresh drops from sellers across the market</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
