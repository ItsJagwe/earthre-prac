export const SLA_THRESHOLD = 99.9;
export const PAGE_SIZE = 12;

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
  serviceCount: number;
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

export type LogFilter = {
  from: string;
  to: string;
  serviceId: string;
  availability: "" | "available" | "failed";
  statusCode: string;
  agent: string;
};

export const EMPTY_LOG_FILTER: LogFilter = {
  from: "",
  to: "",
  serviceId: "",
  availability: "",
  statusCode: "",
  agent: "",
};

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
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    summary: {
      overallAvailability,
      totalChecks,
      successfulChecks,
      failedChecks,
      avgLatencyMs,
      servicesBelowSla: services.filter((service) => !meetsSla(service.availability))
        .length,
      serviceCount: services.length,
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

export function filterLogs(
  logs: MonitoringLog[],
  filter: LogFilter,
): MonitoringLog[] {
  return logs.filter((log) => {
    if (filter.from || filter.to) {
      const start = filter.from || filter.to;
      const end = filter.to || filter.from;
      const day = log.timestamp.slice(0, 10);
      if (day < start || day > end) return false;
    }

    if (filter.serviceId && log.serviceId !== filter.serviceId) return false;
    if (filter.agent && log.agent !== filter.agent) return false;
    if (filter.statusCode && String(log.statusCode) !== filter.statusCode) {
      return false;
    }
    if (filter.availability === "available" && log.statusCode !== 200) {
      return false;
    }
    if (filter.availability === "failed" && log.statusCode === 200) {
      return false;
    }

    return true;
  });
}

export function uniqueLogOptions(logs: MonitoringLog[]) {
  const services = new Map<string, string>();
  const statusCodes = new Set<number>();
  const agents = new Set<string>();

  for (const log of logs) {
    services.set(log.serviceId, log.serviceName);
    statusCodes.add(log.statusCode);
    agents.add(log.agent);
  }

  return {
    services: [...services.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    statusCodes: [...statusCodes].sort((a, b) => a - b),
    agents: [...agents].sort((a, b) => a.localeCompare(b)),
  };
}

function averageLatency(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value != null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}
