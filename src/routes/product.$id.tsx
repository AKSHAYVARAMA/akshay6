import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flag, Heart, MapPin, MessageCircle, Scale } from "lucide-react";
import { toast } from "sonner";

import { ProductCard } from "@/components/product-card";
import { MarketplaceImage } from "@/components/marketplace-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { conditionClass, fetchProduct, fetchProducts, money } from "@/lib/marketplace";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Listing details — ReMarket" },
      { name: "description", content: "View photos, price, condition and seller details for this ReMarket listing." },
      { property: "og:title", content: "Listing details — ReMarket" },
      { property: "og:description", content: "View photos, price, condition and seller details for this listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

const REPORT_REASONS = ["Scam or fraud", "Prohibited item", "Wrong category", "Spam or duplicate", "Offensive content"];

function ProductPage() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]!);
  const [reportDetails, setReportDetails] = useState("");

  const { data: product, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id) });

  const { data: seller } = useQuery({
    queryKey: ["seller-profile", product?.seller_id],
    enabled: !!product?.seller_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, store_name, city, bio, avatar_url, created_at")
        .eq("id", product!.seller_id!)
        .maybeSingle();
      return data;
    },
  });

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
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Sign in to message the seller.");
      if (!product?.seller_id) throw new Error("This demo listing has no seller inbox.");
      if (product.seller_id === user.id) throw new Error("This is your own listing.");
      if (!body.trim()) throw new Error("Write a message first.");
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
        .insert({ conversation_id: conversation.id, sender_id: user.id, body: body.trim().slice(0, 2000) });
      if (messageError) throw messageError;
    },
    onSuccess: () => {
      setMessage("");
      toast.success("Message sent — continue in your chat inbox");
      void navigate({ to: "/messages" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report a listing.");
      const { error } = await supabase.from("reports").insert({
        product_id: id,
        reporter_id: user.id,
        reason: reportReason,
        details: reportDetails.trim().slice(0, 1000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReportOpen(false);
      setReportDetails("");
      toast.success("Thanks — our team will review this listing.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveWishlist = async () => {
    if (!user) {
      toast.error("Sign in to save items.");
      return;
    }
    await supabase.from("wishlists").upsert({ user_id: user.id, product_id: id }, { onConflict: "user_id,product_id" });
    toast.success("Saved to favourites");
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
            <MarketplaceImage
              src={product.images[0] ?? ""}
              alt={product.title}
              width={1024}
              height={1024}
              className="aspect-square w-full rounded-2xl bg-muted object-cover"
            />
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image) => (
                  <MarketplaceImage
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

          <div className="glass-panel mt-5 rounded-3xl p-6">
            <h2 className="font-display text-xl">How buying works here</h2>
            <ol className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-5">
              {["Chat", "Negotiate", "Meet", "Inspect", "Pay in person"].map((step, index) => (
                <li key={step} className="rounded-2xl border border-border bg-secondary p-3">
                  <span className="font-display text-lg text-foreground">{index + 1}</span>
                  <p className="mt-1 font-semibold text-foreground">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              ReMarket never handles payments. Always meet in a public place and inspect the item before paying.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${conditionClass(product.condition)}`}>
              {product.condition.toUpperCase()}
            </span>
            <h1 className="mt-4 font-display text-3xl tracking-tight">{product.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {product.location || "Location not set"}
            </p>
            <p className="sunset-text mt-4 font-display text-4xl font-semibold">
              {money(product.price, product.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {product.negotiable ? "Price negotiable — make an offer in chat" : "Fixed price"}
            </p>

            <dl className="mt-5 space-y-1.5 text-sm">
              {product.item_age && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Age / usage</dt>
                  <dd>{product.item_age}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Currency</dt>
                <dd>{product.currency}</dd>
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
                onClick={() => contactSeller.mutate(message || "Hi, is this still available?")}
                className="sunset-gradient flex-1 rounded-full border-0 text-primary-foreground"
              >
                Chat with seller
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={() => void saveWishlist()}>
                <Heart className="size-4" />
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={addToCompare}>
                <Scale className="size-4" />
              </Button>
            </div>

            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="glass-panel mt-5 rounded-3xl p-6">
            <h2 className="font-display text-xl">Seller</h2>
            <p className="mt-2 font-semibold">{seller?.store_name || seller?.full_name || product.seller_name}</p>
            {seller?.city && <p className="text-sm text-muted-foreground">{seller.city}</p>}
            {seller?.bio && <p className="mt-2 text-sm text-muted-foreground">{seller.bio}</p>}
            {seller?.created_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Member since {new Date(seller.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="glass-panel mt-5 rounded-3xl p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <MessageCircle className="size-4" /> Message the seller
            </h2>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              placeholder="Is this still available? Would you take a lower price?"
              className="mt-3"
            />
            <Button
              className="mt-3 w-full rounded-full"
              variant="secondary"
              onClick={() => contactSeller.mutate(message)}
            >
              Send message
            </Button>
          </div>

          <div className="glass-panel mt-5 rounded-3xl p-6">
            <button
              onClick={() => setReportOpen((open) => !open)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <Flag className="size-4" /> Report this listing
            </button>
            {reportOpen && (
              <div className="mt-4 space-y-3">
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  aria-label="Reason for report"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                <Textarea
                  value={reportDetails}
                  maxLength={1000}
                  placeholder="Tell us what's wrong (optional)"
                  onChange={(event) => setReportDetails(event.target.value)}
                />
                <Button variant="destructive" className="w-full rounded-full" onClick={() => submitReport.mutate()}>
                  Submit report
                </Button>
              </div>
            )}
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
            placeholder="Share your experience with this seller"
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
