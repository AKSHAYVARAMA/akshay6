import { supabase } from "@/integrations/supabase/client";

export const LISTING_PHOTO_BUCKET = "remarket-listing-photos";
export const MAX_LISTING_PHOTO_SIZE = 15 * 1024 * 1024;

export async function uploadListingPhotos(sellerId: string, files: File[]) {
  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${sellerId}/${crypto.randomUUID()}-${safeName}`;
      const { data, error } = await supabase.storage
        .from(LISTING_PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw error;
      uploadedPaths.push(data.path);
    }

    return uploadedPaths;
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(LISTING_PHOTO_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
}

export async function removeListingPhotos(sellerId: string, paths: string[]) {
  const ownedPaths = paths.filter((path) => path.startsWith(`${sellerId}/`));
  if (!ownedPaths.length) return;

  const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).remove(ownedPaths);
  if (error) throw error;
}