CREATE TABLE IF NOT EXISTS doc_helpai_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id TEXT NOT NULL UNIQUE,
    doc_type TEXT NOT NULL CHECK (
        doc_type IN ('page', 'feature', 'control', 'workflow', 'troubleshooting', 'overview')
    ),
    source_code TEXT NOT NULL,
    title TEXT NOT NULL,
    route TEXT NULL,
    roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    body_markdown TEXT NOT NULL,
    body_plaintext TEXT NOT NULL,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    embedding_text TEXT NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(title, '') || ' ' ||
            coalesce(source_code, '') || ' ' ||
            coalesce(route, '') || ' ' ||
            coalesce(body_plaintext, '') || ' ' ||
            coalesce(embedding_text, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_helpai_chunks_doc_type
    ON doc_helpai_chunks (doc_type);

CREATE INDEX IF NOT EXISTS idx_doc_helpai_chunks_source_code
    ON doc_helpai_chunks (source_code);

CREATE INDEX IF NOT EXISTS idx_doc_helpai_chunks_route
    ON doc_helpai_chunks (route);

CREATE INDEX IF NOT EXISTS gin_doc_helpai_chunks_roles
    ON doc_helpai_chunks USING GIN (roles);

CREATE INDEX IF NOT EXISTS gin_doc_helpai_chunks_keywords
    ON doc_helpai_chunks USING GIN (keywords);

CREATE INDEX IF NOT EXISTS gin_doc_helpai_chunks_related_codes
    ON doc_helpai_chunks USING GIN (related_codes);

CREATE INDEX IF NOT EXISTS gin_doc_helpai_chunks_search_vector
    ON doc_helpai_chunks USING GIN (search_vector);