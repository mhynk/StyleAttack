import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const r = await fetch("http://localhost:8000/api/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}