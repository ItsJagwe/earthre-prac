type DateFilter = {
  from: string;
  to: string;
};

type LogFiltersProps = {
  draft: DateFilter;
  applied: DateFilter;
  minDate?: string;
  maxDate?: string;
  onDraftChange: (next: DateFilter) => void;
  onApply: () => void;
  onClear: () => void;
};

export function LogFilters({
  draft,
  applied,
  minDate,
  maxDate,
  onDraftChange,
  onApply,
  onClear,
}: LogFiltersProps) {
  const hasDraft = Boolean(draft.from || draft.to);
  const hasApplied = Boolean(applied.from || applied.to);
  const invalidRange = Boolean(
    draft.from && draft.to && draft.from > draft.to,
  );

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalidRange) onApply();
      }}
    >
      <label className="flex min-w-[9.5rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          From
        </span>
        <input
          type="date"
          value={draft.from}
          min={minDate}
          max={maxDate}
          onChange={(event) =>
            onDraftChange({ ...draft, from: event.target.value })
          }
          className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
        />
      </label>
      <label className="flex min-w-[9.5rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          To
        </span>
        <input
          type="date"
          value={draft.to}
          min={minDate}
          max={maxDate}
          onChange={(event) =>
            onDraftChange({ ...draft, to: event.target.value })
          }
          className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={invalidRange}
          className="h-9 rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasDraft && !hasApplied}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-white"
        >
          Clear
        </button>
      </div>
      {invalidRange ? (
        <p className="text-[12px] text-red-700 sm:w-full">
          From date must be on or before To date.
        </p>
      ) : null}
    </form>
  );
}
