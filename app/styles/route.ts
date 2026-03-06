import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  const r = await fetch(`${BACKEND}/api/styles`, { cache: "no-store" });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${BACKEND}/api/styles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}