import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDashboardModel,
  filterLogsByDate,
  getCheckOutcome,
  type MonitoringCheck,
} from "./monitoring.ts";

function check(
  overrides: Partial<MonitoringCheck> & Pick<MonitoringCheck, "id">,
): MonitoringCheck {
  return {
    service_id: "svc-auth",
    service_name: "auth-api",
    timestamp: "2025-05-08T00:00:00.000Z",
    status_code: 200,
    latency_ms: 150,
    agent: "agent-1",
    region: "ap-south-1",
    is_available: true,
    ...overrides,
  };
}

describe("dashboard aggregation", () => {
  it("computes availability from persisted is_available flags", () => {
    const model = buildDashboardModel([
      check({ id: 1, is_available: true, status_code: 200 }),
      check({
        id: 2,
        timestamp: "2025-05-08T00:15:00.000Z",
        is_available: false,
        status_code: 500,
      }),
    ]);

    assert.equal(model.summary.totalChecks, 2);
    assert.equal(model.summary.successfulChecks, 1);
    assert.equal(model.summary.failedChecks, 1);
    assert.equal(model.summary.overallAvailability, 50);
  });

  it("does not treat missing latency as a failed check", () => {
    const model = buildDashboardModel([
      check({ id: 1, latency_ms: null, is_available: true, status_code: 200 }),
    ]);

    assert.equal(model.summary.failedChecks, 0);
    assert.equal(model.summary.avgLatencyMs, null);
    assert.equal(model.logs[0].latencyMs, null);
  });

  it("counts 999 as unavailable and below SLA when it is the only check", () => {
    const model = buildDashboardModel([
      check({
        id: 1,
        status_code: 999,
        is_available: false,
        service_id: "svc-payments",
        service_name: "payments-api",
      }),
    ]);

    assert.equal(getCheckOutcome(999), "unknown");
    assert.equal(model.summary.failedChecks, 1);
    assert.equal(model.summary.servicesBelowSla, 1);
  });

  it("groups service stats without inventing missing intervals", () => {
    const model = buildDashboardModel([
      check({ id: 1, service_id: "svc-auth", service_name: "auth-api" }),
      check({
        id: 2,
        service_id: "svc-search",
        service_name: "search-api",
        timestamp: "2025-05-08T00:15:00.000Z",
      }),
    ]);

    assert.equal(model.services.length, 2);
    assert.equal(model.summary.totalChecks, 2);
    assert.deepEqual(
      model.services.map((service) => service.id),
      ["svc-auth", "svc-search"],
    );
  });

  it("filters logs by UTC date", () => {
    const model = buildDashboardModel([
      check({ id: 1, timestamp: "2025-05-08T23:00:00.000Z" }),
      check({ id: 2, timestamp: "2025-05-09T01:00:00.000Z" }),
    ]);

    const filtered = filterLogsByDate(model.logs, "2025-05-09", "");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "2");
  });
});
