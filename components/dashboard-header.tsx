import { CsvUpload } from "@/components/csv-upload";

type DashboardHeaderProps = {
  filename: string | null;
  status: "idle" | "processing" | "ready";
  error: string | null;
  disabled?: boolean;
  onUploadClick: () => void;
};

export function DashboardHeader({
  filename,
  status,
  error,
  disabled,
  onUploadClick,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            SLA Monitoring
          </h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Monitor service availability and health-check performance.
          </p>
        </div>
        <CsvUpload
          filename={filename}
          status={status}
          error={error}
          disabled={disabled}
          onUploadClick={onUploadClick}
        />
      </div>
    </header>
  );
}
