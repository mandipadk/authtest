"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StatusState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "error"; message: string; detail?: unknown; httpStatus?: number }
  | { status: "success"; message: string; payload: unknown };

export default function StatusPage() {
  const [apiBase, setApiBase] = useState("");
  const [state, setState] = useState<StatusState>({
    status: "idle",
    message: "Run the check when you are ready.",
  });

  useEffect(() => {
    const storedApi = sessionStorage.getItem("authtest_api_base");
    if (storedApi) {
      setApiBase(storedApi);
    }
  }, []);

  const runCheck = async () => {
    setState({ status: "loading", message: "Checking /status..." });
    const params = new URLSearchParams();
    if (apiBase.trim()) {
      params.set("apiBase", apiBase.trim());
    }

    const url = params.toString() ? `/api/status?${params}` : "/api/status";

    try {
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      let data: unknown = text;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = text;
      }

      if (!res.ok) {
        const detail =
          typeof data === "object" && data
            ? (data as { detail?: string }).detail
            : undefined;
        setState({
          status: "error",
          message: detail || "Status check failed.",
          detail: data,
          httpStatus: res.status,
        });
        return;
      }

      setState({
        status: "success",
        message: "Status check succeeded.",
        payload: data,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Status check failed.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f2ec,_transparent_55%),radial-gradient(circle_at_bottom,_#e6f3f1,_transparent_45%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Connectivity
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              AquaView API status
            </h1>
            <p className="mt-3 text-base text-slate-600">
              This runs a server-side proxy call to `GET /status` on the AquaView
              API base.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/"
            >
              Back home
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/callback"
            >
              Callback page
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
          <div className="grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="font-medium text-slate-700">
                AquaView API base (optional override)
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
                placeholder="https://api-ngrok.ngrok-free.app"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
              />
            </label>
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              onClick={runCheck}
            >
              Run status check
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Result
            </p>
            <p className="mt-2 font-semibold text-slate-800">
              {state.message}
            </p>
            {state.status === "error" ? (
              <div className="mt-3 text-xs text-rose-600">
                {state.httpStatus ? `HTTP status: ${state.httpStatus}` : null}
              </div>
            ) : null}
          </div>
        </section>

        {state.status === "error" ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
            <h2 className="text-base font-semibold text-rose-700">
              Error details
            </h2>
            {state.detail ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-rose-200 bg-white/70 p-4 font-mono text-xs text-rose-700">
                {JSON.stringify(state.detail, null, 2)}
              </pre>
            ) : null}
          </section>
        ) : null}

        {state.status === "success" ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-800">
            <h2 className="text-base font-semibold text-emerald-700">
              Status payload
            </h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-emerald-200 bg-white/80 p-4 font-mono text-xs text-emerald-800">
              {JSON.stringify(state.payload, null, 2)}
            </pre>
          </section>
        ) : null}
      </div>
    </div>
  );
}
