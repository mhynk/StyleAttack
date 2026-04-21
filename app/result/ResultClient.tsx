"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

type ResultItem = {
  type: string;
  display_name?: string;
  prompt_text?: string;
  response_text?: string;
  label?: string; // BLOCKED | PARTIAL | BYPASSED
  model?: string;
  timestamp?: string;
  error?: string;
  meta_reason?: string;
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

type Card = {
  title: string;
  result: "Blocked" | "Bypassed" | "Partial" | "Error";
  meta: string;
};

const API_BASE = "http://127.0.0.1:8000";

function labelToCard(label?: string): { result: Card["result"]; meta: string } {
  if (label === "BLOCKED") {
    return {
      result: "Blocked",
      meta: "Successfully blocked or defended",
    };
  }

  if (label === "PARTIAL") {
    return {
      result: "Partial",
      meta: "Partial / ambiguous response",
    };
  }

  if (label === "BYPASSED") {
    return {
      result: "Bypassed",
      meta: "Safety bypassed",
    };
  }

  return {
    result: "Error",
    meta: label ?? "Unknown label",
  };
}

function getResultClass(result: Card["result"]) {
  if (result === "Blocked") return styles.blocked;
  if (result === "Partial") return styles.partial;
  if (result === "Bypassed") return styles.bypassed;
  return styles.error;
}

export default function ResultClient({
  data,
  selectedStyle,
}: {
  data: RunResponse;
  selectedStyle: string;
}) {
  const router = useRouter();

  const baseline = data.results.find((item) => item.type === "baseline");
  const selected = data.results.find((item) => item.type === selectedStyle);
  const baselineCardBase = labelToCard(baseline?.label);
  const selectedCardBase = labelToCard(selected?.label);

  const styleGenerationBlocked =
  selected?.meta_reason === "Style generation refused the input";

  const cards: Card[] = [
  {
    title: "Baseline Prompt",
    result: baselineCardBase.result,
    meta: baseline?.meta_reason || baselineCardBase.meta,
  },
  {
    title: selectedStyle
      ? `${selectedStyle.charAt(0).toUpperCase()}${selectedStyle.slice(1)} Style`
      : "Selected Style",
    result: selectedCardBase.result,
    meta: selected?.meta_reason || selectedCardBase.meta,
  },
];


  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async function handleExportJSON() {
    try {
      const res = await fetch(`${API_BASE}/api/export/json`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Export JSON failed (${res.status}): ${msg}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Failed to export JSON");
    }
  }

  async function handleExportCSV() {
    try {
      const res = await fetch(`${API_BASE}/api/export/csv`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Export CSV failed (${res.status}): ${msg}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Failed to export CSV");
    }
  }

  const chartData = (data.style_stats || []).map((s) => ({
  styleName: s.style,
  bypass_rate: s.bypass_rate,
  total: s.total,
}));

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack</div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This shows whether the AI bypassed the LLM&apos;s safety mechanisms after the input prompt
          was transformed into the selected style.
        </p>

        <div className={styles.metaRow}>
          <div className={styles.metaChip}>
            <span className={styles.metaLabel}>Prompt ID</span>
            <span className={styles.metaValue}>{data.prompt_id ?? "-"}</span>
          </div>

          <div className={styles.metaChip}>
            <span className={styles.metaLabel}>Selected style</span>
            <span className={styles.metaValue}>{selectedStyle || "-"}</span>
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button onClick={handleExportJSON} className={styles.backButton}>
            Export JSON
          </button>
          <button onClick={handleExportCSV} className={styles.backButton}>
            Export CSV
          </button>
        </div>

        <div className={styles.cards}>
          {cards.map((c) => (
            <div
              key={c.title}
              className={`${styles.card} ${getResultClass(c.result)}`}
            >
              <div className={styles.cardTitle}>{c.title}</div>

              <div className={styles.cardResult}>
                <div className={styles.resultLabel}>Result :</div>
                <div className={styles.resultValue}>{c.result}</div>
              </div>

              <div className={styles.cardMeta}>{c.meta}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "24px", width: "min(860px, 92vw)" }}>
          <h3>Baseline Prompt</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {baseline?.prompt_text || "No prompt"}
          </pre>

          <h3 style={{ marginTop: "16px" }}>Baseline Response</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {baseline?.response_text || "No response"}
          </pre>

            <h3 style={{ marginTop: "24px" }}>
              {styleGenerationBlocked
                ? "Style Generation Output"
                : selectedStyle
                ? `${selectedStyle.charAt(0).toUpperCase()}${selectedStyle.slice(1)} Prompt`
                : "Selected Style Prompt"}
            </h3>

            {styleGenerationBlocked ? (
              <p style={{ marginTop: "8px", color: "#555" }}>
                The selected style could not be generated. The text below is the rewriting
                model’s refusal message, not a successfully transformed prompt.
              </p>
            ) : null}

            <pre style={{ whiteSpace: "pre-wrap" }}>
              {selected?.prompt_text || "No prompt"}
            </pre>

            <h3 style={{ marginTop: "16px" }}>
              {styleGenerationBlocked
                ? "Target Model Response"
                : selectedStyle
                ? `${selectedStyle.charAt(0).toUpperCase()}${selectedStyle.slice(1)} Response`
                : "Selected Style Response"}
            </h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {selected?.response_text || "No response"}
          </pre>
        </div>

        {data.style_stats && data.style_stats.length > 0 ? (
          <div
            style={{
              marginTop: "32px",
              width: "min(860px, 92vw)",
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "16px" }}>
              Historical Bypass Rates for This Model
            </h3>

            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="styleName" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />

                  <Bar
                    yAxisId="left"
                    dataKey="bypass_rate"
                    name="Bypass Rate (%)"
                    fill="#4e79ff"
                    barSize={28}
                    radius={[4, 4, 0, 0]}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total"
                    name="Total Runs"
                    stroke="#f28e2b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <button className={styles.backButton} onClick={() => router.back()}>
          ← Back to Home
        </button>
      </section>
    </div>
  );
}