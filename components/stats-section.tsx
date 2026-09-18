import { SlaMeter } from "@/components/sla-meter";
import { StatCard } from "@/components/stat-card";
import {
  formatDayCount,
  formatNumber,
  formatPercent,
  formatPeriod,
} from "@/lib/format";
import {
  SLA_THRESHOLD,
  meetsSla,
  type DashboardSummary,
} from "@/lib/monitoring";

type StatsSectionProps = {
  summary: DashboardSummary;
  expanded: boolean;
  onToggle: () => void;
};

export function StatsSection({
  summary,
  expanded,
  onToggle,
}: StatsSectionProps) {
  const availabilityOk = meetsSla(summary.overallAvailability);
  const period = formatPeriod(summary.periodStart, summary.periodEnd);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-zinc-900">Overview</h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {period} · {formatNumber(summary.totalChecks)} checks · threshold{" "}
            {formatPercent(SLA_THRESHOLD)}
          </p>
          {!expanded ? (
            <p className="mt-2 font-mono text-[13px] text-zinc-700">
              {formatPercent(summary.overallAvailability)} availability ·{" "}
              {formatNumber(summary.failedChecks)} failed ·{" "}
              {summary.servicesBelowSla} below SLA
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-zinc-200 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 lg:col-span-1">
              <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                Overall availability
              </p>
              <p className="mt-1 font-mono text-[28px] leading-none font-medium tracking-tight text-zinc-900">
                {formatPercent(summary.overallAvailability)}
              </p>
              <p
                className={`mt-2 text-[12px] ${
                  availabilityOk ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {availabilityOk
                  ? `Meeting the ${formatPercent(SLA_THRESHOLD)} threshold`
                  : `Below the ${formatPercent(SLA_THRESHOLD)} threshold`}
              </p>
              <SlaMeter value={summary.overallAvailability} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              <StatCard
                label="Total checks"
                value={formatNumber(summary.totalChecks)}
                hint="Five services, one check / 15 min"
              />
              <StatCard
                label="Successful checks"
                value={formatNumber(summary.successfulChecks)}
                hint="HTTP 200"
                tone="ok"
              />
              <StatCard
                label="Failed checks"
                value={formatNumber(summary.failedChecks)}
                hint="5xx and unknown agent codes"
                tone={summary.failedChecks > 0 ? "warning" : "ok"}
              />
              <StatCard
                label="Avg latency"
                value={
                  summary.avgLatencyMs == null
                    ? "—"
                    : `${formatNumber(summary.avgLatencyMs)} ms`
                }
                hint="Mean response time across checks with latency"
              />
              <StatCard
                label="Services below 99.9%"
                value={String(summary.servicesBelowSla)}
                hint={
                  summary.servicesBelowSla === 1
                    ? "1 service missed the example SLA"
                    : `${summary.servicesBelowSla} services missed the example SLA`
                }
                tone={summary.servicesBelowSla > 0 ? "warning" : "ok"}
              />
              <StatCard
                label="Monitoring period"
                value={formatDayCount(summary.periodStart, summary.periodEnd)}
                hint={period}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
