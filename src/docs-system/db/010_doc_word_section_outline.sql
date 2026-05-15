CREATE TABLE IF NOT EXISTS doc_word_section_outline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code TEXT NOT NULL UNIQUE,
    heading_level INTEGER NOT NULL CHECK (heading_level IN (1, 2, 3, 4)),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_repeatable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_word_section_outline_sort_order
    ON doc_word_section_outline (sort_order);