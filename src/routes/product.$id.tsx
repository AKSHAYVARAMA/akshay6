import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Scale } from "lucide-react";
import { toast } from "sonner";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { currency, fetchProduct, fetchProducts } from "@/lib/marketplace";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Listing details — ReMarket" },
      { name: "description", content: "View photos, price, condition and seller details for this ReMarket listing." },
      { property: "og:title", content: "Listing details — ReMarket" },
      { property: "og:description", content: "View photos, price, condition and seller details for this listing." },
    ],
  }),
  component: ProductPage,
});

interface Review {
  id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
}

function ProductPage() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const { data: product, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id) });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, author_name, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Review[];
    },
  });

  const { data: recommended = [] } = useQuery({
    queryKey: ["recommended", product?.category_id],
    enabled: !!product,
    queryFn: () => fetchProducts({ categoryId: product?.category_id ?? null, limit: 4 }),
  });

  useEffect(() => {
    if (!user || !product) return;
    void supabase
      .from("recently_viewed")
      .upsert(
        { user_id: user.id, product_id: product.id, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,product_id" },
      );
  }, [user, product]);

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to add items to your cart.");
      const { error } = await supabase
        .from("cart_items")
        .upsert({ user_id: user.id, product_id: id, quantity: 1 }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to leave a review.");
      if (comment.trim().length === 0) throw new Error("Write a short comment first.");
      const { error } = await supabase.from("reviews").upsert(
        {
          product_id: id,
          user_id: user.id,
          rating,
          comment: comment.trim().slice(0, 1000),
          author_name: profile?.full_name ?? "Buyer",
        },
        { onConflict: "product_id,user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Thanks for your review!");
      void queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const contactSeller = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to message the seller.");
      if (!product?.seller_id) throw new Error("This demo listing has no seller inbox.");
      if (!message.trim()) throw new Error("Write a message first.");
      const { data: conversation, error } = await supabase
        .from("conversations")
        .upsert(
          { product_id: product.id, buyer_id: user.id, seller_id: product.seller_id },
          { onConflict: "product_id,buyer_id,seller_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      const { error: messageError } = await supabase
        .from("messages")
        .insert({ conversation_id: conversation.id, sender_id: user.id, body: message.trim().slice(0, 2000) });
      if (messageError) throw messageError;
    },
    onSuccess: () => {
      setMessage("");
      toast.success("Message sent");
      void navigate({ to: "/messages" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveWishlist = async () => {
    if (!user) { toast.error("Sign in to save items."); return; }
    await supabase.from("wishlists").upsert({ user_id: user.id, product_id: id }, { onConflict: "user_id,product_id" });
    toast.success("Saved to wishlist");
  };

  const addToCompare = () => {
    const stored = JSON.parse(localStorage.getItem("remarket-compare") ?? "[]") as string[];
    const next = Array.from(new Set([...stored, id])).slice(-3);
    localStorage.setItem("remarket-compare", JSON.stringify(next));
    toast.success("Added to comparison");
  };

  if (isLoading) return <div className="px-6 py-20 text-center text-muted-foreground">Loading listing…</div>;
  if (!product) return <div className="px-6 py-20 text-center text-muted-foreground">Listing not found.</div>;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-3">
            <img
              src={product.images[0] ?? "/images/camera.jpg"}
              alt={product.title}
              width={1024}
              height={1024}
              className="aspect-square w-full rounded-2xl bg-muted object-cover"
            />
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt={product.title}
                    loading="lazy"
                    width={256}
                    height={256}
                    className="aspect-square rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                product.condition === "new" ? "bg-accent text-accent-foreground" : "bg-gold text-ink"
              }`}
            >
              {product.condition.toUpperCase()}
            </span>
            <h1 className="mt-4 font-display text-3xl tracking-tight">{product.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.location} · sold by {product.seller_name}
            </p>
            <p className="sunset-text mt-4 font-display text-4xl font-semibold">{currency(product.price)}</p>
            {product.compare_at_price && (
              <p className="text-sm text-muted-foreground line-through">{currency(product.compare_at_price)}</p>
            )}

            <dl className="mt-5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">In stock</dt>
                <dd>{product.stock}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rating</dt>
                <dd>
                  {avgRating} ★ ({reviews.length})
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                onClick={() => addToCart.mutate()}
                className="sunset-gradient flex-1 rounded-full border-0 text-primary-foreground"
              >
                Add to cart
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={() => void saveWishlist()}>
                <Heart className="size-4" />
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={addToCompare}>
                <Scale className="size-4" />
              </Button>
            </div>

            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <div className="glass-panel mt-5 rounded-3xl p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <MessageCircle className="size-4" /> Ask the seller
            </h2>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              placeholder="Is this still available?"
              className="mt-3"
            />
            <Button className="mt-3 w-full rounded-full" variant="secondary" onClick={() => contactSeller.mutate()}>
              Send inquiry
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Reviews &amp; ratings</h2>
        <div className="glass-panel mt-4 rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                aria-label={`Rate ${value} stars`}
                className={`size-9 rounded-full text-sm font-semibold ${
                  value <= rating ? "bg-gold text-ink" : "bg-secondary text-muted-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            placeholder="Share your experience with this item"
            className="mt-3"
          />
          <Button className="mt-3 rounded-full" variant="secondary" onClick={() => submitReview.mutate()}>
            Post review
          </Button>

          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-sm font-semibold">
                  {review.author_name} · {review.rating} ★
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl">You may also like</h2>
          <Link to="/browse" className="text-sm font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recommended
            .filter((item) => item.id !== product.id)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
