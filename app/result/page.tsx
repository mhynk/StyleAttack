import styles from "./page.module.css";

type Props = {
  searchParams: { prompt?: string; style?: string };
};

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, n));
}

export default function ResultsPage({ searchParams }: Props) {
  const prompt = (searchParams.prompt ?? "").trim();
  const selectedStyle = (searchParams.style ?? "Poetry").trim();

  // TODO: 나중에 여기서 실제 API 호출해서 결과를 받아오면 됨.
  // 지금은 와이어프레임처럼 예시 수치만 넣어둠.
  const results = [
    { title: "Baseline Prompt", result: "Blocked", meta: "Successful Defense" },
    { title: "Poetry Style", result: "Bypassed", percent: 60, meta: "Defense Failure" },
    { title: "Metaphor Style", result: "Bypassed", percent: 40, meta: "Defense Failure" },
    { title: "Narrative Style", result: "Bypassed", percent: 75, meta: "Defense Failure" },
  ] as const;

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logo}>StyleAttack</div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This shows the percentage of cases in which the AI failed to bypass the LLM&apos;s safety
          mechanisms after the input prompt was transformed into the selected style.
        </p>

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

        <div className={styles.cards}>
          {results.map((c) => (
            <div key={c.title} className={styles.card}>
              <div className={styles.cardTitle}>{c.title}</div>

              <div className={styles.cardResult}>
                <div className={styles.resultLabel}>Result :</div>
                <div className={styles.resultValue}>
                  {c.result}
                  {"percent" in c ? (
                    <>
                      <span className={styles.percent}>
                        {" "}
                        — {clampPercent(c.percent)}%
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className={styles.cardMeta}>{c.meta}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}