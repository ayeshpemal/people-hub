import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compression";
import { requireUserId } from "@/lib/auth";

const BUCKET = "avatars";
const URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 years

export interface NewPersonInput {
  name: string;
  description: string;
  categoryId: string | null;
  tagIds: string[];
  image: File | null;
}

export async function createPerson({
  name,
  description,
  categoryId,
  tagIds,
  image,
}: NewPersonInput): Promise<{ id: string }> {
  const user_id = await requireUserId();
  let imageUrl: string | null = null;

  if (image) {
    const compressed = await compressImage(image);
    const path = `${user_id}/${crypto.randomUUID()}.${compressed.type === "image/webp" ? "webp" : "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed.file, {
        contentType: compressed.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, URL_TTL_SECONDS);
    if (signError) throw signError;
    imageUrl = signed?.signedUrl ?? null;
  }

  const { data: person, error: insertError } = await supabase
    .from("people")
    .insert({
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      image_url: imageUrl,
      user_id,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("person_tags")
      .insert(tagIds.map((tag_id) => ({ person_id: person.id, tag_id })));
    if (tagError) throw tagError;
  }

  return { id: person.id };
}
