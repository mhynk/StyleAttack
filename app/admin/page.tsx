"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "styleattack_admin_history_v1";
const COLLAPSE_KEY = "styleattack_admin_sidebar_collapsed_v1";

type StyleRow = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const [style, setStyle] = useState("");
  const [stylesList, setStylesList] = useState<StyleRow[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  const [newStyle, setNewStyle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));

      const c = localStorage.getItem(COLLAPSE_KEY);
      if (c) setCollapsed(c === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  async function loadStyles() {
    setLoadingStyles(true);
    try {
      const res = await fetch("/api/styles", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load styles");

      const data = await res.json();
      setStylesList(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        setStyle((prev) => prev || data[0].name);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load styles");
    } finally {
      setLoadingStyles(false);
    }
  }

  useEffect(() => {
    loadStyles();
  }, []);

  const canSubmit = useMemo(() => prompt.trim().length > 0, [prompt]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return history.map((item, idx) => ({ item, idx }));

    return history
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.toLowerCase().includes(q));
  }, [history, filter]);

  async function handleSubmit() {
    const v = prompt.trim();
    if (!v) return;

    setHistory((prev) => {
      const next = [v, ...prev.filter((x) => x !== v)];
      return next.slice(0, 50);
    });

    setActiveIndex(0);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: v,
          style: style,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Run failed (${res.status}): ${msg}`);
        return;
      }

      const data = await res.json();
      const prompt_id = data.prompt_id;

      router.push(`/result?prompt_id=${prompt_id}&style=${encodeURIComponent(style)}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setPrompt("");
  }

  function handlePick(item: string, originalIndex: number) {
    setPrompt(item);
    setActiveIndex(originalIndex);
  }

  function clearHistory() {
    setHistory([]);
    setActiveIndex(null);
  }

  function deleteItem(originalIndex: number) {
    setHistory((prev) => prev.filter((_, i) => i !== originalIndex));
    setActiveIndex((cur) => {
      if (cur === null) return null;
      if (cur === originalIndex) return null;
      return cur > originalIndex ? cur - 1 : cur;
    });
  }

  async function handleAddStyle() {
    const name = newStyle.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Add failed (${res.status}): ${msg}`);
        return;
      }

      setNewStyle("");
      setMessage(`Added "${name}"`);
      await loadStyles();
    } catch (err) {
      console.error(err);
      alert("Failed to add style");
    }
  }

  async function handleDeleteStyle(id: string, name: string) {
    try {
      const res = await fetch(`/api/styles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Delete failed (${res.status}): ${msg}`);
        return;
      }

      setMessage(`Deleted "${name}"`);
      await loadStyles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete style");
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
                    key={`${item}-${idx}`}
                    className={`${styles.historyRow} ${
                      activeIndex === idx ? styles.historyRowActive : ""
                    }`}
                  >
                    <button
                      className={styles.historyItem}
                      onClick={() => handlePick(item, idx)}
                      title={item}
                    >
                      {item}
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(idx);
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
          <div className={styles.logoTitle}>StyleAttack Admin</div>
          <div className={styles.logoSub}>
            sponsored by <span className={styles.logoSponsor}>Ada Analytics</span>
          </div>
        </div>

        <h1 className={styles.title}>Enter your Prompt.</h1>

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

          <select
            className={styles.select}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            aria-label="Style"
            title="Style"
            disabled={loadingStyles}
          >
            {stylesList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            className={styles.goButton}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Click
          </button>
        </div>

        <div className={styles.adminPanel}>
          <h2 className={styles.adminTitle}>Manage Styles</h2>

          {message && <div className={styles.adminMessage}>{message}</div>}

          <div className={styles.adminRow}>
            <input
              className={styles.adminInput}
              value={newStyle}
              placeholder="Add new style..."
              onChange={(e) => setNewStyle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStyle();
                }
              }}
            />
            <button className={styles.adminAddButton} onClick={handleAddStyle}>
              Add
            </button>
          </div>

          <div className={styles.styleList}>
            {stylesList.map((s) => (
              <div key={s.id} className={styles.styleRow}>
                <span>{s.name}</span>
                <button
                  className={styles.styleDeleteButton}
                  onClick={() => handleDeleteStyle(s.id, s.name)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}