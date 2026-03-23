CREATE TABLE IF NOT EXISTS doc_workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    trigger TEXT NOT NULL,
    validations JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_workflow_transitions UNIQUE (workflow_code, from_state, to_state, trigger),
    CONSTRAINT fk_doc_workflow_transitions_workflow
        FOREIGN KEY (workflow_code)
        REFERENCES doc_workflow_documentation(workflow_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_transitions_workflow_code
    ON doc_workflow_transitions (workflow_code);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_transitions_from_to
    ON doc_workflow_transitions (workflow_code, from_state, to_state);