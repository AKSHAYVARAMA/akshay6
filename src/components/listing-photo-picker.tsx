import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { MarketplaceImage } from "@/components/marketplace-image";
import { Button } from "@/components/ui/button";
import { MAX_LISTING_PHOTO_SIZE } from "@/lib/listing-photos";

const MAX_PHOTOS = 6;

export function ListingPhotoPicker({
  images,
  onImagesChange,
  files,
  onFilesChange,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const remaining = Math.max(0, MAX_PHOTOS - images.length - files.length);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Photos</p>
          <p className="text-xs text-muted-foreground">Up to 6 photos · 15 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Choose listing photos"
          onChange={(event) => {
            const chosen = Array.from(event.target.files ?? []);
            const tooLarge = chosen.filter((file) => file.size > MAX_LISTING_PHOTO_SIZE);
            if (tooLarge.length) toast.error("Each photo must be 15 MB or smaller.");
            const valid = chosen.filter((file) => file.size <= MAX_LISTING_PHOTO_SIZE);
            if (valid.length > remaining) toast.error("You can add up to 6 photos.");
            onFilesChange([...files, ...valid.slice(0, remaining)]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 size-4" /> Add photos
        </Button>
      </div>
      {(images.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {images.map((image) => (
            <div key={image} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <MarketplaceImage src={image} alt="Listing photo" className="size-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label="Remove photo"
                className="absolute right-1 top-1 size-7"
                onClick={() => onImagesChange(images.filter((item) => item !== image))}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          {previews.map((preview, index) => (
            <div key={`${files[index]?.name ?? "photo"}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <img src={preview} alt={files[index]?.name ?? "Selected photo"} className="size-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label="Remove selected photo"
                className="absolute right-1 top-1 size-7"
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}