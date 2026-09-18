import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  classifyAvailability,
  normalizeLatency,
  observationKey,
  parseTimestampUtc,
  processCsvText,
} from "../../supabase/functions/process-csv/process.ts";
import { parseCsv } from "../../supabase/functions/process-csv/parser.ts";

const HEADER =
  "service_id,service_name,timestamp,status_code,latency,latency_unit,agent,region";

function csv(rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

function row(
  overrides: Partial<{
    service_id: string;
    service_name: string;
    timestamp: string;
    status_code: string;
    latency: string;
    latency_unit: string;
    agent: string;
    region: string;
  }> = {},
) {
  const data = {
    service_id: "svc-auth",
    service_name: "auth-api",
    timestamp: "2025-05-19T21:45:00Z",
    status_code: "200",
    latency: "150",
    latency_unit: "ms",
    agent: "agent-1",
    region: "ap-south-1",
    ...overrides,
  };
  return [
    data.service_id,
    data.service_name,
    data.timestamp,
    data.status_code,
    data.latency,
    data.latency_unit,
    data.agent,
    data.region,
  ].join(",");
}

describe("timestamp parsing", () => {
  it("parses ISO UTC timestamps", () => {
    const date = parseTimestampUtc("2025-05-19T21:45:00Z");
    assert.equal(date?.toISOString(), "2025-05-19T21:45:00.000Z");
  });

  it("parses unix timestamps as seconds", () => {
    const date = parseTimestampUtc("1745064900");
    assert.equal(date?.toISOString(), "2025-04-19T12:15:00.000Z");
  });

  it("parses ISO timestamps with timezone offsets", () => {
    const date = parseTimestampUtc("2025-04-18T02:00:00+05:30");
    assert.equal(date?.toISOString(), "2025-04-17T20:30:00.000Z");
  });

  it("treats offset and UTC forms of the same instant as equal", () => {
    const offset = parseTimestampUtc("2025-04-18T02:00:00+05:30");
    const utc = parseTimestampUtc("2025-04-17T20:30:00Z");
    assert.equal(offset?.toISOString(), utc?.toISOString());
  });

  it("rejects a missing timestamp", () => {
    assert.equal(parseTimestampUtc(""), null);
    assert.equal(parseTimestampUtc("   "), null);
  });

  it("rejects an invalid timestamp", () => {
    assert.equal(parseTimestampUtc("not-a-date"), null);
    assert.equal(parseTimestampUtc("2025-13-40T99:99:99Z"), null);
    assert.equal(parseTimestampUtc("123"), null);
  });
});

describe("latency normalization", () => {
  it("keeps millisecond values", () => {
    assert.deepEqual(normalizeLatency("500", "ms"), {
      latencyMs: 500,
      issue: null,
    });
  });

  it("converts seconds to milliseconds", () => {
    assert.deepEqual(normalizeLatency("0.5", "s"), {
      latencyMs: 500,
      issue: null,
    });
  });

  it("treats missing latency as nullable", () => {
    assert.deepEqual(normalizeLatency("", "ms"), {
      latencyMs: null,
      issue: "missing",
    });
  });

  it("treats negative latency as invalid", () => {
    assert.deepEqual(normalizeLatency("-286", "ms"), {
      latencyMs: null,
      issue: "invalid",
    });
  });

  it("treats unknown units as invalid", () => {
    assert.deepEqual(normalizeLatency("12", "minutes"), {
      latencyMs: null,
      issue: "invalid",
    });
  });
});

describe("availability classification", () => {
  it("marks 200 as available", () => {
    assert.deepEqual(classifyAvailability(200), {
      isAvailable: true,
      unknownStatus: false,
    });
  });

  it("marks 500, 502, and 503 as unavailable", () => {
    for (const status of [500, 502, 503]) {
      assert.deepEqual(classifyAvailability(status), {
        isAvailable: false,
        unknownStatus: false,
      });
    }
  });

  it("marks 999 as unavailable/unknown", () => {
    assert.deepEqual(classifyAvailability(999), {
      isAvailable: false,
      unknownStatus: true,
    });
  });
});

describe("csv processing", () => {
  it("parses quoted commas without treating them as new fields", () => {
    const parsed = parseCsv('service_id,note\n"svc-auth","hello, world"\n');
    assert.deepEqual(parsed.rows[0].values, ["svc-auth", "hello, world"]);
    assert.equal(parsed.rows[0].malformed, false);
  });

  it("returns a header error instead of inserting", () => {
    const result = processCsvText("foo,bar\n1,2\n");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Missing required columns/);
    }
  });

  it("keeps a row when latency is missing", () => {
    const result = processCsvText(csv([row({ latency: "" })]));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].latency_ms, null);
    assert.equal(result.summary.missingLatency, 1);
    assert.equal(result.summary.invalidRows, 0);
  });

  it("keeps a row when latency is negative", () => {
    const result = processCsvText(csv([row({ latency: "-286" })]));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.records[0].latency_ms, null);
    assert.equal(result.summary.invalidLatency, 1);
    assert.equal(result.summary.rowsInserted, 1);
  });

  it("discards a row with an invalid timestamp", () => {
    const result = processCsvText(csv([row({ timestamp: "nope" })]));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.summary.invalidTimestamps, 1);
    assert.equal(result.summary.invalidRows, 1);
    assert.equal(result.summary.rowsInserted, 0);
  });

  it("discards inconsistent service id/name pairs", () => {
    const result = processCsvText(
      csv([row({ service_id: "svc-auth", service_name: "payments-api" })]),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.summary.invalidRows, 1);
    assert.equal(result.summary.rowsInserted, 0);
  });

  it("removes duplicate observations after timestamp normalization", () => {
    const result = processCsvText(
      csv([
        row({ timestamp: "2025-04-18T02:00:00+05:30", latency: "150" }),
        row({ timestamp: "2025-04-17T20:30:00Z", latency: "150" }),
      ]),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.summary.rowsReceived, 2);
    assert.equal(result.summary.duplicatesRemoved, 1);
    assert.equal(result.summary.rowsInserted, 1);
    assert.equal(result.records[0].timestamp, "2025-04-17T20:30:00.000Z");
  });

  it("keeps the same service and timestamp from different agents", () => {
    const result = processCsvText(
      csv([row({ agent: "agent-1" }), row({ agent: "agent-2" })]),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.summary.rowsInserted, 2);
    assert.equal(result.summary.duplicatesRemoved, 0);
    const keys = result.records.map(observationKey).sort();
    assert.deepEqual(keys, [
      "svc-auth|2025-05-19T21:45:00.000Z|agent-1|ap-south-1",
      "svc-auth|2025-05-19T21:45:00.000Z|agent-2|ap-south-1",
    ]);
  });

  it("processes a unix timestamp row", () => {
    const result = processCsvText(csv([row({ timestamp: "1745064900" })]));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.records[0].timestamp, "2025-04-19T12:15:00.000Z");
  });

  it("classifies mixed status codes in one file", () => {
    const result = processCsvText(
      csv([
        row({ timestamp: "2025-05-08T00:00:00Z", status_code: "200" }),
        row({ timestamp: "2025-05-08T00:15:00Z", status_code: "500" }),
        row({ timestamp: "2025-05-08T00:30:00Z", status_code: "502" }),
        row({ timestamp: "2025-05-08T00:45:00Z", status_code: "503" }),
        row({ timestamp: "2025-05-08T01:00:00Z", status_code: "999" }),
      ]),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const byStatus = Object.fromEntries(
      result.records.map((record) => [record.status_code, record.is_available]),
    );
    assert.deepEqual(byStatus, {
      200: true,
      500: false,
      502: false,
      503: false,
      999: false,
    });
    assert.equal(result.summary.unknownStatuses, 1);
  });
});

