import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { fetchCategories, fetchProducts, type Condition } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReMarket — Local marketplace, real conversations" },
      {
        name: "description",
        content:
          "Buy new, used and refurbished products near you. Chat with sellers, negotiate and meet offline.",
      },
    ],
  }),
  component: Home,
});

const conditionChips = [
  { label: "All listings", value: null },
  { label: "New", value: "new" as const },
  { label: "Used", value: "used" as const },
  { label: "Refurbished", value: "refurbished" as const },
];

function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [condition, setCondition] = useState<Condition | null>(null);
  const { data: featured = [] } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true, limit: 4 }),
  });
  const { data: latest = [] } = useQuery({
    queryKey: ["products", "latest"],
    queryFn: () => fetchProducts({ limit: 8 }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const search = () =>
    void navigate({
      to: "/browse",
      search: { q: term || undefined, condition: condition ?? undefined },
    });

  return (
    <>
      <section className="hero-grid border-b border-border px-4 pb-14 pt-12 sm:px-8 sm:pt-16">
        <div className="market-section grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> Local marketplace for real people
            </div>
            <h1 className="mt-5 max-w-2xl text-5xl font-extrabold leading-[1.04] sm:text-6xl">
              Buy smart.
              <br />
              <span className="sunset-text">Sell fast.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Find new, used and refurbished products near you. Chat with the seller, negotiate your
              price, meet safely and complete the deal offline.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl bg-primary px-6">
                <Link to="/browse">
                  Browse listings <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-primary text-primary"
              >
                <Link to="/listings/new">Post a free ad</Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" /> Chat before you meet
              </span>
              <span className="flex items-center gap-2">
                <CircleDollarSign className="size-4 text-accent" /> No online payment
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" /> Search near you
              </span>
            </div>
          </div>
          <div className="rounded-3xl bg-[#111827] p-5 text-white shadow-2xl sm:p-7">
            <p className="text-sm font-semibold text-blue-200">What are you looking for?</p>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                search();
              }}
            >
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search phones, bikes, furniture…"
                aria-label="Search the marketplace"
                className="rounded-xl border-0 bg-white px-4 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="lg" className="rounded-xl bg-primary hover:bg-primary/90">
                Search marketplace
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {conditionChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => setCondition(chip.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${condition === chip.value ? "bg-white text-[#111827]" : "bg-white/10 text-white/75 hover:bg-white/20"}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xl font-extrabold">
                  {latest.length ? `${latest.length}+` : "0"}
                </p>
                <p className="text-[11px] text-white/60">fresh listings</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xl font-extrabold">3</p>
                <p className="text-[11px] text-white/60">ways to shop</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xl font-extrabold">₹0</p>
                <p className="text-[11px] text-white/60">online fees</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="market-section px-4 py-10 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/browse"
            search={{ condition: "new" }}
            className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full px-3 py-1 text-xs font-bold condition-new">NEW</span>
              <ArrowRight className="size-5 text-primary transition group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold">Brand-new finds</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Shop unused products from local sellers and small businesses.
            </p>
          </Link>
          <Link
            to="/browse"
            search={{ condition: "used" }}
            className="group rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full px-3 py-1 text-xs font-bold condition-used">USED</span>
              <ArrowRight className="size-5 text-accent transition group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold">Good things, reused</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save money on quality pre-loved products close to home.
            </p>
          </Link>
          <Link
            to="/browse"
            search={{ condition: "refurbished" }}
            className="group rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full px-3 py-1 text-xs font-bold condition-refurbished">
                REFURBISHED
              </span>
              <ArrowRight className="size-5 text-primary transition group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold">Checked and restored</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover repaired products ready for their next owner.
            </p>
          </Link>
        </div>
      </section>

      <section className="market-section px-4 py-4 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Curated for you
            </p>
            <h2 className="mt-1 text-3xl font-extrabold">Featured listings</h2>
          </div>
          <Link
            to="/browse"
            className="hidden items-center gap-1 text-sm font-bold text-primary sm:flex"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="market-section px-4 py-12 sm:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-accent">
                Simple, human transactions
              </p>
              <h2 className="mt-2 text-3xl font-extrabold">Chat. Meet. Deal.</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                There is no online checkout here. Ask questions, negotiate in chat, inspect the item
                in person, then pay offline when you are happy.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-secondary text-primary">
                  <BadgeCheck className="size-5" />
                </div>
                <p className="mt-2 text-xs font-bold">1. Chat</p>
              </div>
              <div>
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-green-50 text-accent">
                  <Handshake className="size-5" />
                </div>
                <p className="mt-2 text-xs font-bold">2. Meet</p>
              </div>
              <div>
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-yellow-50 text-yellow-700">
                  <CircleDollarSign className="size-5" />
                </div>
                <p className="mt-2 text-xs font-bold">3. Pay offline</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="market-section px-4 py-4 sm:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Explore nearby</p>
          <h2 className="mt-1 text-3xl font-extrabold">Browse by category</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to="/browse"
              search={{ category: category.slug }}
              className="rounded-2xl border border-border bg-white p-4 transition hover:border-primary hover:shadow-sm"
            >
              <div className="text-2xl">{category.emoji}</div>
              <p className="mt-3 font-bold">{category.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">View listings</p>
            </Link>
          ))}
          <Link
            to="/browse"
            className="rounded-2xl bg-secondary p-4 text-primary transition hover:bg-blue-100"
          >
            <div className="text-2xl">＋</div>
            <p className="mt-3 font-bold">All categories</p>
            <p className="mt-1 text-xs">Explore everything</p>
          </Link>
        </div>
      </section>

      <section className="market-section px-4 py-12 sm:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Just posted</p>
          <h2 className="mt-1 text-3xl font-extrabold">Latest listings</h2>
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
