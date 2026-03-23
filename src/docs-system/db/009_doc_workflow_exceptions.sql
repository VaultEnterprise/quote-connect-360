CREATE TABLE IF NOT EXISTS doc_workflow_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code TEXT NOT NULL,
    condition TEXT NOT NULL,
    resolution TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_workflow_exceptions UNIQUE (workflow_code, condition),
    CONSTRAINT fk_doc_workflow_exceptions_workflow
        FOREIGN KEY (workflow_code)
        REFERENCES doc_workflow_documentation(workflow_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_exceptions_workflow_code
    ON doc_workflow_exceptions (workflow_code);