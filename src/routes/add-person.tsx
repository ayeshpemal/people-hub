import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ImageUp, Loader2 } from "lucide-react";
import { fetchCategories, fetchTags } from "@/lib/directory";
import { createPerson } from "@/lib/add-person";
import { compressImage } from "@/lib/image-compression";
import { CreatableSelect } from "@/components/creatable-select";
import { findOrCreateTaxonomyItem, type TaxonomyKind } from "@/lib/taxonomy";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/add-person")({
  head: () => ({
    meta: [
      { title: "Add a person — Person Cache" },
      {
        name: "description",
        content:
          "Add a new profile to the Person Cache: name, description, category, tags and a photo that is compressed in your browser before upload.",
      },
      { property: "og:title", content: "Add a person — Person Cache" },
      {
        property: "og:description",
        content:
          "Add a new profile to the Person Cache with a photo that is optimised in your browser before upload.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddPerson,
});

const field =
  "w-full rounded-[min(1vw,10px)] bg-card px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/10 placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40";
const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

function AddPerson() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: fetchCategories,
  });
  const { data: tags = [] } = useQuery({ queryKey: ["tags", user?.id], queryFn: fetchTags });

  const mutation = useMutation({
    mutationFn: () =>
      createPerson({
        name,
        description,
        categoryId: categoryId || null,
        tagIds,
        image,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["people"] });
      router.navigate({ to: "/" });
    },
  });

  const onPickImage = async (file: File | null) => {
    setPreviewError(null);
    setPreviewInfo(null);
    setImage(file);
    setIsCompressing(true);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) {
      setIsCompressing(false);
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed.file));
      setPreviewInfo(
        `${compressed.width}×${compressed.height} · ${Math.round(compressed.bytes / 1024)} KB · ${
          compressed.type === "image/webp" ? "WebP" : "JPEG"
        }`,
      );
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not prepare that image.");
      setImage(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const createTaxonomy = async (kind: TaxonomyKind, value: string) => {
    const item = await findOrCreateTaxonomyItem(kind, value);
    await queryClient.invalidateQueries({ queryKey: [kind] });
    return item;
  };

  return (
    <div className="min-h-screen bg-silver font-sans text-ink antialiased">
      <div className="sticky top-0 z-20 bg-silver/85 backdrop-blur-sm ring-1 ring-ink/10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="size-3.5" /> Directory
          </Link>
          <span className="font-display text-lg font-semibold tracking-tight">Add a person</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
          Add a person
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Photos are resized to 1280px and squeezed under 500 KB right here in your browser before
          they are uploaded.
        </p>

        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || mutation.isPending || isCompressing) return;
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className={field}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short line about this person…"
              className={field}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="category">
              Category
            </label>
            <CreatableSelect
              id="category"
              kind="categories"
              items={categories}
              value={categoryId ? [categoryId] : []}
              onChange={(ids) => setCategoryId(ids[0] ?? "")}
              onCreate={(value) => createTaxonomy("categories", value)}
              placeholder="Search or create a category…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="tags">
              Tags
            </label>
            <CreatableSelect
              id="tags"
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
            <label className={labelCls} htmlFor="image">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview of the selected photo"
                  width={80}
                  height={80}
                  className="size-20 shrink-0 rounded-[min(1.4vw,16px)] object-cover ring-1 ring-ink/10"
                />
              ) : (
                <div className="grid size-20 shrink-0 place-items-center rounded-[min(1.4vw,16px)] bg-linear-to-br from-lilac to-brand/30">
                  <ImageUp className="size-5 text-ink-foreground/80" />
                </div>
              )}
              <input
                id="image"
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
                : "Something went wrong. Please try again."}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={mutation.isPending || isCompressing || !name.trim()}
              className="inline-flex items-center gap-2 rounded-[min(1vw,10px)] bg-linear-to-br from-brand to-pink px-4 py-2 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {(mutation.isPending || isCompressing) && (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              )}
              {mutation.isPending
                ? "Saving…"
                : isCompressing
                  ? "Optimising photo…"
                  : "Add to directory"}
            </button>

            <Link to="/" className="text-sm text-muted-foreground hover:text-ink">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
