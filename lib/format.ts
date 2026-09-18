export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatLatency(ms: number): string {
  return `${Math.round(ms)} ms`;
}

export function formatTimestamp(iso: string): string {
  return `${iso.slice(0, 19).replace("T", " ")} UTC`;
}

export function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const startLabel = monthDay.format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

export function formatDayCount(startIso: string, endIso: string): string {
  const start = Date.parse(`${startIso.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${endIso.slice(0, 10)}T00:00:00Z`);
  const days = Math.round((end - start) / 86_400_000) + 1;
  return `${days} day${days === 1 ? "" : "s"}`;
}
