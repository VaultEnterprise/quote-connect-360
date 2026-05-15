CREATE TABLE IF NOT EXISTS doc_screenshot_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screenshot_code TEXT NOT NULL UNIQUE,
    page_code TEXT NOT NULL,
    page_name TEXT NOT NULL,
    route TEXT NOT NULL,
    capture_type TEXT NOT NULL CHECK (capture_type IN ('full_page', 'modal', 'tab', 'section')),
    selector TEXT NULL,
    state_label TEXT NOT NULL,
    required_role TEXT NOT NULL,
    output_file_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_screenshot_targets_page
        FOREIGN KEY (page_code)
        REFERENCES doc_page_inventory(page_code)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_screenshot_targets_page_code
    ON doc_screenshot_targets (page_code);

CREATE INDEX IF NOT EXISTS idx_doc_screenshot_targets_sort_order
    ON doc_screenshot_targets (page_code, sort_order);