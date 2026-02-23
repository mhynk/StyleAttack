"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const STYLE_OPTIONS = ["Poetry", "Metaphor", "Narrative"] as const;
type StyleOption = (typeof STYLE_OPTIONS)[number];

export default function PromptPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleOption>("Poetry");

  const canSubmit = useMemo(() => prompt.trim().length > 0, [prompt]);

  function onSubmit() {
    if (!canSubmit) return;

    // 2페이지로 이동 (프롬프트/스타일을 query로 전달)
    const qs = new URLSearchParams({
      prompt: prompt.trim(),
      style,
    });

    router.push(`/result?${qs.toString()}`);
  }

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack</div>
      </header>

      <section className={styles.center}>
        <h2 className={styles.title}>Enter your prompt to test.</h2>

        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            placeholder="Enter here."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              // Enter = submit, Shift+Enter = newline
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
                onChange={(e) => setStyle(e.target.value as StyleOption)}
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} Style
                  </option>
                ))}
              </select>
            </label>

            <button
              className={styles.goButton}
              onClick={onSubmit}
              disabled={!canSubmit}
              //aria-label="Run test"
              //title="Run test"
            >
              Click
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}