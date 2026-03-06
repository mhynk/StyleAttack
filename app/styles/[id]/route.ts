import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const r = await fetch(`${BACKEND}/api/styles/${params.id}`, { method: "DELETE" });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}