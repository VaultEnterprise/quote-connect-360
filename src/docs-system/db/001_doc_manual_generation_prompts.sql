CREATE TABLE IF NOT EXISTS doc_manual_generation_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_code TEXT NOT NULL UNIQUE,
    prompt_name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_manual_generation_prompts_active
    ON doc_manual_generation_prompts (is_active);

CREATE INDEX IF NOT EXISTS idx_doc_manual_generation_prompts_code
    ON doc_manual_generation_prompts (prompt_code);