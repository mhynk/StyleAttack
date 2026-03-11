import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { prompt_id: string } }
) {
  const r = await fetch(
    `http://localhost:8000/api/result/${params.prompt_id}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}