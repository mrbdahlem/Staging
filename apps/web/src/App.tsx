import { useEffect, useState } from "react";

import type { HealthStatus } from "@staging/shared";

const fallbackStatus: HealthStatus = {
  checkedAt: "pending",
  status: "unknown"
};

function isHealthStatus(value: unknown): value is HealthStatus {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.checkedAt === "string" &&
    (candidate.status === "degraded" || candidate.status === "ok" || candidate.status === "unknown")
  );
}

export function App() {
  const [health, setHealth] = useState<HealthStatus>(fallbackStatus);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health request failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isHealthStatus(payload)) {
          throw new Error("Health response payload was invalid");
        }

        return payload;
      })
      .then((payload) => {
        if (!cancelled) {
          setHealth(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            checkedAt: new Date().toISOString(),
            status: "degraded"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(235,114,71,0.32),_transparent_34%),linear-gradient(135deg,_#1f2833,_#11151b_62%,_#2f3d2f)] px-4 py-6 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6">
        <section
          className="self-end rounded-[1.5rem] border border-white/12 bg-slate-950/70 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur"
          aria-labelledby="app-title"
        >
          <p className="mb-3 text-sm uppercase tracking-[0.16em] text-amber-300">Phase 1 Bootstrap</p>
          <h1 id="app-title" className="font-display text-5xl leading-none sm:text-7xl">
            Staging
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
          A lightweight deployment dashboard for importing build artifacts and shipping them to staging environments.
          </p>
        </section>

        <section
          className="rounded-[1.5rem] border border-white/12 bg-slate-950/70 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur"
          aria-labelledby="status-title"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="status-title" className="font-display text-2xl">
                Server status
              </h2>
              <p className="text-sm text-slate-300">The frontend is already wired to the backend health endpoint.</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-emerald-400/35 bg-emerald-400/12 px-3 py-1 text-sm font-medium text-emerald-200">
              Bootstrap ready
            </span>
          </div>

          <dl className="mt-6 grid gap-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-semibold text-amber-300">Health</dt>
              <dd data-testid="health-status" className="capitalize text-white">
                {health.status}
              </dd>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-semibold text-amber-300">Checked</dt>
              <dd className="text-slate-200">{health.checkedAt}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
