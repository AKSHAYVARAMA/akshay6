import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

export type Condition = "new" | "used" | "refurbished";

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

const LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
};

export interface Product {
  id: string;
  seller_id: string | null;
  seller_name: string;
  title: string;
  description: string;
  category_id: string | null;
  condition: Condition;
  price: number;
  compare_at_price: number | null;
  currency: string;
  item_age: string;
  negotiable: boolean;
  stock: number;
  location: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  views: number;
  created_at: string;
}

export const money = (value: number, code = "INR") =>
  new Intl.NumberFormat(LOCALES[code] ?? "en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface ProductFilters {
  search?: string | undefined;
  categoryId?: string | null | undefined;
  condition?: Condition | null | undefined;
  minPrice?: number | null | undefined;
  maxPrice?: number | null | undefined;
  currency?: string | null | undefined;
  location?: string | null | undefined;
  featured?: boolean | undefined;
  limit?: number | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | undefined;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from("products").select("*").eq("status", "approved");

  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.currency) query = query.eq("currency", filters.currency);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.featured) query = query.eq("featured", true);

  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Product | null) ?? null;
}

export const conditionClass = (condition: Condition) =>
  condition === "new"
    ? "bg-accent text-accent-foreground"
    : condition === "refurbished"
      ? "bg-primary text-primary-foreground"
      : "bg-gold text-ink";
