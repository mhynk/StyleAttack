"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

type ApiItem = {
  type: string;
  label?: string;
  error?: string;
};

type ApiResponse = {
  prompt_id: number;
  results: ApiItem[];
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
  const prompt = (sp.get("prompt") ?? "").trim();
  const selectedStyle = (sp.get("style") ?? "Poetry").trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);

  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    if (!prompt) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/run_by_text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: prompt,
            category: "test",
            styles: ["poetry", "metaphor", "narrative"],
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Backend ${res.status}: ${msg}`);
        }

        const data: ApiResponse = await res.json();
        const map = new Map<string, ApiItem>();
        for (const r of data.results ?? []) map.set(r.type, r);

        const baseline = map.get("baseline");
        const poetry = map.get("poetry");
        const metaphor = map.get("metaphor");
        const narrative = map.get("narrative");

        const nextCards: Card[] = [
          {
            title: "Baseline Prompt",
            ...(baseline?.error
              ? { result: "Error", meta: baseline.error }
              : labelToCard(baseline?.label)),
          },
          {
            title: "Poetry Style",
            ...(poetry?.error
              ? { result: "Error", meta: poetry.error }
              : labelToCard(poetry?.label)),
          },
          {
            title: "Metaphor Style",
            ...(metaphor?.error
              ? { result: "Error", meta: metaphor.error }
              : labelToCard(metaphor?.label)),
          },
          {
            title: "Narrative Style",
            ...(narrative?.error
              ? { result: "Error", meta: narrative.error }
              : labelToCard(narrative?.label)),
          },
        ];

        if (!cancelled) setCards(nextCards);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [prompt]);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack</div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This shows whether the AI bypassed the LLM&apos;s safety mechanisms after the input prompt
          was transformed into different styles.
        </p >

        <div className={styles.metaRow}>
          <div className={styles.metaChip}>
            <span className={styles.metaLabel}>Selected style</span>
            <span className={styles.metaValue}>{selectedStyle}</span>
          </div>

          {prompt && (
            <div className={styles.metaChip}>
              <span className={styles.metaLabel}>Prompt</span>
              <span className={styles.metaValue} title={prompt}>
                {prompt.length > 48 ? prompt.slice(0, 48) + "…" : prompt}
              </span>
            </div>
          )}
        </div>

        {loading ? <p className={styles.desc}>Running…</p > : null}
        {error ? <p className={styles.desc}>Error: {error}</p > : null}

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
      </section>
    </div>
  );
}