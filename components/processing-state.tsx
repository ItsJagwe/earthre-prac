type ProcessingStateProps = {
  filename: string;
};

export function ProcessingState({ filename }: ProcessingStateProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-6 py-16 text-center">
      <div
        className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800"
        aria-hidden
      />
      <p className="mt-4 text-[15px] font-medium text-zinc-900">
        Processing monitoring data...
      </p>
      <p className="mt-1 font-mono text-[12px] text-zinc-500">{filename}</p>
    </section>
  );
}
