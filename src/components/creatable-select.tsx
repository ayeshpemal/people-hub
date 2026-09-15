import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import {
  MAX_NAME_LENGTH,
  normalizeName,
  type TaxonomyItem,
  type TaxonomyKind,
} from "@/lib/taxonomy";

type Props = {
  kind: TaxonomyKind;
  items: TaxonomyItem[];
  multi?: boolean;
  /** Selected ids (single-select uses at most one). */
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => Promise<TaxonomyItem>;
  placeholder?: string;
  id?: string;
};

export function CreatableSelect({
  kind,
  items,
  multi = false,
  value,
  onChange,
  onCreate,
  placeholder = "Search or create…",
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const normalized = normalizeName(kind, query);
  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())),
    [items, query],
  );
  const exactMatch = items.find(
    (item) => item.name.trim().toLowerCase() === normalized.toLowerCase(),
  );
  const canCreate = normalized.length > 0 && !exactMatch;

  const selected = items.filter((item) => value.includes(item.id));

  const pick = (itemId: string) => {
    setError(null);
    if (multi) {
      onChange(value.includes(itemId) ? value.filter((v) => v !== itemId) : [...value, itemId]);
    } else {
      onChange(value.includes(itemId) ? [] : [itemId]);
      setOpen(false);
    }
    setQuery("");
  };

  const create = async () => {
    if (creating || !normalized) return;
    if (normalized.length > MAX_NAME_LENGTH) {
      setError(`Keep it to ${MAX_NAME_LENGTH} characters or fewer.`);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const item = await onCreate(normalized);
      if (multi) {
        onChange(value.includes(item.id) ? value : [...value, item.id]);
      } else {
        onChange([item.id]);
        setOpen(false);
      }
      setQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-2 py-1.5 text-sm ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-brand/40"
        onClick={() => setOpen(true)}
      >
        {selected.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand ring-1 ring-brand/20"
          >
            {item.name}
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((v) => v !== item.id));
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canCreate) void create();
              else if (filtered[0]) pick(filtered[0].id);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={selected.length ? "" : placeholder}
          className="min-w-[8ch] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-muted-foreground"
        />
        {creating ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-brand" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-[min(1vw,10px)] bg-card p-1 shadow-lg ring-1 ring-ink/10">
          {creating && (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Saving “{normalized}”…
            </div>
          )}
          {canCreate && !creating && (
            <button
              type="button"
              onClick={() => void create()}
              className="flex w-full items-center gap-2 rounded-[min(0.8vw,8px)] px-2 py-2 text-left text-sm text-brand hover:bg-brand/10"
            >
              <Plus className="size-4 shrink-0" /> Create “{normalized}”
            </button>
          )}
          {filtered.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => pick(item.id)}
              className="flex w-full items-center gap-2 rounded-[min(0.8vw,8px)] px-2 py-2 text-left text-sm text-ink hover:bg-ink/10"
            >
              <Check
                className={
                  value.includes(item.id)
                    ? "size-4 shrink-0 text-brand"
                    : "size-4 shrink-0 opacity-0"
                }
              />
              {item.name}
            </button>
          ))}
          {!filtered.length && !canCreate && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              Nothing here yet — start typing to create one.
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
