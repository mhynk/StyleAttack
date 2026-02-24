"""ORM models for StyleAttack (Prompts -> Transformations -> Results)."""

from __future__ import annotations

from sqlalchemy import (
    Column, Integer, BigInteger, Text, String, ForeignKey, DateTime, func,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.types import JSON

Base = declarative_base()

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    prompt_text = Column(Text, nullable=False)

    # 'metadata' is a reserved name in SQLAlchemy's declarative Base,
    # so we expose it as 'meta' but keep the column name 'metadata'.
    meta = Column("metadata", JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    transformations = relationship("Transformation", back_populates="prompt", cascade="all, delete-orphan")


class Transformation(Base):
    __tablename__ = "transformations"
    __table_args__ = (
        UniqueConstraint("prompt_id", "style_type", "transformed_text", name="uq_prompt_style_text"),
    )

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    prompt_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)

    style_type = Column(String, nullable=False)  # poetry, narrative, metaphor, euphemistic, ...
    transformed_text = Column(Text, nullable=False)
    transform_meta = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    prompt = relationship("Prompt", back_populates="transformations")
    results = relationship("Result", back_populates="transformation", cascade="all, delete-orphan")


class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        CheckConstraint("outcome_label IN ('refused','partial','full')", name="ck_outcome_label"),
    )

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    transformation_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("transformations.id", ondelete="CASCADE"), nullable=False)

    model_name = Column(String, nullable=False)         # e.g., llama3.1, gpt-4o-mini
    model_provider = Column(String, nullable=False, default="local")  # local, hf, openai, ...
    model_meta = Column(JSON, nullable=False, default=dict)           # temperature, max_tokens, seed, etc.

    outcome_label = Column(String, nullable=False)      # refused | partial | full
    response_text = Column(Text, nullable=False)
    response_meta = Column(JSON, nullable=False, default=dict)        # latency_ms, tokens, error, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    transformation = relationship("Transformation", back_populates="results")
