import { supabase } from "@/integrations/supabase/client";
import type { Category, Tag } from "@/lib/directory";
import { requireUserId } from "@/lib/auth";

export type TaxonomyKind = "categories" | "tags";
export type TaxonomyItem = Category | Tag;

export const MAX_NAME_LENGTH = 30;

/** Trim + validate a name locally, and reject case-insensitive duplicates. */
export function validateName(
  raw: string,
  existing: TaxonomyItem[],
  ignoreId?: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Please enter a name." };
  if (name.length > MAX_NAME_LENGTH)
    return { ok: false, error: `Keep it to ${MAX_NAME_LENGTH} characters or fewer.` };

  const clash = existing.some(
    (item) => item.id !== ignoreId && item.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (clash) return { ok: false, error: `"${name}" already exists.` };

  return { ok: true, name };
}

export async function createTaxonomyItem(kind: TaxonomyKind, name: string): Promise<TaxonomyItem> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from(kind)
    .insert({ name, user_id })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function renameTaxonomyItem(
  kind: TaxonomyKind,
  id: string,
  name: string,
): Promise<TaxonomyItem> {
  await requireUserId();
  const { data, error } = await supabase
    .from(kind)
    .update({ name })
    .eq("id", id)
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, id: string): Promise<void> {
  await requireUserId();
  const { error } = await supabase.from(kind).delete().eq("id", id);
  if (error) throw error;
}

/** How many profiles a category or tag is currently attached to. */
export async function fetchUsageCounts(kind: TaxonomyKind): Promise<Record<string, number>> {
  await requireUserId();
  const counts: Record<string, number> = {};
  if (kind === "categories") {
    const { data, error } = await supabase
      .from("people")
      .select("category_id")
      .not("category_id", "is", null);
    if (error) throw error;
    for (const row of data ?? []) {
      const key = row.category_id as string;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  } else {
    const { data, error } = await supabase.from("person_tags").select("tag_id");
    if (error) throw error;
    for (const row of data ?? []) {
      const key = row.tag_id as string;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

/** Tags are lowercased, categories are Title Cased; whitespace always collapsed. */
export function normalizeName(kind: TaxonomyKind, raw: string): string {
  const base = raw.trim().replace(/\s+/g, " ");
  if (kind === "tags") return base.toLowerCase();
  return base
    .split(" ")
    .map((word) =>
      word.length <= 1
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/**
 * Normalize, then reuse an existing row (case-insensitive) instead of hitting a
 * unique-constraint error. Only inserts when nothing matches.
 */
export async function findOrCreateTaxonomyItem(
  kind: TaxonomyKind,
  raw: string,
): Promise<TaxonomyItem> {
  const user_id = await requireUserId();
  const name = normalizeName(kind, raw);
  if (!name) throw new Error("Please enter a name.");
  if (name.length > MAX_NAME_LENGTH)
    throw new Error(`Keep it to ${MAX_NAME_LENGTH} characters or fewer.`);

  const { data: existing, error: lookupError } = await supabase
    .from(kind)
    .select("id, name")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from(kind)
    .insert({ name, user_id })
    .select("id, name")
    .single();
  if (error) {
    // Lost a race with another insert — fall back to the existing row.
    const { data: raced } = await supabase
      .from(kind)
      .select("id, name")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();
    if (raced) return raced;
    throw error;
  }
  return data;
}
