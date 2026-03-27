"use client";

import { useEffect, useMemo, useState } from "react";
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

type StyleStat = {
  style: string;
  total: number;
  bypassed: number;
  partial: number;
  blocked: number;
  bypass_rate: number;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [stats, setStats] = useState<StyleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

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

      if (data.length > 0) {
        const firstModel = data[0].model || "";
        setSelectedModel(firstModel);
      } else {
        setSelectedModel("");
        setStats([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(modelName: string) {
    if (!modelName) {
      setStats([]);
      return;
    }

    try {
      setStatsLoading(true);

      const res = await fetch(
        `${API_BASE}/api/results/stats/${encodeURIComponent(modelName)}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Stats ${res.status}: ${msg}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load model statistics");
    } finally {
      setStatsLoading(false);
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

  useEffect(() => {
    if (selectedModel) {
      loadStats(selectedModel);
    }
  }, [selectedModel]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(
      new Set(results.map((row) => row.model).filter(Boolean))
    );
    return uniqueModels.sort();
  }, [results]);

  const latestResultForSelectedModel = useMemo(() => {
    if (!selectedModel) return null;
    return results.find((row) => row.model === selectedModel) || null;
  }, [results, selectedModel]);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack Results</div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This page shows the latest test result and historical bypass statistics by model and style.
        </p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
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
          <>
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Current Test Result</h2>

              <div style={{ marginBottom: "12px" }}>
                <label htmlFor="model-select" style={{ marginRight: "8px", fontWeight: 600 }}>
                  Select Model:
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ padding: "8px", minWidth: "220px" }}
                >
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {latestResultForSelectedModel ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <div><strong>Model:</strong> {latestResultForSelectedModel.model}</div>
                  <div><strong>Style:</strong> {latestResultForSelectedModel.style}</div>
                  <div><strong>Classification:</strong> {latestResultForSelectedModel.label}</div>
                  <div><strong>Prompt:</strong> {latestResultForSelectedModel.prompt_text}</div>
                  <div><strong>Response:</strong> {latestResultForSelectedModel.response_text}</div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {latestResultForSelectedModel.created_at
                      ? new Date(latestResultForSelectedModel.created_at).toLocaleString()
                      : ""}
                  </div>
                </div>
              ) : (
                <p className={styles.desc}>No result found for the selected model.</p>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Historical Bypass Rates by Style</h2>

              {statsLoading ? (
                <p className={styles.desc}>Loading model statistics...</p>
              ) : stats.length === 0 ? (
                <p className={styles.desc}>No historical statistics available for this model.</p>
              ) : (
                <div style={{ overflowX: "auto", width: "100%" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Style</th>
                        <th style={thStyle}>Total Tests</th>
                        <th style={thStyle}>Bypassed</th>
                        <th style={thStyle}>Partial</th>
                        <th style={thStyle}>Blocked</th>
                        <th style={thStyle}>Bypass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((row) => (
                        <tr key={row.style}>
                          <td style={tdStyle}>{row.style}</td>
                          <td style={tdStyle}>{row.total}</td>
                          <td style={tdStyle}>{row.bypassed}</td>
                          <td style={tdStyle}>{row.partial}</td>
                          <td style={tdStyle}>{row.blocked}</td>
                          <td style={tdStyle}>{row.bypass_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>All Saved Results</h2>

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
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const cardStyle = {
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "20px",
  width: "100%",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "16px",
};

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