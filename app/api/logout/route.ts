import { NextResponse } from "next/server";

const DEFAULT_ERROR = "Logout failed.";

function normalizeBase(input: string) {
  return input.trim().replace(/\/$/, "");
}

export async function POST(req: Request) {
  let body: { apiBase?: string } | null = null;

  try {
    body = await req.json();
  } catch {
    body = {};
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

  const resp = await fetch(`${apiBase}/api/auth/logout`, {
    method: "POST",
    headers: { Accept: "application/json" },
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
