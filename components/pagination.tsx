type PaginationProps = {
  summary: string;
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function Pagination({
  summary,
  page,
  pageCount,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-2.5">
      <p className="text-[12px] text-zinc-500">{summary}</p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={page <= 1}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-white"
          >
            Previous
          </button>
          <span className="min-w-[3.5rem] text-center font-mono text-[12px] text-zinc-600">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= pageCount}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
