import { getCheckOutcome } from "@/lib/monitoring";

const STYLES = {
  available:
    "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  unavailable: "bg-red-50 text-red-800 ring-red-200/80",
  unknown: "bg-zinc-100 text-zinc-700 ring-zinc-200",
} as const;

const LABELS = {
  available: "Available",
  unavailable: "Unavailable",
  unknown: "Unknown",
} as const;

type StatusBadgeProps = {
  statusCode: number;
};

export function StatusBadge({ statusCode }: StatusBadgeProps) {
  const outcome = getCheckOutcome(statusCode);

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STYLES[outcome]}`}
      >
        {LABELS[outcome]}
      </span>
      <span className="font-mono text-[12px] text-zinc-500">{statusCode}</span>
    </span>
  );
}
