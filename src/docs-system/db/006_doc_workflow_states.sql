CREATE TABLE IF NOT EXISTS doc_workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    available_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    responsible_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_states JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_workflow_states UNIQUE (workflow_code, state_code),
    CONSTRAINT fk_doc_workflow_states_workflow
        FOREIGN KEY (workflow_code)
        REFERENCES doc_workflow_documentation(workflow_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_states_workflow_code
    ON doc_workflow_states (workflow_code);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_states_sort_order
    ON doc_workflow_states (workflow_code, sort_order);

CREATE INDEX IF NOT EXISTS gin_doc_workflow_states_roles
    ON doc_workflow_states USING GIN (responsible_roles);