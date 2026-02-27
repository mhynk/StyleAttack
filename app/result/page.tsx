import styles from "./page.module.css";

type Props = {
  searchParams: { prompt_id?: string; style?: string };
};

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, n));
}

type DbResult = {
  id: number;
  prompt_id: number;
  transformation_id: number | null;
  label: string; // "Blocked" | "Bypassed" 등
};

type Card = {
  title: string;
  result: string;
  percent?: number;
  meta: string;
};

function labelToMeta(label: string) {
  const low = label.toLowerCase();
  if (low.includes("block")) return "Successful Defense";
  if (low.includes("bypass")) return "Defense Failure";
  return "Unknown";
}

export default async function ResultsPage({ searchParams }: Props) {
  const promptIdStr = searchParams.prompt_id ?? "";
  const prompt_id = Number(promptIdStr);
  const selectedStyle = (searchParams.style ?? "Poetry").trim();

  let cards: Card[] = [];

  if (!prompt_id || Number.isNaN(prompt_id)) {
    cards = [{ title: "Error", result: "Missing prompt_id", meta: "Invalid URL" }];
  } else {
    // ✅ Next 프록시로 GET
    const res = await fetch(`http://localhost:3000/api/result/${prompt_id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const msg = await res.text();
      cards = [{ title: "Error", result: "Failed to load", meta: msg }];
    } else {
      const data = (await res.json()) as DbResult[];

      // 최신순으로 온다고 했으니, baseline 하나만 잡기
      const baseline = data.find((r) => r.transformation_id === null);

      // 스타일 결과들(지금은 style 이름을 dbResult에서 못 뽑으니 그냥 “Style #”로 표시)
      const styled = data.filter((r) => r.transformation_id !== null);

      cards = [
        {
          title: "Baseline Prompt",
          result: baseline?.label ?? "N/A",
          meta: baseline ? labelToMeta(baseline.label) : "No baseline result",
        },
        ...styled.map((r, idx) => ({
          title: `Style Variant ${idx + 1}`,
          result: r.label,
          meta: labelToMeta(r.label),
          // percent 없으니 생략 or 임시 0
          // percent: 0,
        })),
      ];
    }
  }

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
          <div className={styles.metaChip}>
            <span className={styles.metaLabel}>Prompt ID</span>
            <span className={styles.metaValue}>{prompt_id || "N/A"}</span>
          </div>
        </div>

        <div className={styles.cards}>
          {cards.map((c) => (
            <div key={c.title} className={styles.card}>
              <div className={styles.cardTitle}>{c.title}</div>

              <div className={styles.cardResult}>
                <div className={styles.resultLabel}>Result :</div>
                <div className={styles.resultValue}>
                  {c.result}
                  {typeof c.percent === "number" ? (
                    <span className={styles.percent}> — {clampPercent(c.percent)}%</span>
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