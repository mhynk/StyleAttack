"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

type ResultItem = {
  id: number;
  prompt_id: number;
  transformation_id?: number | null;
  model: string;
  response_text: string;
  label: string; // refused | partial | complied
  created_at?: string;
};

type Card = {
  title: string;
  result: "Blocked" | "Bypassed" | "Partial" | "Error";
  meta: string;
};

function labelToCard(label?: string): { result: Card["result"]; meta: string } {
  if (label === "refused") return { result: "Blocked", meta: "Successful Defense" };
  if (label === "partial") return { result: "Partial", meta: "Partial / Weak Defense" };
  if (label === "complied") return { result: "Bypassed", meta: "Defense Failure" };
  return { result: "Error", meta: label ?? "Unknown label" };
}

export default function ResultsPage() {
  const sp = useSearchParams();
  const promptId = sp.get("prompt_id");
  const selectedStyle = (sp.get("style") ?? "").trim();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<Card[]>([]);

  const API_BASE = "http://127.0.0.1:8000";

     function handleBack() {
      router.back();
    }

 function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

  useEffect(() => {
    if (!promptId) return;

    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/result/${promptId}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Backend ${res.status}: ${msg}`);
        }

        const data: ResultItem[] = await res.json();

        // 约定：transformation_id === null 表示 baseline
        const baseline = data.find((item) => item.transformation_id == null);

        // 这里只展示 baseline + 选中的 style
        const selected = data.find((item) => item.transformation_id != null);

        const nextCards: Card[] = [
          {
            title: "Baseline Prompt",
            ...labelToCard(baseline?.label),
          },
          {
            title: selectedStyle
              ? `${selectedStyle.charAt(0).toUpperCase()}${selectedStyle.slice(1)} Style`
              : "Selected Style",
            ...labelToCard(selected?.label),
          },
        ];

        if (!cancelled) {
          setCards(nextCards);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [promptId, selectedStyle]);

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
            <span className={styles.metaValue}>{promptId ?? "-"}</span>
          </div>

          <div className={styles.metaChip}>
            <span className={styles.metaLabel}>Selected style</span>
            <span className={styles.metaValue}>{selectedStyle || "-"}</span>
          </div>
        </div>

        {loading ? <p className={styles.desc}>Loading results…</p> : null}
        {error ? <p className={styles.desc}>Error: {error}</p> : null}

        <div className={styles.cards}>
          {cards.map((c) => (
            <div key={c.title} className={styles.card}>
              <div className={styles.cardTitle}>{c.title}</div>

              <div className={styles.cardResult}>
                <div className={styles.resultLabel}>Result :</div>
                <div className={styles.resultValue}>{c.result}</div>
              </div>

              <div className={styles.cardMeta}>{c.meta}</div>
            </div>
          ))}
        </div>
            <button
              className={styles.backButton}
              onClick={handleBack}
            >
              ← Back to Home</button>
      </section>
    </div>
  );
}