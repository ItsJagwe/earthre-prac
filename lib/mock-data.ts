export const SLA_THRESHOLD = 99.9;

export type ServiceId =
  | "svc-auth"
  | "svc-payments"
  | "svc-search"
  | "svc-reports"
  | "svc-notify";

export type AgentId = "agent-1" | "agent-2";
export type RegionId = "ap-south-1";
export type StatusCode = 200 | 500 | 502 | 503 | 999;

export type ServiceInfo = {
  id: ServiceId;
  name: string;
};

export const SERVICES: ServiceInfo[] = [
  { id: "svc-auth", name: "auth-api" },
  { id: "svc-payments", name: "payments-api" },
  { id: "svc-search", name: "search-api" },
  { id: "svc-reports", name: "reports-api" },
  { id: "svc-notify", name: "notify-worker" },
];

export type DashboardSummary = {
  overallAvailability: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgLatencyMs: number;
  servicesBelowSla: number;
  periodStart: string;
  periodEnd: string;
};

export type ServiceSummary = {
  id: ServiceId;
  name: string;
  availability: number;
  totalChecks: number;
  failedChecks: number;
  avgLatencyMs: number;
};

export type MonitoringLog = {
  id: string;
  timestamp: string;
  serviceId: ServiceId;
  serviceName: string;
  statusCode: StatusCode;
  latencyMs: number;
  agent: AgentId;
  region: RegionId;
};

export const PAGE_SIZE = 12;

export const dashboardSummary: DashboardSummary = {
  overallAvailability: 99.79,
  totalChecks: 4320,
  successfulChecks: 4311,
  failedChecks: 9,
  avgLatencyMs: 371,
  servicesBelowSla: 3,
  periodStart: "2025-05-08T00:00:00Z",
  periodEnd: "2025-05-16T23:45:00Z",
};

export const serviceSummaries: ServiceSummary[] = [
  {
    id: "svc-auth",
    name: "auth-api",
    availability: 99.88,
    totalChecks: 864,
    failedChecks: 1,
    avgLatencyMs: 162,
  },
  {
    id: "svc-payments",
    name: "payments-api",
    availability: 99.77,
    totalChecks: 864,
    failedChecks: 2,
    avgLatencyMs: 378,
  },
  {
    id: "svc-search",
    name: "search-api",
    availability: 100,
    totalChecks: 864,
    failedChecks: 0,
    avgLatencyMs: 548,
  },
  {
    id: "svc-reports",
    name: "reports-api",
    availability: 99.31,
    totalChecks: 864,
    failedChecks: 6,
    avgLatencyMs: 641,
  },
  {
    id: "svc-notify",
    name: "notify-worker",
    availability: 100,
    totalChecks: 864,
    failedChecks: 0,
    avgLatencyMs: 124,
  },
];

type RawLog = [
  timestamp: string,
  serviceId: ServiceId,
  statusCode: StatusCode,
  latencyMs: number,
  agent: AgentId,
];

