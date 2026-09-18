export const SLA_THRESHOLD = 99.9;
export const PAGE_SIZE = 12;

const SERVICE_ORDER = [
  "svc-auth",
  "svc-payments",
  "svc-search",
  "svc-reports",
  "svc-notify",
];

export type MonitoringCheck = {
  id: number;
  service_id: string;
  service_name: string;
  timestamp: string;
  status_code: number;
  latency_ms: number | null;
  agent: string;
  region: string;
  is_available: boolean;
};

export type DashboardSummary = {
  overallAvailability: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgLatencyMs: number | null;
  servicesBelowSla: number;
  periodStart: string;
  periodEnd: string;
};

export type ServiceSummary = {
  id: string;
  name: string;
  availability: number;
  totalChecks: number;
  failedChecks: number;
  avgLatencyMs: number | null;
};

export type MonitoringLog = {
  id: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  statusCode: number;
  latencyMs: number | null;
  agent: string;
  region: string;
};

export type DashboardModel = {
  summary: DashboardSummary;
  services: ServiceSummary[];
  logs: MonitoringLog[];
};

export function meetsSla(availability: number): boolean {
  return availability >= SLA_THRESHOLD;
}

export function getCheckOutcome(
  statusCode: number,
): "available" | "unavailable" | "unknown" {
  if (statusCode === 200) return "available";
  if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
    return "unavailable";
  }
  return "unknown";
}

export function filterLogsByDate(
  logs: MonitoringLog[],
  from: string,
  to: string,
): MonitoringLog[] {
  if (!from && !to) return logs;

  const start = from || to;
  const end = to || from;

  return logs.filter((log) => {
    const day = log.timestamp.slice(0, 10);
    return day >= start && day <= end;
  });
}

export function buildDashboardModel(checks: MonitoringCheck[]): DashboardModel {
  const totalChecks = checks.length;
  const successfulChecks = checks.filter((check) => check.is_available).length;
  const failedChecks = totalChecks - successfulChecks;
  const overallAvailability =
    totalChecks === 0 ? 0 : (successfulChecks / totalChecks) * 100;
  const avgLatencyMs = averageLatency(checks.map((check) => check.latency_ms));

  const timestamps = checks.map((check) => check.timestamp).sort();
  const periodStart = timestamps[0] ?? "";
  const periodEnd = timestamps[timestamps.length - 1] ?? "";

  const grouped = new Map<string, MonitoringCheck[]>();
  for (const check of checks) {
    const rows = grouped.get(check.service_id) ?? [];
    rows.push(check);
    grouped.set(check.service_id, rows);
  }

  const services = [...grouped.entries()]
    .map(([id, rows]) => {
      const successful = rows.filter((row) => row.is_available).length;
      return {
        id,
        name: rows[0]?.service_name ?? id,
        availability: rows.length === 0 ? 0 : (successful / rows.length) * 100,
        totalChecks: rows.length,
        failedChecks: rows.length - successful,
        avgLatencyMs: averageLatency(rows.map((row) => row.latency_ms)),
      };
    })
    .sort((a, b) => serviceSortIndex(a.id) - serviceSortIndex(b.id));

  return {
    summary: {
      overallAvailability,
      totalChecks,
      successfulChecks,
      failedChecks,
      avgLatencyMs,
      servicesBelowSla: services.filter((service) => !meetsSla(service.availability))
        .length,
      periodStart,
      periodEnd,
    },
    services,
    logs: checks.map((check) => ({
      id: String(check.id),
      timestamp: check.timestamp,
      serviceId: check.service_id,
      serviceName: check.service_name,
      statusCode: check.status_code,
      latencyMs: check.latency_ms,
      agent: check.agent,
      region: check.region,
    })),
  };
}

function averageLatency(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value != null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}

function serviceSortIndex(id: string): number {
  const index = SERVICE_ORDER.indexOf(id);
  return index === -1 ? SERVICE_ORDER.length : index;
}
