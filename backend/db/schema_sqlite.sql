-- StyleAttack DB schema (SQLite)
-- Tables: prompts -> transformations -> results
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS prompts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_text TEXT NOT NULL,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transformations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id        INTEGER NOT NULL,
  style_type       TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  transform_meta   TEXT NOT NULL DEFAULT '{}',
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  UNIQUE (prompt_id, style_type, transformed_text)
);

CREATE TABLE IF NOT EXISTS results (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  transformation_id  INTEGER NOT NULL,
  model_name         TEXT NOT NULL,
  model_provider     TEXT NOT NULL DEFAULT 'local',
  model_meta         TEXT NOT NULL DEFAULT '{}',
  outcome_label      TEXT NOT NULL CHECK (outcome_label IN ('refused','partial','full')),
  response_text      TEXT NOT NULL,
  response_meta      TEXT NOT NULL DEFAULT '{}',
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(transformation_id) REFERENCES transformations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transformations_prompt_id ON transformations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_transformations_style_type ON transformations(style_type);
CREATE INDEX IF NOT EXISTS idx_results_transformation_id ON results(transformation_id);
CREATE INDEX IF NOT EXISTS idx_results_model_name ON results(model_name);
CREATE INDEX IF NOT EXISTS idx_results_outcome_label ON results(outcome_label);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
