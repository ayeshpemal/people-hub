import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, isFetching, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        onClick={onPrev}
        disabled={!hasPrev || isFetching}
        aria-label="Previous page"
        className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        <ChevronLeft className="size-4 shrink-0" />
        Prev
      </button>

      <span className="min-w-[7ch] text-center text-sm text-muted-foreground">
        {isFetching ? (
          <Loader2 className="mx-auto size-4 animate-spin" />
        ) : (
          <>
            Page <span className="font-medium text-ink">{page + 1}</span> of {totalPages}
          </>
        )}
      </span>

      <button
        onClick={onNext}
        disabled={!hasNext || isFetching}
        aria-label="Next page"
        className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-linear-to-br from-brand to-pink py-2 pr-4 pl-3 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        Next
        <ChevronRight className="size-4 shrink-0" />
      </button>
    </div>
  );
}
