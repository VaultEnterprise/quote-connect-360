CREATE TABLE IF NOT EXISTS doc_workflow_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code TEXT NOT NULL UNIQUE,
    workflow_name TEXT NOT NULL,
    description TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(workflow_code, '') || ' ' ||
            coalesce(workflow_name, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(trigger_event, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_documentation_code
    ON doc_workflow_documentation (workflow_code);

CREATE INDEX IF NOT EXISTS gin_doc_workflow_documentation_search_vector
    ON doc_workflow_documentation USING GIN (search_vector);