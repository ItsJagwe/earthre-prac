export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          SLA Monitoring Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Upload monitoring CSV files, process them through a serverless
          function, and review service availability from persisted check data.
        </p>
      </div>
    </main>
  );
}
