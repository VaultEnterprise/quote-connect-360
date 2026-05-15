CREATE TABLE IF NOT EXISTS doc_workflow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code TEXT NOT NULL,
    trigger TEXT NOT NULL,
    template TEXT NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_workflow_notifications UNIQUE (workflow_code, trigger, template),
    CONSTRAINT fk_doc_workflow_notifications_workflow
        FOREIGN KEY (workflow_code)
        REFERENCES doc_workflow_documentation(workflow_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_workflow_notifications_workflow_code
    ON doc_workflow_notifications (workflow_code);

CREATE INDEX IF NOT EXISTS gin_doc_workflow_notifications_recipients
    ON doc_workflow_notifications USING GIN (recipients);