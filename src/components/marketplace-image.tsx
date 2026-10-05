import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { LISTING_PHOTO_BUCKET } from "@/lib/listing-photos";

export function MarketplaceImage({
  src,
  alt,
  className,
  loading,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
}) {
  const isDirectUrl = src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");
  const { data: signedUrl } = useQuery({
    queryKey: ["listing-photo-url", src],
    enabled: Boolean(src) && !isDirectUrl,
    staleTime: 55 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(LISTING_PHOTO_BUCKET)
        .createSignedUrl(src, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  const imageUrl = isDirectUrl ? src : signedUrl;
  if (!imageUrl) return <div className={className} role="img" aria-label={alt} />;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading={loading}
      width={width}
      height={height}
    />
  );
}