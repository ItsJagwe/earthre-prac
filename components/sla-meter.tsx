import { SLA_THRESHOLD } from "@/lib/mock-data";

type SlaMeterProps = {
  value: number;
};

export function SlaMeter({ value }: SlaMeterProps) {
  const min = 99;
  const max = 100;
  const clamped = Math.min(max, Math.max(min, value));
  const fill = ((clamped - min) / (max - min)) * 100;
  const mark = ((SLA_THRESHOLD - min) / (max - min)) * 100;
  const below = value < SLA_THRESHOLD;

  return (
    <div className="mt-3">
      <div className="relative h-1.5 rounded-full bg-zinc-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${
            below ? "bg-amber-500" : "bg-emerald-600"
          }`}
          style={{ width: `${fill}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-zinc-400"
          style={{ left: `${mark}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
        <span>99.0%</span>
        <span>99.9% SLA</span>
        <span>100%</span>
      </div>
    </div>
  );
}
