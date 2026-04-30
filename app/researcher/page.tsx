"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "styleattack_researcher_history_v1";
const COLLAPSE_KEY = "styleattack_researcher_sidebar_collapsed_v1";
const API_BASE = "http://127.0.0.1:8000";

type StyleRow = {
  id: number;
  name: string;
  display_name: string;
  instruction: string;
  is_active: boolean;
};

type ModelOption = {
  id: number;
  name: string;
  value: string;
  label: string;
  display_name: string;
  provider: string;
  model_name: string;
  is_active: boolean;
};

type HistoryItem = {
  id: number;
  text: string;
  created_at?: string;
};

export default function ResearcherPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const [style, setStyle] = useState("");
  const [stylesList, setStylesList] = useState<StyleRow[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  function getAuthHeaders(json = false) {
    const token = localStorage.getItem("token");
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHistory(
              parsed
                .filter((item) => item && typeof item.text === "string")
                .map((item) => ({
                  id: Number(item.id),
                  text: item.text,
                  created_at: item.created_at,
                }))
            );
          }
        }

      const c = localStorage.getItem(COLLAPSE_KEY);
      if (c) setCollapsed(c === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  async function loadStyles() {
    setLoadingStyles(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/styles`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        setMessage("Please log in first.");
        setLoadingStyles(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to load styles");

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setStylesList(list);

      if (list.length > 0) {
        setStyle((prev) => prev || list[0].name);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load styles.");
    } finally {
      setLoadingStyles(false);
    }
  }

  async function loadModels() {
  setLoadingModels(true);

  try {
    const res = await fetch(`${API_BASE}/api/models`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      setMessage("Please log in first.");
      return;
    }

    if (!res.ok) throw new Error("Failed to load models");

    const data = await res.json();
    console.log("Loaded models:", data);
    const list = Array.isArray(data.models) ? data.models : [];

    setModelOptions(list);

    setSelectedModel((prev) => {
      if (prev && list.some((m: ModelOption) => m.value === prev)) {
        return prev;
      }

      return data.default || list[0]?.value || "";
    });
  } catch (err) {
    console.error(err);
    setMessage("Failed to load models.");
  } finally {
    setLoadingModels(false);
  }
}

      function handleBackToLogin() {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/");
    }

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/history`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load history");

      const data = await res.json();

    const items = Array.isArray(data)
      ? data.map((item) => ({
          id: item.id,
          text: item.text,
          created_at: item.created_at,
        }))
      : [];
      setHistory(items);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadStyles();
    loadHistory();
    loadHistory();
    loadModels()
  }, []);

    const canSubmit = useMemo(
      () =>
        prompt.trim().length > 0 &&
        style.trim().length > 0 &&
        selectedModel.trim().length > 0,
      [prompt, style, selectedModel]
    );

    const filtered = useMemo(() => {
      const q = filter.trim().toLowerCase();
      if (!q) return history.map((item, idx) => ({ item, idx }));

      return history
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.text.toLowerCase().includes(q));
    }, [history, filter]);

  function handleSubmit() {
    const v = prompt.trim();
    if (!v || !style.trim() || !selectedModel.trim() || running) return;

    setActiveIndex(0);
    setRunning(true);
      router.push(
      `/result?text=${encodeURIComponent(v)}&style=${encodeURIComponent(style)}&model=${encodeURIComponent(selectedModel)}`
    );

    setPrompt("");
  }

    function handlePick(item: HistoryItem, originalIndex: number) {
      setPrompt(item.text);
      setActiveIndex(originalIndex);
    }

    async function clearHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const msg = await res.text();
          alert(`Clear history failed (${res.status}): ${msg}`);
          return;
        }

        setHistory([]);
        setActiveIndex(null);
      } catch (err) {
        console.error(err);
        alert("Failed to clear history");
      }
    }

    async function deleteItem(item: HistoryItem, originalIndex: number) {
      try {
        const res = await fetch(`${API_BASE}/api/history/${item.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const msg = await res.text();
          alert(`Delete history failed (${res.status}): ${msg}`);
          return;
        }

        setHistory((prev) => prev.filter((x) => x.id !== item.id));

        setActiveIndex((cur) => {
          if (cur === null) return null;
          if (cur === originalIndex) return null;
          return cur > originalIndex ? cur - 1 : cur;
        });
      } catch (err) {
        console.error(err);
        alert("Failed to delete history item");
      }
    }

  return (
    <div className={styles.container}>
      <aside
        className={`${styles.sidebar} ${
          collapsed ? styles.sidebarCollapsed : ""
        }`}
      >
        <div className={styles.sidebarTop}>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button>

          {!collapsed && (
            <>
              <div className={styles.sidebarTitle}>History</div>
              <button className={styles.clearBtn} onClick={clearHistory}>
                Clear
              </button>
            </>
          )}
        </div>

        {!collapsed && (
          <>
            <div className={styles.filterWrap}>
              <input
                className={styles.filterInput}
                value={filter}
                placeholder="Search history..."
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className={styles.historyList}>
              {filtered.length === 0 ? (
                <div className={styles.emptyHint}>
                  {history.length === 0 ? "No history yet" : "No matches"}
                </div>
              ) : (
                filtered.map(({ item, idx }) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`${styles.historyRow} ${
                      activeIndex === idx ? styles.historyRowActive : ""
                    }`}
                  >
                    <button
                      className={styles.historyItem}
                      onClick={() => handlePick(item, idx)}
                      title={item.text}
                    >
                      {item.text}
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item,idx);
                      }}
                      aria-label="Delete history item"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div>
            <div className={styles.logoTitle}>StyleAttack Researcher</div>
            <div className={styles.logoSub}>
              sponsored by <span className={styles.logoSponsor}>Ada Analytics</span>
            </div>
          </div>

          <button className={styles.logoutButton} onClick={handleBackToLogin}>
            Back to Login
          </button>
        </div>

        <h1 className={styles.title}>Enter your Prompt.</h1>

        {message && <div className={styles.adminMessage}>{message}</div>}

        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            value={prompt}
            placeholder="Enter here..."
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
            <div className={styles.sideControls}>
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>
              <span className={styles.selectHint}>Style</span>
              <select
                className={styles.select}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={loadingStyles || running}
              >
                {stylesList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.display_name || s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectLabel}>
              <span className={styles.selectHint}>AI Model</span>
              <select
                  className={styles.select}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loadingModels || running}
                >
                  {modelOptions.length === 0 ? (
                    <option value="">No active models</option>
                  ) : (
                    modelOptions.map((model) => (
                      <option key={model.id} value={model.value}>
                        {model.label} ({model.model_name})
                      </option>
                    ))
                  )}
                </select>
            </label>
          </div>

          <button
            className={styles.goButton}
            onClick={handleSubmit}
            disabled={!canSubmit || running}
          >
            {running ? "Processing..." : "Click"}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}