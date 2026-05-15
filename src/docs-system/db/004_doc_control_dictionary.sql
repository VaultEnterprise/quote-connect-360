CREATE TABLE IF NOT EXISTS doc_control_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_code TEXT NOT NULL UNIQUE,
    page_code TEXT NOT NULL,
    control_name TEXT NOT NULL,
    control_type TEXT NOT NULL CHECK (
        control_type IN ('button', 'field', 'dropdown', 'tab', 'modal', 'toggle', 'grid', 'link')
    ),
    visible_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    visible_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_triggered TEXT NOT NULL,
    backend_flow JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_written JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_read JSONB NOT NULL DEFAULT '[]'::jsonb,
    validations JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_behavior TEXT NOT NULL,
    error_behavior TEXT NOT NULL,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(control_code, '') || ' ' ||
            coalesce(control_name, '') || ' ' ||
            coalesce(action_triggered, '') || ' ' ||
            coalesce(success_behavior, '') || ' ' ||
            coalesce(error_behavior, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_control_dictionary_page
        FOREIGN KEY (page_code)
        REFERENCES doc_page_inventory(page_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_control_dictionary_page_code
    ON doc_control_dictionary (page_code);

CREATE INDEX IF NOT EXISTS idx_doc_control_dictionary_control_type
    ON doc_control_dictionary (control_type);

CREATE INDEX IF NOT EXISTS gin_doc_control_dictionary_search_vector
    ON doc_control_dictionary USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS gin_doc_control_dictionary_visible_roles
    ON doc_control_dictionary USING GIN (visible_roles);

CREATE INDEX IF NOT EXISTS gin_doc_control_dictionary_dependencies
    ON doc_control_dictionary USING GIN (dependencies);