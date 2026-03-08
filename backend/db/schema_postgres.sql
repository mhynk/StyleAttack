-- StyleAttack DB schema (PostgreSQL)
-- Tables: prompts -> transformations -> results

CREATE TABLE IF NOT EXISTS prompts (
  id           BIGSERIAL PRIMARY KEY,
  prompt_text  TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transformations (
  id               BIGSERIAL PRIMARY KEY,
  prompt_id         BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  style_type        TEXT NOT NULL,
  transformed_text  TEXT NOT NULL,
  transform_meta    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, style_type, transformed_text)
);

CREATE TABLE IF NOT EXISTS results (
  id               BIGSERIAL PRIMARY KEY,
  transformation_id BIGINT NOT NULL REFERENCES transformations(id) ON DELETE CASCADE,
  model_name       TEXT NOT NULL,
  model_provider   TEXT NOT NULL DEFAULT 'local',
  model_meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome_label    TEXT NOT NULL CHECK (outcome_label IN ('refused','partial','full')),
  response_text    TEXT NOT NULL,
  response_meta    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dashboard + export speed
CREATE INDEX IF NOT EXISTS idx_transformations_prompt_id ON transformations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_transformations_style_type ON transformations(style_type);
CREATE INDEX IF NOT EXISTS idx_results_transformation_id ON results(transformation_id);
CREATE INDEX IF NOT EXISTS idx_results_model_name ON results(model_name);
CREATE INDEX IF NOT EXISTS idx_results_outcome_label ON results(outcome_label);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
