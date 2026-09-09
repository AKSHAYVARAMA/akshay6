-- Remove commerce tables
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;

-- Condition: add refurbished
ALTER TYPE public.product_condition ADD VALUE IF NOT EXISTS 'refurbished';

-- Listing fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS item_age text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS negotiable boolean NOT NULL DEFAULT true;

ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'approved';
UPDATE public.products SET status = 'approved' WHERE status = 'pending';

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_insert_own ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_read ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY reports_admin_update ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY reports_admin_delete ON public.reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));