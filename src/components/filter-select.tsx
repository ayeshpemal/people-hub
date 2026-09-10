import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface FilterOption {
  id: string;
  name: string;
}

type Props = {
  options: FilterOption[];
  /** Selected ids. Single-select keeps at most one. */
  value: string[];
  onChange: (ids: string[]) => void;
  multi?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  label: string;
  id?: string;
};

/** Searchable dropdown used by the directory filter bar (no create action). */
export function FilterSelect({
  options,
  value,
  onChange,
  multi = false,
  placeholder,
  searchPlaceholder = "Type to search…",
  label,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selected = options.filter((o) => value.includes(o.id));

  const pick = (optionId: string) => {
    if (multi) {
      onChange(
        value.includes(optionId)
          ? value.filter((v) => v !== optionId)
          : [...value, optionId],
      );
    } else {
      onChange(value.includes(optionId) ? [] : [optionId]);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <button
        type="button"
        id={id}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-1.5 text-left text-sm ring-1 ring-ink/10 transition-colors hover:ring-ink/20 focus:ring-2 focus:ring-brand/50 focus:outline-none"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand ring-1 ring-brand/30"
            >
              {item.name}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${item.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== item.id));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== item.id));
                  }
                }}
              >
                <X className="size-3" />
              </span>
            </span>
          ))
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-[min(1vw,10px)] bg-card shadow-xl ring-1 ring-ink/15">
          <label className="flex items-center gap-2 border-b border-ink/10 px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  pick(filtered[0].id);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="max-h-56 overflow-auto p-1">
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
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Nothing matches “{query.trim()}”.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
