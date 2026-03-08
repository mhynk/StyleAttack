"""Export results to CSV/JSON (flat rows) for dashboards and analysis.

Run from backend/:

  python -m db.export --format csv --out ../data/exports/styleattack.csv
  python -m db.export --format json --out ../data/exports/styleattack.json
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

try:
    from db.database import get_session
    from db.models import Prompt, Transformation, Result
except ImportError:  # pragma: no cover
    from .database import get_session
    from .models import Prompt, Transformation, Result


def fetch_rows(db: Session):
    stmt = (
        select(
            Prompt.id.label("prompt_id"),
            Prompt.prompt_text,
            Prompt.meta.label("prompt_metadata"),
            Transformation.id.label("transformation_id"),
            Transformation.style_type,
            Transformation.transformed_text,
            Transformation.transform_meta,
            Result.model_provider,
            Result.model_name,
            Result.model_meta,
            Result.outcome_label,
            Result.response_text,
            Result.response_meta,
            Result.created_at,
        )
        .join(Transformation, Transformation.prompt_id == Prompt.id)
        .join(Result, Result.transformation_id == Transformation.id)
        .order_by(Prompt.id, Transformation.style_type, Result.model_name, Result.created_at)
    )
    res = db.execute(stmt).all()
    rows = []
    for r in res:
        d = dict(r._mapping)
        if d.get("created_at") is not None:
            d["created_at"] = d["created_at"].isoformat()
        rows.append(d)
    return rows


def export_csv(rows: list[dict], out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)

    headers = [
        "prompt_id","prompt_text","prompt_metadata",
        "transformation_id","style_type","transformed_text","transform_meta",
        "model_provider","model_name","model_meta",
        "outcome_label","response_text","response_meta","created_at"
    ]
    if rows:
        headers = list(rows[0].keys())

    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        for row in rows:
            w.writerow(row)


def export_json(rows: list[dict], out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", choices=["csv","json"], required=True)
    ap.add_argument("--out", required=True, help="output path")
    args = ap.parse_args()

    db = get_session()
    try:
        rows = fetch_rows(db)
    finally:
        db.close()

    out_path = Path(args.out)
    if args.format == "csv":
        export_csv(rows, out_path)
    else:
        export_json(rows, out_path)

    print(f"✅ Exported {len(rows)} rows -> {out_path}")


if __name__ == "__main__":
    main()
