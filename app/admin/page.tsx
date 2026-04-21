"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "styleattack_admin_history_v1";
const COLLAPSE_KEY = "styleattack_admin_sidebar_collapsed_v1";
const API_BASE = "http://127.0.0.1:8000";

type StyleRow = {
  id: number;
  name: string;
  display_name: string;
  instruction: string;
  is_active: boolean;
};

type StyleHistoryRow = {
  id: number;
  original_style_id: number;
  version: number;
  action: "CREATED" | "UPDATED" | "DELETED";
  name: string;
  display_name: string;
  instruction: string;
  is_active: boolean;
  changed_by: number | null;
  changed_at: string;
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
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const modelOptions = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "claude-3", label: "Claude 3" },
  { value: "llama-3", label: "Llama 3" },
];

  const [newStyle, setNewStyle] = useState("");
  const [newInstruction, setNewInstruction] = useState("");
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [styleHistoryList, setStyleHistoryList] = useState<StyleHistoryRow[]>([]);
  const [styleHistoryLoading, setStyleHistoryLoading] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedStyleName, setSelectedStyleName] = useState("All Styles");


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
      if (raw) setHistory(JSON.parse(raw));

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

  async function loadStyles() {
    setLoadingStyles(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/styles`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        setMessage("Unauthorized. Please log in as admin.");
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
      setMessage("Failed to load styles");
    } finally {
      setLoadingStyles(false);
    }
  }

  useEffect(() => {
    loadStyles();
    loadHistory();
    loadAllStyleHistory();
  }, []);

  useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}, [history]);
  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && style.trim().length > 0,
    [prompt, style]
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return history.map((item, idx) => ({ item, idx }));

    return history
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.toLowerCase().includes(q));
  }, [history, filter]);

   function handleSubmit() {
  const v = prompt.trim();
  if (!v) return;

  setHistory((prev) => {
    const next = [v, ...prev.filter((x) => x !== v)];
    return next.slice(0, 50);
  });

  setActiveIndex(0);

  router.push(
  `/result?text=${encodeURIComponent(v)}&style=${encodeURIComponent(style)}&model=${encodeURIComponent(selectedModel)}`
);

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
    const instruction = newInstruction.trim();

    if (!name || !instruction) {
      setMessage("Style name and instruction are required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/styles`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          name: name.toLowerCase(),
          display_name: name,
          instruction,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Add failed (${res.status}): ${msg}`);
        return;
      }

      setNewStyle("");
      setNewInstruction("");
      setMessage(`Added "${name}"`);
      await loadStyles();
      await loadAllStyleHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to add style");
    }
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
    const texts = Array.isArray(data) ? data.map((item) => item.text) : [];
    setHistory(texts);
  } catch (err) {
    console.error(err);
  }
}

    async function loadAllStyleHistory() {
          setStyleHistoryLoading(true);

          try {
            const res = await fetch(`${API_BASE}/api/admin/styles/history`, {
              method: "GET",
              headers: getAuthHeaders(),
              cache: "no-store",
            });

            if (!res.ok) throw new Error("Failed to load style history");

            const data = await res.json();
            setStyleHistoryList(Array.isArray(data) ? data : []);
            setSelectedStyleId(null);
            setSelectedStyleName("All Styles");
          } catch (err) {
            console.error(err);
            setMessage("Failed to load style version history");
          } finally {
            setStyleHistoryLoading(false);
          }
        }

    async function loadStyleHistory(styleId: number, styleName: string) {
      setStyleHistoryLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/admin/styles/${styleId}/history`, {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load style history");

        const data = await res.json();
        setStyleHistoryList(Array.isArray(data) ? data : []);
        setSelectedStyleId(styleId);
        setSelectedStyleName(styleName);
      } catch (err) {
        console.error(err);
        setMessage(`Failed to load history for "${styleName}"`);
      } finally {
        setStyleHistoryLoading(false);
      }
    }

  async function handleDeleteStyle(id: number, name: string) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/styles/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Delete failed (${res.status}): ${msg}`);
        return;
      }

      setMessage(`Deleted "${name}"`);
      await loadStyles();
      await loadAllStyleHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to delete style");
    }
  }


  function handleBackToLogin() {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
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
                  aria-label="Style"
                  title="Style"
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
                  disabled={running}
                >
                  {modelOptions.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
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

        <div className={styles.adminPanel}>
          <h2 className={styles.adminTitle}>Manage Styles</h2>

          {message && <div className={styles.adminMessage}>{message}</div>}

          <div className={styles.adminRow}>
            <input
              className={styles.adminInput}
              value={newStyle}
              placeholder="Add new style name..."
              onChange={(e) => setNewStyle(e.target.value)}
            />
          </div>

          <div className={styles.adminRow}>
            <input
              className={styles.adminInput}
              value={newInstruction}
              placeholder="Add style instruction..."
              onChange={(e) => setNewInstruction(e.target.value)}
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
            <div
              key={s.id}
              className={`${styles.styleRow} ${
                selectedStyleId === s.id ? styles.styleRowSelected : ""
              }`}
              onClick={() => loadStyleHistory(s.id, s.display_name || s.name)}
            >
              <div className={styles.styleInfo}>
                <span>{s.display_name || s.name}</span>
                <span className={styles.styleMeta}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className={styles.styleActions}>
                <button
                  className={styles.styleDeleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStyle(s.id, s.name);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
            <div className={styles.styleHistoryPanel}>
              <div className={styles.styleHistoryHeader}>
                <div className={styles.styleHistoryHeaderLeft}>
                  <div className={styles.styleHistoryTitle}>Style Version History</div>
                  <div className={styles.styleHistorySubtitle}>
                    Viewing: {selectedStyleName}
                  </div>
                </div>

                <button
                  className={styles.styleGhostButton}
                  onClick={loadAllStyleHistory}
                >
                  View All History
                </button>
              </div>

              <div className={styles.styleHistoryScroll}>
                {styleHistoryLoading ? (
                  <div className={styles.styleHistoryEmpty}>Loading style history...</div>
                ) : styleHistoryList.length === 0 ? (
                  <div className={styles.styleHistoryEmpty}>No style history yet.</div>
                ) : (
                  <div className={styles.styleHistoryGrid}>
                    {styleHistoryList.map((item) => (
                      <div
                        key={`${item.original_style_id}-${item.version}-${item.id}`}
                        className={styles.styleHistoryCard}
                      >
                        <div className={styles.styleHistoryCardTop}>
                          <div className={styles.styleHistoryCardTitle}>
                            {item.display_name || item.name} · v{item.version}
                          </div>

                          <span
                            className={`${styles.styleHistoryBadge} ${
                              item.action === "CREATED"
                                ? styles.styleHistoryBadgeCreated
                                : item.action === "UPDATED"
                                ? styles.styleHistoryBadgeUpdated
                                : styles.styleHistoryBadgeDeleted
                            }`}
                          >
                            {item.action}
                          </span>
                        </div>

                        <div className={styles.styleHistoryBody}>
                          <div>
                            <strong>Style Name:</strong> {item.name}
                          </div>
                          <div>
                            <strong>Status:</strong> {item.is_active ? "Active" : "Inactive"}
                          </div>
                          <div>
                            <strong>Changed By:</strong> {item.changed_by ?? "-"}
                          </div>
                          <div>
                            <strong>Changed At:</strong>{" "}
                            {new Date(item.changed_at).toLocaleString()}
                          </div>
                          <div>
                            <strong>Instruction:</strong> {item.instruction}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

        </div>
      </main>
    </div>
  );
}