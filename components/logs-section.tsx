import { EmptyState } from "@/components/empty-state";
import { LogFilters } from "@/components/log-filters";
import { LogsTable } from "@/components/logs-table";
import { formatPeriod } from "@/lib/format";
import {
  PAGE_SIZE,
  type LogFilter,
  type MonitoringLog,
} from "@/lib/monitoring";

type LogsSectionProps = {
  logs: MonitoringLog[];
  total: number;
  page: number;
  periodStart: string;
  periodEnd: string;
  draftFilter: LogFilter;
  appliedFilter: LogFilter;
  services: Array<{ id: string; name: string }>;
  statusCodes: number[];
  agents: string[];
  onDraftChange: (next: LogFilter) => void;
  onApply: () => void;
  onClear: () => void;
  onPageChange: (page: number) => void;
};

export function LogsSection({
  logs,
  total,
  page,
  periodStart,
  periodEnd,
  draftFilter,
  appliedFilter,
  services,
  statusCodes,
  agents,
  onDraftChange,
  onApply,
  onClear,
  onPageChange,
}: LogsSectionProps) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = isFilterActive(appliedFilter);
  const period = formatPeriod(periodStart, periodEnd);

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="space-y-3 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-zinc-900">
            Monitoring logs
          </h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Filter by date, availability, service, status, or agent. Fill one
            date field to match that day only.
          </p>
        </div>
        <LogFilters
          draft={draftFilter}
          applied={appliedFilter}
          minDate={periodStart.slice(0, 10)}
          maxDate={periodEnd.slice(0, 10)}
          services={services}
          statusCodes={statusCodes}
          agents={agents}
          onDraftChange={onDraftChange}
          onApply={onApply}
          onClear={onClear}
        />
      </div>
      <div className="border-t border-zinc-200">
        {total === 0 ? (
          <EmptyState
            title={hasFilter ? "No checks match these filters" : "No monitoring logs"}
            description={
              hasFilter
                ? `Nothing matches the current filters. Checks in this file cover ${period}.`
                : "Upload a CSV to inspect health-check records."
            }
          />
        ) : (
          <LogsTable
            logs={logs}
            total={total}
            page={page}
            pageCount={pageCount}
            onPrevious={() => onPageChange(Math.max(1, page - 1))}
            onNext={() => onPageChange(Math.min(pageCount, page + 1))}
          />
        )}
      </div>
    </section>
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