describe("supplied datasets", () => {
  const files = [
    "monitoring_checks_9d_seed101.csv",
    "monitoring_checks_12d_seed505.csv",
    "monitoring_checks_14d_seed202.csv",
    "monitoring_checks_21d_seed303.csv",
    "monitoring_checks_30d_seed404.csv",
  ];

  for (const file of files) {
    it(`processes ${file}`, () => {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      const result = processCsvText(text);
      assert.equal(result.ok, true);
      if (!result.ok) return;

      assert.equal(
        result.summary.rowsInserted +
          result.summary.duplicatesRemoved +
          result.summary.invalidRows,
        result.summary.rowsReceived,
      );
      assert.ok(result.summary.rowsInserted > 0);
      assert.ok(result.summary.duplicatesRemoved > 0);
      assert.ok(result.summary.missingLatency > 0);
      assert.equal(result.summary.invalidLatency, 1);
      assert.equal(result.summary.unknownStatuses, 1);
      assert.equal(result.summary.invalidTimestamps, 0);
      assert.equal(result.summary.malformedRows, 0);
      assert.ok(result.records.every((record) => record.timestamp.endsWith("Z")));
      assert.ok(
        result.records.some((record) => record.agent === "agent-1") &&
          result.records.some((record) => record.agent === "agent-2"),
      );
      assert.ok(result.records.some((record) => record.status_code === 999));
      assert.ok(result.records.some((record) => record.latency_ms === null));
    });
  }
});