const RAW_LOGS: RawLog[] = [
  ["2025-05-08T00:15:00Z", "svc-auth", 200, 171, "agent-1"],
  ["2025-05-08T01:00:00Z", "svc-payments", 200, 377, "agent-1"],
  ["2025-05-08T03:30:00Z", "svc-search", 200, 512, "agent-1"],
  ["2025-05-08T08:15:00Z", "svc-notify", 200, 129, "agent-1"],
  ["2025-05-08T11:30:00Z", "svc-reports", 200, 857, "agent-1"],
  ["2025-05-08T14:45:00Z", "svc-auth", 200, 148, "agent-2"],
  ["2025-05-08T17:15:00Z", "svc-notify", 200, 112, "agent-2"],
  ["2025-05-08T20:30:00Z", "svc-payments", 200, 343, "agent-1"],
  ["2025-05-09T02:00:00Z", "svc-notify", 200, 104, "agent-1"],
  ["2025-05-09T04:45:00Z", "svc-reports", 200, 576, "agent-1"],
  ["2025-05-09T08:15:00Z", "svc-auth", 500, 142, "agent-1"],
  ["2025-05-09T10:15:00Z", "svc-payments", 200, 377, "agent-1"],
  ["2025-05-09T13:00:00Z", "svc-search", 200, 451, "agent-2"],
  ["2025-05-09T16:30:00Z", "svc-auth", 200, 155, "agent-1"],
  ["2025-05-09T19:45:00Z", "svc-notify", 200, 97, "agent-1"],
  ["2025-05-09T22:15:00Z", "svc-reports", 200, 611, "agent-1"],
  ["2025-05-10T00:45:00Z", "svc-auth", 200, 171, "agent-1"],
  ["2025-05-10T07:15:00Z", "svc-payments", 200, 427, "agent-1"],
  ["2025-05-10T08:45:00Z", "svc-payments", 200, 467, "agent-1"],
  ["2025-05-10T09:30:00Z", "svc-search", 200, 451, "agent-1"],
  ["2025-05-10T12:45:00Z", "svc-notify", 200, 84, "agent-1"],
  ["2025-05-10T15:45:00Z", "svc-search", 200, 717, "agent-1"],
  ["2025-05-10T18:00:00Z", "svc-reports", 200, 688, "agent-2"],
  ["2025-05-10T22:30:00Z", "svc-payments", 999, 389, "agent-1"],
  ["2025-05-12T02:15:00Z", "svc-auth", 200, 112, "agent-1"],
  ["2025-05-12T06:00:00Z", "svc-notify", 200, 141, "agent-1"],
  ["2025-05-12T09:15:00Z", "svc-search", 200, 498, "agent-2"],
  ["2025-05-12T11:45:00Z", "svc-reports", 200, 542, "agent-1"],
  ["2025-05-12T14:30:00Z", "svc-payments", 200, 401, "agent-1"],
  ["2025-05-12T16:00:00Z", "svc-auth", 200, 137, "agent-1"],
  ["2025-05-12T16:45:00Z", "svc-payments", 200, 456, "agent-1"],
  ["2025-05-12T21:00:00Z", "svc-notify", 200, 119, "agent-2"],
  ["2025-05-13T02:15:00Z", "svc-reports", 200, 796, "agent-1"],
  ["2025-05-13T08:30:00Z", "svc-auth", 200, 177, "agent-2"],
  ["2025-05-13T12:45:00Z", "svc-reports", 200, 707, "agent-1"],
  ["2025-05-13T16:00:00Z", "svc-reports", 502, 3000, "agent-1"],
  ["2025-05-13T16:00:00Z", "svc-auth", 200, 164, "agent-1"],
  ["2025-05-13T16:15:00Z", "svc-reports", 502, 3022, "agent-1"],
  ["2025-05-13T16:15:00Z", "svc-payments", 200, 352, "agent-1"],
  ["2025-05-13T16:30:00Z", "svc-reports", 500, 790, "agent-1"],
  ["2025-05-13T16:30:00Z", "svc-search", 200, 540, "agent-2"],
  ["2025-05-13T16:45:00Z", "svc-reports", 503, 1942, "agent-1"],
  ["2025-05-13T16:45:00Z", "svc-notify", 200, 126, "agent-1"],
  ["2025-05-13T17:00:00Z", "svc-reports", 503, 2805, "agent-1"],
  ["2025-05-13T17:00:00Z", "svc-auth", 200, 158, "agent-2"],
  ["2025-05-13T17:15:00Z", "svc-reports", 503, 2805, "agent-1"],
  ["2025-05-13T17:15:00Z", "svc-payments", 200, 368, "agent-1"],
  ["2025-05-13T18:00:00Z", "svc-search", 200, 604, "agent-1"],
  ["2025-05-14T02:00:00Z", "svc-auth", 200, 190, "agent-1"],
  ["2025-05-14T07:00:00Z", "svc-notify", 200, 132, "agent-1"],
  ["2025-05-14T10:00:00Z", "svc-search", 200, 561, "agent-1"],
  ["2025-05-14T13:00:00Z", "svc-payments", 503, 326, "agent-1"],
  ["2025-05-14T15:45:00Z", "svc-payments", 200, 461, "agent-2"],
  ["2025-05-14T18:00:00Z", "svc-auth", 200, 181, "agent-1"],
  ["2025-05-16T00:00:00Z", "svc-reports", 200, 616, "agent-1"],
  ["2025-05-16T03:30:00Z", "svc-auth", 200, 190, "agent-1"],
  ["2025-05-16T06:45:00Z", "svc-payments", 200, 293, "agent-1"],
  ["2025-05-16T09:30:00Z", "svc-auth", 200, 178, "agent-1"],
  ["2025-05-16T12:15:00Z", "svc-notify", 200, 120, "agent-1"],
  ["2025-05-16T16:15:00Z", "svc-search", 200, 598, "agent-1"],
];

const SERVICE_NAME = Object.fromEntries(
  SERVICES.map((service) => [service.id, service.name]),
) as Record<ServiceId, string>;

export const monitoringLogs: MonitoringLog[] = RAW_LOGS.map((row, index) => {
  const [timestamp, serviceId, statusCode, latencyMs, agent] = row;
  return {
    id: `chk-${String(index + 1).padStart(3, "0")}`,
    timestamp,
    serviceId,
    serviceName: SERVICE_NAME[serviceId],
    statusCode,
    latencyMs,
    agent,
    region: "ap-south-1",
  };
});

export function meetsSla(availability: number): boolean {
  return availability >= SLA_THRESHOLD;
}

export function getCheckOutcome(
  statusCode: StatusCode,
): "available" | "unavailable" | "unknown" {
  if (statusCode === 200) return "available";
  if (statusCode === 999) return "unknown";
  return "unavailable";
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
