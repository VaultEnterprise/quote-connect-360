CREATE TABLE IF NOT EXISTS doc_generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_code TEXT NOT NULL UNIQUE,
    application_name TEXT NOT NULL,
    version TEXT NOT NULL,
    run_type TEXT NOT NULL CHECK (
        run_type IN ('manual_export', 'helpai_ingestion', 'graph_generation', 'screenshot_mapping', 'full_build')
    ),
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'running', 'completed', 'failed')
    ),
    output_path TEXT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    error_text TEXT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_generation_runs_status
    ON doc_generation_runs (status);

CREATE INDEX IF NOT EXISTS idx_doc_generation_runs_run_type
    ON doc_generation_runs (run_type);

CREATE INDEX IF NOT EXISTS idx_doc_generation_runs_started_at
    ON doc_generation_runs (started_at DESC);