CREATE TABLE IF NOT EXISTS doc_feature_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_code TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    page_code TEXT NOT NULL,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('action', 'display', 'automation')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('button_click', 'load', 'schedule', 'system')),
    user_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    input_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    backend_process TEXT NOT NULL,
    workflow_impact JSONB NOT NULL DEFAULT '[]'::jsonb,
    notification_impact JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_result TEXT NOT NULL,
    failure_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    audit_logged BOOLEAN NOT NULL DEFAULT FALSE,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(feature_code, '') || ' ' ||
            coalesce(feature_name, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(backend_process, '') || ' ' ||
            coalesce(success_result, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_feature_inventory_page
        FOREIGN KEY (page_code)
        REFERENCES doc_page_inventory(page_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_feature_inventory_page_code
    ON doc_feature_inventory (page_code);

CREATE INDEX IF NOT EXISTS idx_doc_feature_inventory_feature_type
    ON doc_feature_inventory (feature_type);

CREATE INDEX IF NOT EXISTS idx_doc_feature_inventory_trigger_type
    ON doc_feature_inventory (trigger_type);

CREATE INDEX IF NOT EXISTS gin_doc_feature_inventory_search_vector
    ON doc_feature_inventory USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS gin_doc_feature_inventory_user_roles
    ON doc_feature_inventory USING GIN (user_roles);

CREATE INDEX IF NOT EXISTS gin_doc_feature_inventory_dependencies
    ON doc_feature_inventory USING GIN (dependencies);