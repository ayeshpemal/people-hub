import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, X } from "lucide-react";
import { CreatableSelect } from "@/components/creatable-select";
import { useAuth } from "@/lib/auth";
import { fetchCategories, fetchTags, type DirectoryPerson } from "@/lib/directory";
import { compressImage } from "@/lib/image-compression";
import { updatePerson } from "@/lib/person-mutations";
import { findOrCreateTaxonomyItem, type TaxonomyKind } from "@/lib/taxonomy";

const field =
  "w-full rounded-[min(1vw,10px)] bg-card px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/10 placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40";
const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

type Props = {
  person: DirectoryPerson;
  onClose: () => void;
  onSaved: (updated: DirectoryPerson) => void;
};

export function EditPersonDialog({ person, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(person.name);
  const [description, setDescription] = useState(person.description ?? "");
  const [categoryId, setCategoryId] = useState(person.category_id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(person.tagIds);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(person.image_url);
  const [previewInfo, setPreviewInfo] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: fetchCategories,
  });
  const { data: tags = [] } = useQuery({ queryKey: ["tags", user?.id], queryFn: fetchTags });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPickImage = async (file: File | null) => {
    setPreviewError(null);
    setPreviewInfo(null);
    setImage(file);
    if (!file) {
      setPreview(person.image_url);
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed.file));
      setPreviewInfo(
        `${compressed.width}×${compressed.height} · ${Math.round(
          compressed.bytes / 1024,
        )} KB · ${compressed.type === "image/webp" ? "WebP" : "JPEG"}`,
      );
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not prepare that image.");
      setImage(null);
      setPreview(person.image_url);
    } finally {
      setIsCompressing(false);
    }
  };

  const createTaxonomy = async (kind: TaxonomyKind, value: string) => {
    const item = await findOrCreateTaxonomyItem(kind, value);
    await queryClient.invalidateQueries({ queryKey: [kind] });
    return item;
  };

  const mutation = useMutation({
    mutationFn: () =>
      updatePerson({
        id: person.id,
        name,
        description,
        categoryId: categoryId || null,
        tagIds,
        newImage: image,
        currentImageUrl: person.image_url,
      }),
    onSuccess: ({ imageUrl }) => {
      onSaved({
        ...person,
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        category_id: categoryId || null,
        category: categories.find((c) => c.id === categoryId)?.name ?? null,
        tagIds,
        tags: tags
          .filter((t) => tagIds.includes(t.id))
          .map((t) => t.name)
          .sort(),
      });
      void queryClient.invalidateQueries({ queryKey: ["people"] });
      onClose();
    },
  });

  const busy = mutation.isPending || isCompressing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${person.name}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="my-8 w-full max-w-lg rounded-[min(1.4vw,16px)] bg-silver p-5 ring-1 ring-ink/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Edit profile</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full bg-card p-1.5 text-muted-foreground ring-1 ring-ink/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || busy) return;
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="edit-name">
              Name
            </label>
            <input
              id="edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={field}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="edit-category">
              Category
            </label>
            <CreatableSelect
              id="edit-category"
              kind="categories"
              items={categories}
              value={categoryId ? [categoryId] : []}
              onChange={(ids) => setCategoryId(ids[0] ?? "")}
              onCreate={(value) => createTaxonomy("categories", value)}
              placeholder="Search or create a category…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="edit-tags">
              Tags
            </label>
            <CreatableSelect
              id="edit-tags"
              kind="tags"
              multi
              items={tags}
              value={tagIds}
              onChange={setTagIds}
              onCreate={(value) => createTaxonomy("tags", value)}
              placeholder="Search or create tags…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls} htmlFor="edit-image">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt={`Photo of ${person.name}`}
                  width={80}
                  height={80}
                  className="size-20 shrink-0 rounded-[min(1.4vw,16px)] object-cover ring-1 ring-ink/10"
                />
              ) : (
                <div className="grid size-20 shrink-0 place-items-center rounded-[min(1.4vw,16px)] bg-gradient-to-br from-lilac to-brand/30">
                  <ImageUp className="size-5 text-ink-foreground/80" />
                </div>
              )}
              <input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-foreground"
              />
            </div>
            {previewInfo && (
              <p className="text-xs text-muted-foreground">Optimised: {previewInfo}</p>
            )}
            {previewError && <p className="text-xs text-destructive">{previewError}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Could not save those changes."}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-2 rounded-[min(1vw,10px)] bg-gradient-to-br from-brand to-pink px-4 py-2 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 shrink-0 animate-spin" />}
              {mutation.isPending
                ? "Saving…"
                : isCompressing
                  ? "Optimising photo…"
                  : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="text-sm text-muted-foreground hover:text-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
