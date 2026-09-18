import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { formatLatency, formatNumber, formatTimestamp } from "@/lib/format";
import { getCheckOutcome, type MonitoringLog } from "@/lib/mock-data";

type LogsTableProps = {
  logs: MonitoringLog[];
  total: number;
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

const AVAILABILITY_LABEL = {
  available: "Available",
  unavailable: "Unavailable",
  unknown: "Unknown",
} as const;

export function LogsTable({
  logs,
  total,
  page,
  pageCount,
  onPrevious,
  onNext,
}: LogsTableProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-[13px]">
          <thead className="bg-zinc-50 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Timestamp</th>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Availability</th>
              <th className="px-4 py-2 text-right font-medium">Latency</th>
              <th className="px-4 py-2 font-medium">Agent</th>
              <th className="px-4 py-2 font-medium">Region</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const outcome = getCheckOutcome(log.statusCode);
              return (
                <tr
                  key={log.id}
                  className={`border-t border-zinc-100 ${
                    outcome === "available" ? "bg-white" : "bg-red-50/35"
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap text-zinc-700">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-zinc-900">{log.serviceId}</div>
                    <div className="font-mono text-[12px] text-zinc-500">
                      {log.serviceName}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge statusCode={log.statusCode} />
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {AVAILABILITY_LABEL[outcome]}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-700">
                    {formatLatency(log.latencyMs)}
                  </td>
                  <td className="px-4 py-2 font-mono text-[12px] text-zinc-600">
                    {log.agent}
                  </td>
                  <td className="px-4 py-2 font-mono text-[12px] text-zinc-600">
                    {log.region}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        summary={`${formatNumber(total)} check${total === 1 ? "" : "s"}`}
        page={page}
        pageCount={pageCount}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
