import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ChevronDown, Plus, Search, Users } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";


import {
  fetchCategories,
  fetchPeople,
  fetchTags,
  PAGE_SIZE,
} from "@/lib/directory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flock — People Directory" },
      {
        name: "description",
        content:
          "A fast, clean index of the Flock community. Filter by category, search tags, and browse the roster.",
      },
      { property: "og:title", content: "Flock — People Directory" },
      {
        property: "og:description",
        content:
          "A fast, clean index of the Flock community. Filter by category, search tags, and browse the roster.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Debounced so typing doesn't fire a database query per keystroke.
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });
  const { data, isFetching, isPending, isError, error, refetch } = useQuery({
    queryKey: ["people", categoryId, selectedTagIds, debouncedSearch, limit],
    queryFn: () =>
      fetchPeople({
        categoryId,
        tagIds: selectedTagIds,
        search: debouncedSearch,
        limit,
      }),
    placeholderData: keepPreviousData,
  });

  const people = data?.people ?? [];
  const total = data?.total ?? 0;


  const resetPaging = () => setLimit(PAGE_SIZE);

  const toggleTag = (id: string) => {
    resetPaging();
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen bg-silver font-sans text-ink antialiased">
      {/* App bar */}
      <div className="sticky top-0 z-20 bg-silver/85 backdrop-blur-sm ring-1 ring-ink/5">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-[min(1vw,10px)] bg-gradient-to-br from-brand to-pink font-display text-sm font-semibold text-ink-foreground shadow-inner">
              F
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Flock
            </span>
            <span className="mt-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand">
              Directory
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 ring-1 ring-ink/5 sm:flex">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {total} people
              </span>
            </div>
            <Link
              to="/add-person"
              className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-gradient-to-br from-brand to-pink px-3 py-2 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-4 shrink-0" />
              Add person
            </Link>
          </div>
        </div>
      </div>


      {/* Header */}
      <div className="bg-silver">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-5 sm:px-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Find your people
          </h1>
          <p className="mt-2 max-w-[48ch] text-pretty text-base text-muted-foreground">
            A fast, clean index of the Flock community. Filter by category,
            search tags, and browse the roster.
          </p>

          {/* Search */}
          <label className="mt-5 flex items-center gap-2 rounded-[min(1vw,10px)] bg-card px-3 py-2.5 ring-1 ring-ink/5 focus-within:ring-2 focus-within:ring-brand/40">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                resetPaging();
                setSearch(e.target.value);
              }}
              placeholder="Search by name…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-10 bg-silver/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-ink/5 pb-3">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </span>
            <button
              onClick={() => {
                resetPaging();
                setCategoryId(null);
              }}
              className={
                categoryId === null
                  ? "rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-transform hover:-translate-y-0.5"
                  : "rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-ink/5 transition-transform hover:-translate-y-0.5"
              }
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  resetPaging();
                  setCategoryId(
                    categoryId === category.id ? null : category.id,
                  );
                }}
                className={
                  categoryId === category.id
                    ? "rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-transform hover:-translate-y-0.5"
                    : "rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-ink/5 transition-transform hover:-translate-y-0.5"
                }
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3 pt-2.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tags
            </span>
            {tags.map((tag) => {
              const active = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={
                    active
                      ? "rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand ring-1 ring-brand/20 transition-transform hover:-translate-y-0.5"
                      : "rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-ink/5 transition-transform hover:-translate-y-0.5"
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-silver">
        <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-ink">{people.length}</span> of{" "}
              {total}
            </span>
            <span className="text-xs text-muted-foreground">
              Sorted by name
            </span>
          </div>

          {people.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center gap-2 rounded-[min(1.4vw,16px)] bg-card py-16 ring-1 ring-ink/5">
              <Search className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No people match these filters yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person, index) => (
                <article
                  key={person.id}
                  className="card-in group flex flex-col overflow-hidden rounded-[min(1.4vw,16px)] bg-card ring-1 ring-ink/5 transition-transform duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                >
                  {person.image_url ? (
                    <img
                      src={person.image_url}
                      alt={`Portrait of ${person.name}`}
                      width={512}
                      height={512}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center bg-gradient-to-br from-lilac to-brand/30">
                      <span className="font-display text-3xl font-semibold text-ink-foreground/80">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold tracking-tight">
                        {person.name}
                      </h3>
                      {person.category && (
                        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                          {person.category}
                        </span>
                      )}
                    </div>
                    {person.description && (
                      <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                        {person.description}
                      </p>
                    )}
                    {person.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {person.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-silver px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Load more */}
          {total > people.length && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-[min(1vw,10px)] bg-gradient-to-br from-brand to-pink py-2 pr-4 pl-4 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isFetching ? "Loading…" : `Load ${PAGE_SIZE} more`}
                <ChevronDown className="size-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
