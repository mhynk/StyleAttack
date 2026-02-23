"""Tiny CRUD helpers for other teammates to use."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import Prompt, Transformation, Result

def create_prompt(db: Session, prompt_text: str, metadata: dict | None = None) -> Prompt:
    p = Prompt(prompt_text=prompt_text, meta=metadata or {})
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def create_transformation(db: Session, prompt_id: int, style_type: str, transformed_text: str, transform_meta: dict | None = None) -> Transformation:
    t = Transformation(prompt_id=prompt_id, style_type=style_type, transformed_text=transformed_text, transform_meta=transform_meta or {})
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

def create_result(
    db: Session,
    transformation_id: int,
    model_name: str,
    outcome_label: str,
    response_text: str,
    model_provider: str = "local",
    model_meta: dict | None = None,
    response_meta: dict | None = None
) -> Result:
    r = Result(
        transformation_id=transformation_id,
        model_name=model_name,
        model_provider=model_provider,
        model_meta=model_meta or {},
        outcome_label=outcome_label,
        response_text=response_text,
        response_meta=response_meta or {}
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
