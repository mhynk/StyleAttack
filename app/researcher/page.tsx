"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "http://127.0.0.1:8000";

type StyleOption = {
  id: number;
  name: string;
  display_name: string;
};

export default function PromptPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [stylesList, setStylesList] = useState<StyleOption[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && style.trim().length > 0,
    [prompt, style]
  );

  function getAuthHeaders(json = false) {
    const token = localStorage.getItem("token");
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

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

      if (!res.ok) {
        throw new Error("Failed to load styles");
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setStylesList(list);

      if (list.length > 0) {
        setStyle(list[0].name);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load styles.");
    } finally {
      setLoadingStyles(false);
    }
  }

  useEffect(() => {
    loadStyles();
  }, []);

  async function onSubmit() {
    if (!canSubmit) return;

    try {
      const res = await fetch(`${API_BASE}/api/run_by_text`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          text: prompt.trim(),
          category: "test",
          styles: [style],
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Run failed (${res.status}): ${msg}`);
        return;
      }

      const data = await res.json();

      router.push(
        `/result?prompt_id=${data.prompt_id}&style=${encodeURIComponent(style)}`
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  }

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack</div>
      </header>

      <section className={styles.center}>
        <h2 className={styles.title}>Enter your prompt to test.</h2>

        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            placeholder="Enter here."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />

          <div className={styles.sideControls}>
            <label className={styles.selectLabel}>
              <span className={styles.selectHint}>Style</span>
              <select
                className={styles.select}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={loadingStyles}
              >
                {stylesList.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {(opt.display_name || opt.name) + " Style"}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={styles.goButton}
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              Click
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}