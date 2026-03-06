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
  label: string; // "Blocked" | "Bypassed" etc.
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

function labelToBadge(label: string): "ok" | "bad" | "unknown" {
  const low = label.toLowerCase();
  if (low.includes("block")) return "ok";
  if (low.includes("bypass")) return "bad";
  return "unknown";
}

function badgeText(meta: string) {
  if (meta === "Successful Defense") return "Defense OK";
  if (meta === "Defense Failure") return "Bypass";
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

      const baseline = data.find((r) => r.transformation_id === null);
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
        })),
      ];
    }
  }

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <div className={styles.logo}>StyleAttack</div>
          <div className={styles.sponsor}>
            sponsored by <strong>Ada Analytics</strong>
          </div>
        </div>
      </header>

      <section className={styles.body}>
        <p className={styles.desc}>
          This shows outcomes for the baseline prompt and its style-transformed variants. Use the
          results to assess whether the transformation increased or decreased safety bypass success.
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
          {cards.map((c) => {
            const badgeKind = labelToBadge(c.result);
            const meta = c.meta;
            const badgeClass =
              badgeKind === "ok"
                ? styles.badgeOk
                : badgeKind === "bad"
                ? styles.badgeBad
                : styles.badgeUnknown;

            return (
              <div key={c.title} className={styles.card}>
                <div className={styles.cardTitle}>{c.title}</div>

                <div className={`${styles.badge} ${badgeClass}`}>
                  {badgeText(meta)}
                </div>

                <div className={styles.cardResult}>
                  <div className={styles.resultLabel}>Result</div>
                  <div className={styles.resultValue}>
                    {c.result}
                    {typeof c.percent === "number" ? (
                      <span className={styles.percent}> — {clampPercent(c.percent)}%</span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.cardMeta}>{meta}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}