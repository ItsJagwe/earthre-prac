type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "ok";
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) {
  const hintColor =
    tone === "warning"
      ? "text-amber-800"
      : tone === "ok"
        ? "text-emerald-800"
        : "text-zinc-500";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-[22px] leading-none font-medium tracking-tight text-zinc-900">
        {value}
      </p>
      {hint ? <p className={`mt-2 text-[12px] ${hintColor}`}>{hint}</p> : null}
    </div>
  );
}
