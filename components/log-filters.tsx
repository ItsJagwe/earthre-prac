import type { LogFilter } from "@/lib/monitoring";

const SELECT_CLASS =
  "h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400";

type LogFiltersProps = {
  draft: LogFilter;
  applied: LogFilter;
  minDate?: string;
  maxDate?: string;
  services: Array<{ id: string; name: string }>;
  statusCodes: number[];
  agents: string[];
  onDraftChange: (next: LogFilter) => void;
  onApply: () => void;
  onClear: () => void;
};

export function LogFilters({
  draft,
  applied,
  minDate,
  maxDate,
  services,
  statusCodes,
  agents,
  onDraftChange,
  onApply,
  onClear,
}: LogFiltersProps) {
  const hasDraft = isFilterActive(draft);
  const hasApplied = isFilterActive(applied);
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
          className={SELECT_CLASS}
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
          className={SELECT_CLASS}
        />
      </label>
      <label className="flex min-w-[9.5rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Availability
        </span>
        <select
          value={draft.availability}
          onChange={(event) =>
            onDraftChange({
              ...draft,
              availability: event.target.value as LogFilter["availability"],
            })
          }
          className={SELECT_CLASS}
        >
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="failed">Failed</option>
        </select>
      </label>
      <label className="flex min-w-[9.5rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Service
        </span>
        <select
          value={draft.serviceId}
          onChange={(event) =>
            onDraftChange({ ...draft, serviceId: event.target.value })
          }
          className={SELECT_CLASS}
        >
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.id}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Status
        </span>
        <select
          value={draft.statusCode}
          onChange={(event) =>
            onDraftChange({ ...draft, statusCode: event.target.value })
          }
          className={SELECT_CLASS}
        >
          <option value="">All codes</option>
          {statusCodes.map((code) => (
            <option key={code} value={String(code)}>
              {code}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Agent
        </span>
        <select
          value={draft.agent}
          onChange={(event) =>
            onDraftChange({ ...draft, agent: event.target.value })
          }
          className={SELECT_CLASS}
        >
          <option value="">All agents</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
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

function isFilterActive(filter: LogFilter) {
  return Boolean(
    filter.from ||
      filter.to ||
      filter.serviceId ||
      filter.availability ||
      filter.statusCode ||
      filter.agent,
  );
}
