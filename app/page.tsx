"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const DEFAULT_CALLBACK_URL = "https://authtest.mandip.dev/callback";

function normalizeUrl(input: string) {
  return input.trim().replace(/\/$/, "");
}

function buildLoginUrl(
  frontendUrl: string,
  callbackUrl: string,
  apiBase?: string
) {
  const frontend = new URL(frontendUrl);
  const callback = new URL(callbackUrl);

  if (apiBase?.trim()) {
    const api = new URL(apiBase.trim());
    callback.searchParams.set("api_base", normalizeUrl(api.toString()));
  }

  const callbackUrlWithParams = callback.toString();
  const frontendBase = normalizeUrl(frontend.toString());
  const redirectTo = `${frontendBase}/auth/bridge?dest=${encodeURIComponent(
    callbackUrlWithParams
  )}`;
  const loginUrl = `${frontendBase}/login?redirect_to=${encodeURIComponent(
    redirectTo
  )}`;

  return { loginUrl, redirectTo, callbackUrlWithParams, frontendBase };
}

export default function Home() {
  const [frontendUrl, setFrontendUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState(DEFAULT_CALLBACK_URL);
  const [apiBase, setApiBase] = useState("");
  const [error, setError] = useState("");

  const computed = useMemo(() => {
    if (!frontendUrl.trim() || !callbackUrl.trim()) return null;
    try {
      return buildLoginUrl(frontendUrl, callbackUrl, apiBase);
    } catch {
      return null;
    }
  }, [frontendUrl, callbackUrl, apiBase]);

  const handleStart = () => {
    setError("");
    if (!frontendUrl.trim()) {
      setError("Enter the AquaView frontend URL to continue.");
      return;
    }
    if (!callbackUrl.trim()) {
      setError("Enter the Hyperion callback URL to continue.");
      return;
    }

    try {
      const { loginUrl } = buildLoginUrl(frontendUrl, callbackUrl, apiBase);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "authtest_frontend",
          normalizeUrl(frontendUrl)
        );
        sessionStorage.setItem("authtest_callback", callbackUrl.trim());
        if (apiBase.trim()) {
          sessionStorage.setItem("authtest_api_base", normalizeUrl(apiBase));
        } else {
          sessionStorage.removeItem("authtest_api_base");
        }
      }
      window.location.href = loginUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid URLs. Please check your inputs."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8efe1,_transparent_55%),radial-gradient(circle_at_bottom,_#e1f2ee,_transparent_50%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              AquaView bridge auth test
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Validate the AquaView ↔ Hyperion bridge token flow
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              This test harness simulates Hyperion. It sends you through AquaView
              login, receives the bridge token in the URL fragment, exchanges it
              server-side, and shows the resulting user payload.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/status"
            >
              Status check
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              href="/callback"
            >
              Callback page
            </Link>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Step-by-step checklist
              </h2>
              <ol className="mt-4 grid gap-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold">
                    1
                  </span>
                  Enter the AquaView frontend URL (ngrok or staging).
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold">
                    2
                  </span>
                  Click “Start Login Test” to launch the login flow.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold">
                    3
                  </span>
                  Complete AquaView login and MFA if required.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold">
                    4
                  </span>
                  Confirm the user payload on the callback page.
                </li>
              </ol>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-600 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              <ul className="mt-4 grid gap-3">
                <li>
                  The backend proxy uses `AQUAVIEW_API_BASE` to exchange the
                  bridge token. Set it in your local `.env` or Vercel project
                  settings.
                </li>
                <li>
                  The bridge token arrives via `#bridge_token` in the URL fragment
                  and must be exchanged server-side.
                </li>
                <li>
                  The optional API base override is stored in session storage for
                  this tab only.
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
              <h2 className="text-lg font-semibold text-slate-900">
                Test configuration
              </h2>
              <div className="mt-4 grid gap-4 text-sm">
                <label className="grid gap-2">
                  <span className="font-medium text-slate-700">
                    AquaView frontend URL
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
                    placeholder="https://aquaview-staging.ngrok.app"
                    value={frontendUrl}
                    onChange={(event) => setFrontendUrl(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-medium text-slate-700">
                    Hyperion callback URL
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
                    value={callbackUrl}
                    onChange={(event) => setCallbackUrl(event.target.value)}
                  />
                </label>
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
                {error ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}
                <button
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
                  onClick={handleStart}
                >
                  Start Login Test
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-700">
              <h3 className="text-base font-semibold text-slate-900">
                Computed redirect URL
              </h3>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                For visibility while testing
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700">
                {computed ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500">redirect_to</span>
                      <div className="break-all text-slate-800">
                        {computed.redirectTo}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">login URL</span>
                      <div className="break-all text-slate-800">
                        {computed.loginUrl}
                      </div>
                    </div>
                  </div>
                ) : (
                  "Enter URLs above to preview the redirect and login URL."
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
