CREATE TABLE IF NOT EXISTS doc_generation_run_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_code TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (
        item_type IN ('page', 'feature', 'control', 'workflow', 'section', 'chunk', 'graph', 'screenshot')
    ),
    item_code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'running', 'completed', 'failed', 'skipped')
    ),
    message TEXT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_generation_run_items UNIQUE (run_code, item_type, item_code),
    CONSTRAINT fk_doc_generation_run_items_run
        FOREIGN KEY (run_code)
        REFERENCES doc_generation_runs(run_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_generation_run_items_run_code
    ON doc_generation_run_items (run_code);

CREATE INDEX IF NOT EXISTS idx_doc_generation_run_items_status
    ON doc_generation_run_items (status);

CREATE INDEX IF NOT EXISTS idx_doc_generation_run_items_sort
    ON doc_generation_run_items (run_code, sort_order);