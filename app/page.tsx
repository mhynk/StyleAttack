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

  async function onSubmit() {
    if (!canSubmit) return;
  
    try {
      // 1️ : prompt 저장
      const pRes = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt.trim(),
        }),
      });
  
      if (!pRes.ok) {
        const msg = await pRes.text();
        throw new Error(`Prompt save failed: ${msg}`);
      }
  
      const pJson = await pRes.json();
      const prompt_id = pJson.id;
  
      // 2️ : run 실행
      const rRes = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_id,
          styles: [style.toLowerCase()],
        }),
      });
  
      if (!rRes.ok) {
        const msg = await rRes.text();
        throw new Error(`Run failed: ${msg}`);
      }
  
      // 3️ : 결과 페이지 이동
      router.push(`/result?prompt_id=${prompt_id}&style=${style}`);
    } catch (err: any) {
      alert(err.message ?? "Something went wrong");
    }
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