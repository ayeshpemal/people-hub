import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { EditPersonDialog } from "@/components/edit-person-dialog";
import { deletePerson } from "@/lib/person-mutations";


import {
  fetchCategories,
  fetchPeople,
  fetchTags,
  PAGE_SIZE,
  type DirectoryPerson,
  type PeoplePage,
} from "@/lib/directory";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Person Cache — Save people you find online" },
      {
        name: "description",
        content:
          "Your personal cache of people found online. Save a photo, context and tags, then search or filter to find them again fast.",
      },
      { property: "og:title", content: "Person Cache — Save people you find online" },
      {
        property: "og:description",
        content:
          "Your personal cache of people found online. Save a photo, context and tags, then search or filter to find them again fast.",
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

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DirectoryPerson | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryPerson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /** Patch every cached page so the grid updates without a refetch. */
  const patchCache = (
    id: string,
    updater: (person: DirectoryPerson) => DirectoryPerson | null,
  ) => {
    queryClient.setQueriesData<PeoplePage>({ queryKey: ["people"] }, (old) => {
      if (!old) return old;
      let removed = 0;
      const next: DirectoryPerson[] = [];
      for (const person of old.people) {
        if (person.id !== id) {
          next.push(person);
          continue;
        }
        const result = updater(person);
        if (result) next.push(result);
        else removed += 1;
      }
      return { people: next, total: Math.max(0, old.total - removed) };
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePerson(pendingDelete.id, pendingDelete.image_url);
      patchCache(pendingDelete.id, () => null);
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["people"] });
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Could not delete that profile.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
              PC
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Person Cache
            </span>
            <span className="mt-0.5 hidden rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand sm:inline">
              Saved people
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
              to="/manage-data"
              className="hidden items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/5 transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              <Settings2 className="size-4 shrink-0" />
              Manage data
            </Link>
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

      {/* Combined filter bar — search + one category + many tags, all AND-ed */}
      <div className="sticky top-[57px] z-10 bg-silver/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 border-b border-ink/10 pb-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Category
              </span>
              <FilterSelect
                id="category-filter"
                label="Filter by category"
                options={categories}
                value={categoryId ? [categoryId] : []}
                onChange={(ids) => {
                  resetPaging();
                  setCategoryId(ids[0] ?? null);
                }}
                placeholder="All categories"
                searchPlaceholder="Search categories…"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Tags (must match all)
              </span>
              <FilterSelect
                id="tag-filter"
                label="Filter by tags"
                multi
                options={tags}
                value={selectedTagIds}
                onChange={(ids) => {
                  resetPaging();
                  setSelectedTagIds(ids);
                }}
                placeholder="Any tag"
                searchPlaceholder="Search tags…"
              />
            </div>
          </div>
          {(categoryId || selectedTagIds.length > 0 || search) && (
            <div className="flex justify-end py-2">
              <button
                type="button"
                onClick={() => {
                  resetPaging();
                  setCategoryId(null);
                  setSelectedTagIds([]);
                  setSearch("");
                }}
                className="text-xs font-medium text-muted-foreground hover:text-ink"
              >
                Clear filters
              </button>
            </div>
          )}
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

          {isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[min(1.4vw,16px)] bg-card ring-1 ring-ink/5"
                >
                  <div className="aspect-square w-full animate-pulse bg-silver" />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-silver" />
                    <div className="h-3 w-full animate-pulse rounded bg-silver" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-silver" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-[min(1.4vw,16px)] bg-card py-16 ring-1 ring-ink/5">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "We couldn't load the directory."}
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-transform hover:-translate-y-0.5"
              >
                Try again
              </button>
            </div>
          ) : people.length === 0 ? (
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
                    <div className="mt-4 flex items-center gap-2 border-t border-ink/5 pt-3">
                      <button
                        type="button"
                        onClick={() => setEditing(person)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
                      >
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(person);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/20 transition-transform hover:-translate-y-0.5"
                      >
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
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

      {editing && (
        <EditPersonDialog
          person={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => patchCache(updated.id, () => updated)}
        />
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Delete ${pendingDelete.name}`}
        >
          <div className="w-full max-w-sm rounded-[min(1.4vw,16px)] bg-silver p-5 ring-1 ring-ink/10">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Delete {pendingDelete.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes the profile and its photo for good, along with its tag
              links. This can't be undone.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-destructive">{deleteError}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="text-sm text-muted-foreground hover:text-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-[min(1vw,10px)] bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
