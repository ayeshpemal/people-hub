import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compression";
import { requireUserId } from "@/lib/auth";

const BUCKET = "avatars";
const URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 years

/** Pull the object path out of a public or signed avatars URL. */
export function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    const marker = `/${BUCKET}/`;
    const at = pathname.indexOf(marker);
    if (at === -1) return null;
    const path = decodeURIComponent(pathname.slice(at + marker.length));
    return path || null;
  } catch {
    return null;
  }
}

async function removeStoredImage(url: string | null): Promise<void> {
  const path = storagePathFromUrl(url);
  if (!path) return;
  // A missing object should never block the profile change.
  await supabase.storage.from(BUCKET).remove([path]);
}

async function uploadCompressed(image: File): Promise<string> {
  const user_id = await requireUserId();
  const compressed = await compressImage(image);
  const path = `${user_id}/${crypto.randomUUID()}.${compressed.type === "image/webp" ? "webp" : "jpg"}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed.file, {
    contentType: compressed.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, URL_TTL_SECONDS);
  if (signError) throw signError;
  return signed.signedUrl;
}

export interface UpdatePersonInput {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  tagIds: string[];
  /** A freshly picked file, or null to keep the current photo. */
  newImage: File | null;
  currentImageUrl: string | null;
}

export async function updatePerson({
  id,
  name,
  description,
  categoryId,
  tagIds,
  newImage,
  currentImageUrl,
}: UpdatePersonInput): Promise<{ imageUrl: string | null }> {
  await requireUserId();
  let imageUrl = currentImageUrl;

  if (newImage) {
    imageUrl = await uploadCompressed(newImage);
    // Only drop the old file once the new one is safely stored.
    await removeStoredImage(currentImageUrl);
  }

  const { error: updateError } = await supabase
    .from("people")
    .update({
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      image_url: imageUrl,
    })
    .eq("id", id);
  if (updateError) throw updateError;

  const { error: clearError } = await supabase.from("person_tags").delete().eq("person_id", id);
  if (clearError) throw clearError;

  if (tagIds.length > 0) {
    const { error: linkError } = await supabase
      .from("person_tags")
      .insert(tagIds.map((tag_id) => ({ person_id: id, tag_id })));
    if (linkError) throw linkError;
  }

  return { imageUrl };
}

export async function deletePerson(id: string, imageUrl: string | null): Promise<void> {
  await removeStoredImage(imageUrl);
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw error;
}
