import { NextResponse } from "next/server";

const DEFAULT_ERROR = "Bridge exchange failed.";

function normalizeBase(input: string) {
  return input.trim().replace(/\/$/, "");
}

export async function POST(req: Request) {
  let body: { token?: string; apiBase?: string } | null = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ detail: "token is required" }, { status: 400 });
  }

  const override = body?.apiBase?.trim();
  const base = override || process.env.AQUAVIEW_API_BASE;

  if (!base) {
    return NextResponse.json(
      { detail: "AQUAVIEW_API_BASE is not set" },
      { status: 500 }
    );
  }

  let apiBase = base;
  try {
    apiBase = normalizeBase(new URL(base).toString());
  } catch {
    return NextResponse.json(
      { detail: "apiBase must be a valid URL" },
      { status: 400 }
    );
  }

  const resp = await fetch(`${apiBase}/api/auth/bridge/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  const text = await resp.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text || DEFAULT_ERROR;
  }

  if (typeof data !== "object" || data === null) {
    data = { detail: data };
  }

  return NextResponse.json(data, { status: resp.status });
}
