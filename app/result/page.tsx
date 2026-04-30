import { cookies } from "next/headers";
import ResultClient from "./ResultClient";

const API_BASE = "http://127.0.0.1:8000";

type ResultItem = {
  type: string;
  display_name?: string;
  prompt_text?: string;
  response_text?: string;
  label?: string; // BLOCKED | PARTIAL | BYPASSED
  model?: string;
  timestamp?: string;
  error?: string;
};

type StyleStat = {
  style: string;
  total: number;
  bypassed: number;
  partial: number;
  blocked: number;
  bypass_rate: number;
  partial_rate: number;
  block_rate: number;
};

type RunResponse = {
  prompt_id: number;
  model: string;
  results: ResultItem[];
  style_stats?: StyleStat[];
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string; style?: string; model?: string }>;
}) {
  const sp = await searchParams;
  const text = (sp.text ?? "").trim();
  const selectedStyle = (sp.style ?? "").trim();
  const selectedModel = (sp.model ?? "").trim();
  const token = (await cookies()).get("token")?.value;

  if (!text || !selectedStyle || !selectedModel) {
   return <div style={{ padding: "40px" }}>Missing text, style, or model.</div>;
}

  const res = await fetch(`${API_BASE}/api/run_by_text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      text,
      category: "test",
      styles: [selectedStyle],
      model: selectedModel,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text();
    return (
      <div style={{ padding: "40px", color: "red" }}>
        Backend {res.status}: {msg}
      </div>
    );
  }

  const data: RunResponse = await res.json();

  return <ResultClient data={data} selectedStyle={selectedStyle} />;
}