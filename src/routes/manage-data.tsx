import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { fetchCategories, fetchTags } from "@/lib/directory";
import {
  MAX_NAME_LENGTH,
  createTaxonomyItem,
  deleteTaxonomyItem,
  fetchUsageCounts,
  renameTaxonomyItem,
  validateName,
  type TaxonomyItem,
  type TaxonomyKind,
} from "@/lib/taxonomy";

export const Route = createFileRoute("/manage-data")({
  head: () => ({
    meta: [
      { title: "Manage Categories & Tags — Person Cache" },
      {
        name: "description",
        content:
          "Create, rename, and remove the categories and tags used across the Person Cache directory.",
      },
      { property: "og:title", content: "Manage Categories & Tags — Person Cache" },
      {
        property: "og:description",
        content:
          "Create, rename, and remove the categories and tags used across the Person Cache directory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageData,
});

function ManageData() {
  return (
    <div className="min-h-screen bg-silver">
      <div className="sticky top-0 z-20 border-b border-ink/5 bg-silver/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="size-4" />
            Directory
          </Link>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-brand uppercase">
            Manage data
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Categories &amp; tags
        </h1>
        <p className="mt-2 max-w-[56ch] text-pretty text-muted-foreground">
          Keep the directory tidy. Changes here apply everywhere people are
          listed.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TaxonomyPanel
            kind="categories"
            title="Categories"
            blurb="Each person can belong to one category."
            deleteWarning={(name, count) =>
              count > 0
                ? `Delete "${name}"? ${count} profile${count === 1 ? "" : "s"} will be left without a category.`
                : `Delete "${name}"? It isn't used by any profile yet.`
            }
          />
          <TaxonomyPanel
            kind="tags"
            title="Tags"
            blurb="People can carry any number of tags."
            deleteWarning={(name, count) =>
              count > 0
                ? `Delete "${name}"? It will be removed from ${count} profile${count === 1 ? "" : "s"}.`
                : `Delete "${name}"? It isn't used by any profile yet.`
            }
          />
        </div>
      </div>
    </div>
  );
}

interface PanelProps {
  kind: TaxonomyKind;
  title: string;
  blurb: string;
  deleteWarning: (name: string, count: number) => string;
}

function TaxonomyPanel({ kind, title, blurb, deleteWarning }: PanelProps) {
  const queryClient = useQueryClient();
  const queryKey = [kind] as const;

  const {
    data: items = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<TaxonomyItem[]>({
    queryKey,
    queryFn: kind === "categories" ? fetchCategories : fetchTags,
  });

  const { data: usage = {} } = useQuery({
    queryKey: [kind, "usage"],
    queryFn: () => fetchUsageCounts(kind),
  });

  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TaxonomyItem | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [kind] });
    queryClient.invalidateQueries({ queryKey: ["people"] });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createTaxonomyItem(kind, name),
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaxonomyItem[]>(queryKey) ?? [];
      const optimistic: TaxonomyItem = { id: `optimistic-${name}`, name };
      queryClient.setQueryData<TaxonomyItem[]>(queryKey, [
        ...previous,
        optimistic,
      ].sort((a, b) => a.name.localeCompare(b.name)));
      return { previous };
    },
    onError: (err, _name, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
      setMutationError(readableError(err, "We couldn't save that."));
    },
    onSuccess: () => setMutationError(null),
    onSettled: invalidate,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameTaxonomyItem(kind, id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaxonomyItem[]>(queryKey) ?? [];
      queryClient.setQueryData<TaxonomyItem[]>(
        queryKey,
        previous
          .map((item) => (item.id === id ? { ...item, name } : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
      setMutationError(readableError(err, "We couldn't rename that."));
    },
    onSuccess: () => setMutationError(null),
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTaxonomyItem(kind, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaxonomyItem[]>(queryKey) ?? [];
      queryClient.setQueryData<TaxonomyItem[]>(
        queryKey,
        previous.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
      setMutationError(readableError(err, "We couldn't delete that."));
    },
    onSuccess: () => setMutationError(null),
    onSettled: invalidate,
  });

  const submitNew = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateName(draft, items);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormError(null);
    setMutationError(null);
    setDraft("");
    createMutation.mutate(result.name);
  };

  const submitRename = (item: TaxonomyItem) => {
    const result = validateName(editingValue, items, item.id);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormError(null);
    setEditingId(null);
    if (result.name !== item.name) {
      renameMutation.mutate({ id: item.id, name: result.name });
    }
  };

  return (
    <section className="flex flex-col rounded-[min(1.4vw,16px)] bg-card p-5 ring-1 ring-ink/10">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>

      <form onSubmit={submitNew} className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => {
            setDraft(event.target.value);
            if (formError) setFormError(null);
          }}
          placeholder={`New ${kind === "categories" ? "category" : "tag"} name`}
          aria-label={`New ${kind === "categories" ? "category" : "tag"} name`}
          className="w-full rounded-[min(1vw,10px)] bg-silver px-3 py-2 text-sm text-ink ring-1 ring-ink/10 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[min(1vw,10px)] bg-gradient-to-br from-brand to-pink px-3 py-2 text-sm font-medium text-ink-foreground ring-1 ring-brand/40 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Plus className="size-4" />
          Add
        </button>
      </form>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {draft.trim().length}/{MAX_NAME_LENGTH} characters
      </p>

      {(formError || mutationError) && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {formError ?? mutationError}
        </p>
      )}

      <div className="mt-4 flex flex-col divide-y divide-ink/5 border-t border-ink/5">
        {isPending ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="py-3">
              <div className="h-4 w-2/5 animate-pulse rounded bg-silver" />
            </div>
          ))
        ) : isError ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : `We couldn't load the ${title.toLowerCase()}.`}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Nothing here yet — add the first one above.
          </p>
        ) : (
          items.map((item) => {
            const count = usage[item.id] ?? 0;
            const saving = item.id.startsWith("optimistic-");
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 py-2.5 text-sm"
              >
                {editingId === item.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingValue}
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submitRename(item);
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded-[min(1vw,10px)] bg-silver px-2.5 py-1.5 text-sm text-ink ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand/40"
                    />
                    <button
                      onClick={() => submitRename(item)}
                      aria-label="Save name"
                      className="rounded-full p-1.5 text-brand hover:bg-brand/10"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-ink/10"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium text-ink">
                      {item.name}
                    </span>
                    {saving && (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {count} profile{count === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.name);
                        setFormError(null);
                      }}
                      disabled={saving}
                      aria-label={`Rename ${item.name}`}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-ink/10 hover:text-ink disabled:opacity-40"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(item)}
                      disabled={saving}
                      aria-label={`Delete ${item.name}`}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[min(1.4vw,16px)] bg-card p-5 ring-1 ring-ink/10">
            <h3 className="font-display text-base font-semibold text-ink">
              Are you sure?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {deleteWarning(
                pendingDelete.name,
                usage[pendingDelete.id] ?? 0,
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-[min(1vw,10px)] bg-silver px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10"
              >
                Keep it
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-[min(1vw,10px)] bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function readableError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message: unknown }).message);
    if (message.toLowerCase().includes("duplicate"))
      return "That name already exists.";
    return message;
  }
  return fallback;
}
