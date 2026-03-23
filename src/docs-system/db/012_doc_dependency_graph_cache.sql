CREATE TABLE IF NOT EXISTS doc_dependency_graph_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_code TEXT NOT NULL UNIQUE,
    graph_name TEXT NOT NULL,
    nodes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    mermaid_text TEXT NOT NULL,
    generated_from_hash TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_dependency_graph_cache_generated_hash
    ON doc_dependency_graph_cache (generated_from_hash);

CREATE INDEX IF NOT EXISTS gin_doc_dependency_graph_cache_nodes_json
    ON doc_dependency_graph_cache USING GIN (nodes_json);

CREATE INDEX IF NOT EXISTS gin_doc_dependency_graph_cache_edges_json
    ON doc_dependency_graph_cache USING GIN (edges_json);