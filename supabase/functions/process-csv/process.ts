import {
  missingRequiredColumns,
  parseCsv,
  rowToRecord,
} from "./parser.ts";

export const KNOWN_SERVICES: Record<string, string> = {
  "svc-auth": "auth-api",
  "svc-payments": "payments-api",
  "svc-search": "search-api",
  "svc-reports": "reports-api",
  "svc-notify": "notify-worker",
};

const KNOWN_UNAVAILABLE = new Set([500, 502, 503]);
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export type MonitoringRecord = {
  service_id: string;
  service_name: string;
  timestamp: string;
  status_code: number;
  latency_ms: number | null;
  agent: string;
  region: string;
  is_available: boolean;
};

export type ImportSummary = {
  rowsReceived: number;
  rowsInserted: number;
  duplicatesRemoved: number;
  invalidRows: number;
  invalidTimestamps: number;
  missingLatency: number;
  invalidLatency: number;
  unknownStatuses: number;
  malformedRows: number;
};

export type ProcessCsvResult =
  | { ok: true; records: MonitoringRecord[]; summary: ImportSummary }
  | { ok: false; error: string };

type Candidate = MonitoringRecord & {
  latencyValid: boolean;
};

export function parseTimestampUtc(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    const numeric = Number(value);
    if (!Number.isSafeInteger(numeric)) return null;
    const millis = value.length >= 13 ? numeric : numeric * 1000;
    const date = new Date(millis);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    if (year < 2000 || year > 2100) return null;
    return date;
  }

  if (!ISO_TIMESTAMP.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function normalizeLatency(
  rawValue: string,
  rawUnit: string,
): { latencyMs: number | null; issue: "missing" | "invalid" | null } {
  const value = rawValue.trim();
  const unit = rawUnit.trim().toLowerCase();

  if (!value) {
    return { latencyMs: null, issue: "missing" };
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return { latencyMs: null, issue: "invalid" };
  }

  if (unit === "ms") {
    return { latencyMs: Math.round(numeric), issue: null };
  }

  if (unit === "s") {
    return { latencyMs: Math.round(numeric * 1000), issue: null };
  }

  return { latencyMs: null, issue: "invalid" };
}

export function classifyAvailability(statusCode: number): {
  isAvailable: boolean;
  unknownStatus: boolean;
} {
  if (statusCode === 200) {
    return { isAvailable: true, unknownStatus: false };
  }

  if (KNOWN_UNAVAILABLE.has(statusCode)) {
    return { isAvailable: false, unknownStatus: false };
  }

  return { isAvailable: false, unknownStatus: true };
}

export function observationKey(record: {
  service_id: string;
  timestamp: string;
  agent: string;
  region: string;
}): string {
  return `${record.service_id}|${record.timestamp}|${record.agent}|${record.region}`;
}

function emptySummary(): ImportSummary {
  return {
    rowsReceived: 0,
    rowsInserted: 0,
    duplicatesRemoved: 0,
    invalidRows: 0,
    invalidTimestamps: 0,
    missingLatency: 0,
    invalidLatency: 0,
    unknownStatuses: 0,
    malformedRows: 0,
  };
}

export function processCsvText(text: string): ProcessCsvResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "The CSV file is empty." };
  }

  const parsed = parseCsv(text);
  if (parsed.headers.length === 0) {
    return { ok: false, error: "The CSV file is empty." };
  }

  const missing = missingRequiredColumns(parsed.headers);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required columns: ${missing.join(", ")}.`,
    };
  }

  if (parsed.rows.length === 0) {
    return { ok: false, error: "The CSV file has headers but no data rows." };
  }

  const summary = emptySummary();
  summary.rowsReceived = parsed.rows.length;
  const kept = new Map<string, Candidate>();

  for (const row of parsed.rows) {
    if (row.malformed) {
      summary.malformedRows += 1;
      summary.invalidRows += 1;
      continue;
    }

    const raw = rowToRecord(parsed.headers, row.values);
    const candidate = buildCandidate(raw, summary);
    if (!candidate) {
      summary.invalidRows += 1;
      continue;
    }

    const key = observationKey(candidate);
    const existing = kept.get(key);
    if (!existing) {
      kept.set(key, candidate);
      continue;
    }

    summary.duplicatesRemoved += 1;
    // Same agent/service/time is one observation; keep the copy with usable latency.
    if (!existing.latencyValid && candidate.latencyValid) {
      kept.set(key, candidate);
    }
  }

  const records = [...kept.values()].map((candidate) => ({
    service_id: candidate.service_id,
    service_name: candidate.service_name,
    timestamp: candidate.timestamp,
    status_code: candidate.status_code,
    latency_ms: candidate.latency_ms,
    agent: candidate.agent,
    region: candidate.region,
    is_available: candidate.is_available,
  }));
  summary.rowsInserted = records.length;

  return { ok: true, records, summary };
}

function buildCandidate(
  raw: Record<string, string>,
  summary: ImportSummary,
): Candidate | null {
  const serviceId = (raw.service_id ?? "").trim();
  const serviceName = (raw.service_name ?? "").trim();
  const timestampRaw = raw.timestamp ?? "";
  const statusRaw = (raw.status_code ?? "").trim();
  const agent = (raw.agent ?? "").trim();
  const region = (raw.region ?? "").trim();

  if (!serviceId || !(serviceId in KNOWN_SERVICES)) {
    return null;
  }

  if (serviceName !== KNOWN_SERVICES[serviceId]) {
    return null;
  }

  const timestamp = parseTimestampUtc(timestampRaw);
  if (!timestamp) {
    summary.invalidTimestamps += 1;
    return null;
  }

  if (!/^\d+$/.test(statusRaw)) {
    return null;
  }

  const statusCode = Number(statusRaw);
  if (!Number.isSafeInteger(statusCode)) {
    return null;
  }

  if (!agent || !region) {
    return null;
  }

  const latency = normalizeLatency(raw.latency ?? "", raw.latency_unit ?? "");
  if (latency.issue === "missing") summary.missingLatency += 1;
  if (latency.issue === "invalid") summary.invalidLatency += 1;

  const availability = classifyAvailability(statusCode);
  if (availability.unknownStatus) summary.unknownStatuses += 1;

  return {
    service_id: serviceId,
    service_name: serviceName,
    timestamp: timestamp.toISOString(),
    status_code: statusCode,
    latency_ms: latency.latencyMs,
    agent,
    region,
    is_available: availability.isAvailable,
    latencyValid: latency.issue === null,
  };
}
