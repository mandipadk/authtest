import { NextResponse } from "next/server";

const DEFAULT_ERROR = "Status check failed.";

function normalizeBase(input: string) {
  return input.trim().replace(/\/$/, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const override =
    searchParams.get("apiBase") || searchParams.get("api_base") || "";
  const base = override.trim() || process.env.AQUAVIEW_API_BASE;

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

  const resp = await fetch(`${apiBase}/status`, { cache: "no-store" });
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
