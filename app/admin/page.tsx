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

type ModelRow = {
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

export default function AdminPage() {
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
  const [modelsList, setModelsList] = useState<ModelRow[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  const [newModelName, setNewModelName] = useState("");
  const [newModelDisplayName, setNewModelDisplayName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState("ollama");
  const [newModelValue, setNewModelValue] = useState("");
  const [newModelActive, setNewModelActive] = useState(true);
  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const [newStyle, setNewStyle] = useState("");
  const [newInstruction, setNewInstruction] = useState("");
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [styleHistoryList, setStyleHistoryList] = useState<StyleHistoryRow[]>([]);
  const [styleHistoryLoading, setStyleHistoryLoading] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedStyleName, setSelectedStyleName] = useState("All Styles");
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [showStylesPanel, setShowStylesPanel] = useState(true);
  const [showModelsPanel, setShowModelsPanel] = useState(true);
  const [showStyleHistoryPanel, setShowStyleHistoryPanel] = useState(true);


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

  async function loadModels() {
  setLoadingModels(true);

  try {
    const res = await fetch(`${API_BASE}/api/admin/models`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      setMessage("Unauthorized. Please log in as admin.");
      return;
    }

    if (!res.ok) throw new Error("Failed to load models");

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];

    setModelsList(list);

    const activeModels = list.filter((m: ModelRow) => m.is_active);

    setSelectedModel((prev) => {
      if (prev && activeModels.some((m: ModelRow) => m.value === prev)) {
        return prev;
      }

      return activeModels[0]?.value || "";
    });
  } catch (err) {
    console.error(err);
    setMessage("Failed to load models.");
  } finally {
    setLoadingModels(false);
  }
}

  useEffect(() => {
    loadStyles();
    loadHistory();
    loadAllStyleHistory();
    loadModels();
  }, []);

  useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}, [history]);
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
    if (!v || !style.trim() || !selectedModel.trim()) return;

      setActiveIndex(0);

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

  function resetModelForm() {
  setNewModelName("");
  setNewModelDisplayName("");
  setNewModelProvider("ollama");
  setNewModelValue("");
  setNewModelActive(true);
  setEditingModelId(null);
}


    function handleEditModel(model: ModelRow) {
      setEditingModelId(model.id);
      setNewModelName(model.name);
      setNewModelDisplayName(model.display_name);
      setNewModelProvider(model.provider);
      setNewModelValue(model.model_name);
      setNewModelActive(model.is_active);
    }


    async function handleSaveModel() {
      const name = newModelName.trim();
      const displayName = newModelDisplayName.trim();
      const provider = newModelProvider.trim().toLowerCase();
      const modelName = newModelValue.trim();

      if (!name || !displayName || !modelName) {
        setMessage("Model name, display name, and Ollama model value are required.");
        return;
      }

      try {
        const isEditing = editingModelId !== null;

        const res = await fetch(
          isEditing
            ? `${API_BASE}/api/admin/models/${editingModelId}`
            : `${API_BASE}/api/admin/models`,
          {
            method: isEditing ? "PATCH" : "POST",
            headers: getAuthHeaders(true),
            body: JSON.stringify({
              name,
              display_name: displayName,
              provider,
              model_name: modelName,
              is_active: newModelActive,
            }),
          }
        );

        if (!res.ok) {
          const msg = await res.text();
          alert(`Save model failed (${res.status}): ${msg}`);
          return;
        }

        setMessage(isEditing ? `Updated model "${displayName}"` : `Added model "${displayName}"`);
        resetModelForm();
        await loadModels();
      } catch (err) {
        console.error(err);
        alert("Failed to save model");
      }
    }


    async function handleDeleteModel(id: number, name: string) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/models/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const msg = await res.text();
          alert(`Delete model failed (${res.status}): ${msg}`);
          return;
        }

        setMessage(`Deleted model "${name}"`);
        await loadModels();
      } catch (err) {
        console.error(err);
        alert("Failed to delete model");
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
        <div className={styles.contentStack}>
           <div className={styles.adminPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.adminTitle}>Run Prompt</h2>
                  <div className={styles.panelSubTitle}>Enter prompt, select style and model, then run.</div>
                </div>

                <button
                  className={styles.panelToggleBtn}
                  onClick={() => setShowPromptPanel((v) => !v)}
                >
                  {showPromptPanel ? "Collapse" : "Expand"}
                </button>
              </div>

              {showPromptPanel && (
                <div className={styles.panelBody}>
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
                            disabled={loadingModels || running}
                          >
                            {modelsList.filter((m) => m.is_active).length === 0 ? (
                              <option value="">No active models</option>
                            ) : (
                              modelsList
                                .filter((model) => model.is_active)
                                .map((model) => (
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
                </div>
              )}
            </div>

        <div className={styles.adminPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.adminTitle}>Manage Styles</h2>
              <div className={styles.panelSubTitle}>Add and manage style prompts.</div>
            </div>

            <button
              className={styles.panelToggleBtn}
              onClick={() => setShowStylesPanel((v) => !v)}
            >
              {showStylesPanel ? "Collapse" : "Expand"}
            </button>
          </div>

          {showStylesPanel && (
            <div className={styles.panelBody}>
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

              <div className={styles.panelScroll}>
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
              </div>
            </div>
          )}
        </div>
           <div className={styles.adminPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.adminTitle}>Manage Models</h2>
                  <div className={styles.panelSubTitle}>Add, edit, activate, or delete models.</div>
                </div>

                <button
                  className={styles.panelToggleBtn}
                  onClick={() => setShowModelsPanel((v) => !v)}
                >
                  {showModelsPanel ? "Collapse" : "Expand"}
                </button>
              </div>

              {showModelsPanel && (
                <div className={styles.panelBody}>
                  <div className={styles.adminRow}>
                    <input
                      className={styles.adminInput}
                      value={newModelName}
                      placeholder="Model key, e.g. llama3"
                      onChange={(e) => setNewModelName(e.target.value)}
                    />
                  </div>

                  <div className={styles.adminRow}>
                    <input
                      className={styles.adminInput}
                      value={newModelDisplayName}
                      placeholder="Display name, e.g. Llama 3"
                      onChange={(e) => setNewModelDisplayName(e.target.value)}
                    />
                  </div>

                  <div className={styles.adminRow}>
                    <input
                      className={styles.adminInput}
                      value={newModelValue}
                      placeholder="Ollama model name, e.g. llama3:latest"
                      onChange={(e) => setNewModelValue(e.target.value)}
                    />
                  </div>

                  <div className={styles.adminRow}>
                    <select
                      className={styles.select}
                      value={newModelProvider}
                      onChange={(e) => setNewModelProvider(e.target.value)}
                    >
                      <option value="ollama">Ollama</option>
                    </select>

                    <label className={styles.inlineCheck}>
                      <input
                        type="checkbox"
                        checked={newModelActive}
                        onChange={(e) => setNewModelActive(e.target.checked)}
                      />
                      <span>Active</span>
                    </label>

                    <button className={styles.adminAddButton} onClick={handleSaveModel}>
                      {editingModelId === null ? "Add Model" : "Save Model"}
                    </button>

                    {editingModelId !== null && (
                      <button className={styles.styleGhostButton} onClick={resetModelForm}>
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className={styles.panelScroll}>
                    <div className={styles.styleList}>
                      {modelsList.length === 0 ? (
                        <div className={styles.styleMeta}>No models yet.</div>
                      ) : (
                        modelsList.map((model) => (
                          <div key={model.id} className={styles.styleRow}>
                            <div className={styles.styleInfo}>
                              <span>{model.display_name}</span>
                              <span className={styles.styleMeta}>
                                {model.provider} · {model.model_name} ·{" "}
                                {model.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className={styles.styleActions}>
                              <button
                                className={styles.styleGhostButton}
                                onClick={() => handleEditModel(model)}
                              >
                                Edit
                              </button>

                              <button
                                className={styles.styleDeleteButton}
                                onClick={() => handleDeleteModel(model.id, model.display_name)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

           <div className={styles.adminPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.adminTitle}>Style Version History</h2>
                  <div className={styles.panelSubTitle}>Viewing: {selectedStyleName}</div>
                </div>

                <div className={styles.panelHeaderActions}>
                  <button
                    className={styles.styleGhostButton}
                    onClick={loadAllStyleHistory}
                  >
                    View All History
                  </button>

                  <button
                    className={styles.panelToggleBtn}
                    onClick={() => setShowStyleHistoryPanel((v) => !v)}
                  >
                    {showStyleHistoryPanel ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>

              {showStyleHistoryPanel && (
                <div className={styles.panelBody}>
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
                              <div><strong>Style Name:</strong> {item.name}</div>
                              <div><strong>Status:</strong> {item.is_active ? "Active" : "Inactive"}</div>
                              <div><strong>Changed By:</strong> {item.changed_by ?? "-"}</div>
                              <div><strong>Changed At:</strong> {new Date(item.changed_at).toLocaleString()}</div>
                              <div><strong>Instruction:</strong> {item.instruction}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}