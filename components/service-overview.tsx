import { formatNumber, formatPercent } from "@/lib/format";
import {
  SLA_THRESHOLD,
  meetsSla,
  type ServiceSummary,
} from "@/lib/mock-data";

type ServiceOverviewProps = {
  services: ServiceSummary[];
};

export function ServiceOverview({ services }: ServiceOverviewProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-[13px] font-medium text-zinc-900">Services</h2>
        <p className="text-[12px] text-zinc-500">
          Compared with a {formatPercent(SLA_THRESHOLD)} example threshold
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border-t border-zinc-200 text-left text-[13px]">
          <thead className="bg-zinc-50 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Availability</th>
              <th className="px-4 py-2 text-right font-medium">Checks</th>
              <th className="px-4 py-2 text-right font-medium">Failed</th>
              <th className="px-4 py-2 text-right font-medium">Latency</th>
              <th className="px-4 py-2 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const ok = meetsSla(service.availability);
              return (
                <tr
                  key={service.id}
                  className={`border-t border-zinc-100 ${
                    ok ? "bg-white" : "bg-amber-50/50"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-zinc-900">
                      {service.id}
                    </div>
                    <div className="font-mono text-[12px] text-zinc-500">
                      {service.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-900">
                    {formatPercent(service.availability)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-700">
                    {formatNumber(service.totalChecks)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-700">
                    {formatNumber(service.failedChecks)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-700">
                    {service.avgLatencyMs} ms
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        ok
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                          : "bg-amber-50 text-amber-900 ring-amber-200"
                      }`}
                    >
                      {ok ? "Meeting SLA" : "Below SLA"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
