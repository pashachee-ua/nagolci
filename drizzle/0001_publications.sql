CREATE TABLE IF NOT EXISTS publications (
 id TEXT PRIMARY KEY,
 revision INTEGER NOT NULL,
 status TEXT NOT NULL,
 created_at TEXT NOT NULL,
 deployment_id TEXT,
 error TEXT,
 snapshot TEXT NOT NULL,
 ready INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_publication ON publications ((1))
 WHERE status IN ('requesting','queued','building','unknown');
