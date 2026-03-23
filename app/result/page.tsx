"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type ResultRow = {
  id: number;
  prompt_id: number;
  prompt_text: string;
  category?: string;
  transformation_id?: number | null;
  style: string;
  transformed_text: string;
  model: string;
  response_text: string;
  label: string;
  created_at?: string;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "http://127.0.0.1:8000";

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/results`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Backend ${res.status}: ${msg}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    const token = localStorage.getItem("token");
    const url = `${API_BASE}/api/results/export/csv`;

    fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "results_export.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack Results</div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This page shows saved database results and allows export.
        </p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button className={styles.backButton} onClick={loadResults}>
            Refresh
          </button>
          <button className={styles.backButton} onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>

        {loading && <p className={styles.desc}>Loading results...</p>}
        {error && <p className={styles.desc}>Error: {error}</p>}

        {!loading && !error && (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Result ID</th>
                  <th style={thStyle}>Prompt ID</th>
                  <th style={thStyle}>Style</th>
                  <th style={thStyle}>Label</th>
                  <th style={thStyle}>Model</th>
                  <th style={thStyle}>Prompt</th>
                  <th style={thStyle}>Response</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.id}>
                    <td style={tdStyle}>{row.id}</td>
                    <td style={tdStyle}>{row.prompt_id}</td>
                    <td style={tdStyle}>{row.style}</td>
                    <td style={tdStyle}>{row.label}</td>
                    <td style={tdStyle}>{row.model}</td>
                    <td style={tdStyle}>{row.prompt_text}</td>
                    <td style={tdStyle}>{row.response_text}</td>
                    <td style={tdStyle}>
                      {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left" as const,
  background: "#f3f4f6",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  verticalAlign: "top" as const,
};