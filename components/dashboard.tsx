"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { LogsSection } from "@/components/logs-section";
import { ProcessingState } from "@/components/processing-state";
import { ServiceOverview } from "@/components/service-overview";
import { StatsSection } from "@/components/stats-section";
import { formatNumber } from "@/lib/format";
import { uploadMonitoringCsv } from "@/lib/ingest-client";
import { fetchMonitoringChecks } from "@/lib/monitoring-api";
import {
  EMPTY_LOG_FILTER,
  PAGE_SIZE,
  buildDashboardModel,
  filterLogs,
  uniqueLogOptions,
  type DashboardModel,
  type LogFilter,
} from "@/lib/monitoring";

type UploadStatus = "idle" | "processing" | "ready" | "error";

export function Dashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [model, setModel] = useState<DashboardModel | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(true);
  const [draftFilter, setDraftFilter] = useState<LogFilter>(EMPTY_LOG_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<LogFilter>(EMPTY_LOG_FILTER);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void loadChecks();
  }, []);

  async function loadChecks() {
    try {
      const checks = await fetchMonitoringChecks();
      setModel(checks.length > 0 ? buildDashboardModel(checks) : null);
    } catch {
      setModel(null);
      setError("Could not load monitoring checks.");
    } finally {
      setHydrated(true);
    }
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleFileSelected(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Select a .csv file.");
      setStatus((current) => (current === "ready" ? "ready" : "error"));
      return;
    }

    setError(null);
    setResultMessage(null);
    setFilename(file.name);
    setStatus("processing");
    setDraftFilter(EMPTY_LOG_FILTER);
    setAppliedFilter(EMPTY_LOG_FILTER);
    setPage(1);
    setStatsOpen(true);

    const result = await uploadMonitoringCsv(file);
    if (!result.success) {
      setError(result.error);
      setStatus("error");
      return;
    }

    try {
      await loadChecks();
      setResultMessage(
        `Data processed successfully · ${formatNumber(result.summary.rowsInserted)} inserted`,
      );
      setStatus("ready");
    } catch {
      setError("The CSV was saved, but the dashboard could not reload it.");
      setStatus("error");
    }
  }

  const logOptions = useMemo(
    () => (model ? uniqueLogOptions(model.logs) : { services: [], statusCodes: [], agents: [] }),
    [model],
  );

  const filteredLogs = useMemo(() => {
    if (!model) return [];
    return filterLogs(model.logs, appliedFilter);
  }, [model, appliedFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const showDashboard = Boolean(model) && status !== "processing";

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900">
      <DashboardHeader
        filename={filename}
        status={status === "idle" && model ? "ready" : status}
        error={error}
        resultMessage={
          resultMessage ??
          (model && status === "idle"
            ? `${formatNumber(model.summary.totalChecks)} checks loaded`
            : null)
        }
        disabled={status === "processing"}
        onUploadClick={openFilePicker}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        aria-label="Upload monitoring CSV"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFileSelected(file);
        }}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
        {!hydrated && status !== "processing" ? (
          <ProcessingState title="Loading monitoring data..." />
        ) : null}

        {status === "processing" && filename ? (
          <ProcessingState
            title="Processing monitoring data..."
            detail={filename}
          />
        ) : null}

        {hydrated && !showDashboard && status !== "processing" ? (
          <section className="rounded-lg border border-dashed border-zinc-300 bg-white">
            <EmptyState
              title="No monitoring data yet"
              description="Upload a CSV of health-check logs to review availability, service-level SLA status, and the underlying checks."
              action={
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white hover:bg-zinc-800"
                >
                  Upload CSV
                </button>
              }
            />
          </section>
        ) : null}

        {showDashboard && model ? (
          <>
            <StatsSection
              summary={model.summary}
              expanded={statsOpen}
              onToggle={() => setStatsOpen((open) => !open)}
            />
            <ServiceOverview services={model.services} />
            <LogsSection
              logs={pagedLogs}
              total={filteredLogs.length}
              page={currentPage}
              periodStart={model.summary.periodStart}
              periodEnd={model.summary.periodEnd}
              draftFilter={draftFilter}
              appliedFilter={appliedFilter}
              services={logOptions.services}
              statusCodes={logOptions.statusCodes}
              agents={logOptions.agents}
              onDraftChange={setDraftFilter}
              onApply={() => {
                setAppliedFilter(draftFilter);
                setPage(1);
              }}
              onClear={() => {
                setDraftFilter(EMPTY_LOG_FILTER);
                setAppliedFilter(EMPTY_LOG_FILTER);
                setPage(1);
              }}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
