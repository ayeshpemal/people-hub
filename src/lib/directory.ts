import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface DirectoryPerson {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
}

export interface PeoplePage {
  people: DirectoryPerson[];
  total: number;
}

export const PAGE_SIZE = 20;

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

interface FetchPeopleOptions {
  categoryId: string | null;
  tagIds: string[];
  search: string;
  limit: number;
}

export async function fetchPeople({
  categoryId,
  tagIds,
  search,
  limit,
}: FetchPeopleOptions): Promise<PeoplePage> {
  // Resolve tag filtering to a set of person ids first so we can keep the
  // main query simple and index-friendly.
  let tagPersonIds: string[] | null = null;
  if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("person_tags")
      .select("person_id")
      .in("tag_id", tagIds);
    if (error) throw error;
    tagPersonIds = [...new Set((data ?? []).map((row) => row.person_id))];
    if (tagPersonIds.length === 0) return { people: [], total: 0 };
  }

  let query = supabase
    .from("people")
    .select("id, name, description, image_url, categories(name), person_tags(tags(name))", {
      count: "exact",
    })
    .order("name")
    .range(0, limit - 1);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
  if (tagPersonIds) query = query.in("id", tagPersonIds);

  const { data, error, count } = await query;
  if (error) throw error;

  const people: DirectoryPerson[] = (data ?? []).map((row) => {
    const categoryJoin = row.categories as unknown as { name: string } | null;
    const tagJoins = (row.person_tags ?? []) as unknown as Array<{
      tags: { name: string } | null;
    }>;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      image_url: row.image_url,
      category: categoryJoin?.name ?? null,
      tags: tagJoins
        .map((pt) => pt.tags?.name)
        .filter((name): name is string => Boolean(name))
        .sort(),
    };
  });

  return { people, total: count ?? 0 };
}
