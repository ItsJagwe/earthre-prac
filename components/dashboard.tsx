"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { LogsSection } from "@/components/logs-section";
import { ProcessingState } from "@/components/processing-state";
import { ServiceOverview } from "@/components/service-overview";
import { StatsSection } from "@/components/stats-section";
import {
  PAGE_SIZE,
  dashboardSummary,
  filterLogsByDate,
  monitoringLogs,
  serviceSummaries,
} from "@/lib/mock-data";

type UploadStatus = "idle" | "processing" | "ready";

type DateFilter = {
  from: string;
  to: string;
};

const EMPTY_FILTER: DateFilter = { from: "", to: "" };

export function Dashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(true);
  const [draftFilter, setDraftFilter] = useState<DateFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<DateFilter>(EMPTY_FILTER);
  const [page, setPage] = useState(1);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFileSelected(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Select a .csv file.");
      return;
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    setError(null);
    setFilename(file.name);
    setStatus("processing");
    setDraftFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
    setPage(1);
    setStatsOpen(true);

    timeoutRef.current = setTimeout(() => {
      setStatus("ready");
      timeoutRef.current = null;
    }, 1400);
  }

  const filteredLogs = useMemo(
    () =>
      filterLogsByDate(
        monitoringLogs,
        appliedFilter.from,
        appliedFilter.to,
      ),
    [appliedFilter],
  );

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900">
      <DashboardHeader
        filename={filename}
        status={status}
        error={error}
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
          if (file) handleFileSelected(file);
        }}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
        {status === "idle" ? (
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

        {status === "processing" && filename ? (
          <ProcessingState filename={filename} />
        ) : null}

        {status === "ready" ? (
          <>
            <StatsSection
              summary={dashboardSummary}
              expanded={statsOpen}
              onToggle={() => setStatsOpen((open) => !open)}
            />
            <ServiceOverview services={serviceSummaries} />
            <LogsSection
              logs={pagedLogs}
              total={filteredLogs.length}
              page={currentPage}
              draftFilter={draftFilter}
              appliedFilter={appliedFilter}
              onDraftChange={setDraftFilter}
              onApply={() => {
                setAppliedFilter(draftFilter);
                setPage(1);
              }}
              onClear={() => {
                setDraftFilter(EMPTY_FILTER);
                setAppliedFilter(EMPTY_FILTER);
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
