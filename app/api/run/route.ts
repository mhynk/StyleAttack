import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const r = await fetch("http://localhost:8000/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") ?? "text/plain" },
    });
  } catch (err: any) {
    // 여기서 8000이 꺼져있거나 네트워크/파싱 에러면 다 잡힘
    console.error("Proxy /api/run failed:", err);
    return new NextResponse(
      `Proxy /api/run failed: ${err?.message ?? String(err)}`,
      { status: 500 }
    );
  }
}