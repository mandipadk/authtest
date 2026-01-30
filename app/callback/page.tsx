"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TOKEN_LABEL = "bridge_token";

type ExchangeState =
  | { status: "loading"; message: string }
  | { status: "error"; message: string; detail?: unknown; httpStatus?: number }
  | { status: "success"; message: string; payload: unknown };

function truncateToken(token: string) {
  if (token.length <= 16) return token;
  return `${token.slice(0, 10)}...${token.slice(-6)}`;
}

export default function CallbackPage() {
  const [state, setState] = useState<ExchangeState>({
    status: "loading",
    message: "Waiting for bridge token...",
  });
  const [token, setToken] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string | null>(null);
  const [frontend, setFrontend] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const parsedToken = new URLSearchParams(hash).get(TOKEN_LABEL);
    const queryParams = new URLSearchParams(window.location.search);
    const apiOverride = queryParams.get("api_base");
    const storedApi = sessionStorage.getItem("authtest_api_base");
    const storedFrontend = sessionStorage.getItem("authtest_frontend");

    setToken(parsedToken);
    setApiBase(apiOverride || storedApi);
    setFrontend(storedFrontend);

    if (!parsedToken) {
      setState({
        status: "error",
        message:
          "Missing bridge token. Make sure you completed the login flow and landed on the correct callback URL.",
      });
      return;
    }

    const payload = {
      token: parsedToken,
      apiBase: apiOverride || storedApi || undefined,
    };

    setState({ status: "loading", message: "Exchanging bridge token..." });

    fetch("/api/bridge-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
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
            message: detail || "Bridge exchange failed.",
            detail: data,
            httpStatus: res.status,
          });
          return;
        }

        setState({
          status: "success",
          message: "Exchange successful. User payload received.",
          payload: data,
        });
      })
      .catch((err) => {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Exchange failed.",
        });
      });
  }, []);

  const tokenPreview = useMemo(() => {
    if (!token) return "Unavailable";
    return truncateToken(token);
  }, [token]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f3f5f8,_transparent_55%),radial-gradient(circle_at_bottom,_#e7f2f7,_transparent_40%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bridge callback
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Token exchange results
            </h1>
            <p className="mt-3 text-base text-slate-600">
              The bridge token is read from the URL fragment and exchanged
              server-side with AquaView.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/"
            >
              Restart test
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/status"
            >
              Status check
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Exchange status
              </p>
              <p
                className={`mt-1 text-lg font-semibold ${
                  state.status === "success"
                    ? "text-emerald-600"
                    : state.status === "error"
                    ? "text-rose-600"
                    : "text-slate-700"
                }`}
              >
                {state.message}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {state.status === "loading" ? "Working..." : ""}
            </div>
          </div>

          <div className="mt-5 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Token preview
              </p>
              <p className="mt-2 font-mono text-xs text-slate-700">
                {tokenPreview}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                API base used
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                {apiBase || "(env: AQUAVIEW_API_BASE)"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Frontend used
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                {frontend || "(not captured)"}
              </p>
            </div>
          </div>
        </section>

        {state.status === "error" ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
            <h2 className="text-base font-semibold text-rose-700">
              Exchange failed
            </h2>
            <p className="mt-2">{state.message}</p>
            {state.httpStatus ? (
              <p className="mt-2 text-xs text-rose-600">
                HTTP status: {state.httpStatus}
              </p>
            ) : null}
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
              User payload
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
