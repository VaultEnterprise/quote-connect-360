CREATE TABLE IF NOT EXISTS doc_page_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_code TEXT NOT NULL UNIQUE,
    page_name TEXT NOT NULL,
    route TEXT NOT NULL,
    parent_page_code TEXT NULL,
    module TEXT NOT NULL,
    page_type TEXT NOT NULL CHECK (page_type IN ('screen', 'modal', 'tab', 'embedded')),
    access_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    entry_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    child_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_workflows JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    backend_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependencies_inbound JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependencies_outbound JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(page_code, '') || ' ' ||
            coalesce(page_name, '') || ' ' ||
            coalesce(route, '') || ' ' ||
            coalesce(module, '') || ' ' ||
            coalesce(description, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_page_inventory_parent
        FOREIGN KEY (parent_page_code)
        REFERENCES doc_page_inventory(page_code)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_page_inventory_module
    ON doc_page_inventory (module);

CREATE INDEX IF NOT EXISTS idx_doc_page_inventory_route
    ON doc_page_inventory (route);

CREATE INDEX IF NOT EXISTS idx_doc_page_inventory_page_type
    ON doc_page_inventory (page_type);

CREATE INDEX IF NOT EXISTS idx_doc_page_inventory_hidden
    ON doc_page_inventory (is_hidden);

CREATE INDEX IF NOT EXISTS gin_doc_page_inventory_search_vector
    ON doc_page_inventory USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS gin_doc_page_inventory_access_roles
    ON doc_page_inventory USING GIN (access_roles);

CREATE INDEX IF NOT EXISTS gin_doc_page_inventory_related_workflows
    ON doc_page_inventory USING GIN (related_workflows);