"use client";

type CsvUploadProps = {
  filename: string | null;
  status: "idle" | "processing" | "ready";
  error: string | null;
  disabled?: boolean;
  onUploadClick: () => void;
};

export function CsvUpload({
  filename,
  status,
  error,
  disabled = false,
  onUploadClick,
}: CsvUploadProps) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <div className="flex items-center gap-3">
        {filename ? (
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate font-mono text-[12px] text-zinc-700">
              {filename}
            </p>
            <p className="text-[11px] text-zinc-500">
              {status === "processing"
                ? "Processing monitoring data..."
                : status === "ready"
                  ? "Data processed successfully"
                  : "Selected"}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled}
          className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {status === "processing" ? "Processing..." : "Upload CSV"}
        </button>
      </div>
      {filename ? (
        <p className="truncate font-mono text-[12px] text-zinc-600 sm:hidden">
          {filename}
          {status === "processing"
            ? " · processing"
            : status === "ready"
              ? " · ready"
              : ""}
        </p>
      ) : null}
      {error ? <p className="text-[12px] text-red-700">{error}</p> : null}
    </div>
  );
}
