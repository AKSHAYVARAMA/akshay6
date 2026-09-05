import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

export interface Product {
  id: string;
  seller_id: string | null;
  seller_name: string;
  title: string;
  description: string;
  category_id: string | null;
  condition: "new" | "used";
  price: number;
  compare_at_price: number | null;
  stock: number;
  location: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  views: number;
  created_at: string;
}

export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface ProductFilters {
  search?: string | undefined;
  categoryId?: string | null | undefined;
  condition?: "new" | "used" | null | undefined;
  maxPrice?: number | null | undefined;
  featured?: boolean | undefined;
  limit?: number | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | undefined;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from("products").select("*").eq("status", "approved");

  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
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
