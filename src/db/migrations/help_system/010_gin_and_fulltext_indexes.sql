-- =========================================================
-- 010_gin_and_fulltext_indexes.sql
-- Phase: PERF
-- Purpose: GIN indexes for JSONB, full-text search, and trigram fuzzy search
-- Dependencies: 009_partial_unique_indexes.sql
-- Note: Requires pg_trgm extension from 001_extensions.sql
-- =========================================================

-- GIN indexes for JSONB fields
create index if not exists gin_help_targets_role_scope
  on help_targets using gin (role_scope);

create index if not exists gin_help_targets_ui_metadata
  on help_targets using gin (ui_metadata);

create index if not exists gin_help_contents_role_visibility
  on help_contents using gin (role_visibility);

create index if not exists gin_help_content_versions_snapshot_payload
  on help_content_versions using gin (snapshot_payload);

create index if not exists gin_help_ai_question_logs_source_help_ids
  on help_ai_question_logs using gin (source_help_content_ids);

create index if not exists gin_help_ai_question_logs_source_topic_ids
  on help_ai_question_logs using gin (source_manual_topic_ids);

create index if not exists gin_help_audit_logs_before_payload
  on help_audit_logs using gin (before_payload);

create index if not exists gin_help_audit_logs_after_payload
  on help_audit_logs using gin (after_payload);

create index if not exists gin_seed_run_steps_details
  on seed_run_steps using gin (details);

-- Full-text search indexes
create index if not exists gin_help_contents_search_vector
  on help_contents using gin (
    to_tsvector(
      'english',
      coalesce(help_title, '') || ' ' ||
      coalesce(short_help_text, '') || ' ' ||
      coalesce(detailed_help_text, '') || ' ' ||
      coalesce(feature_capabilities_text, '') || ' ' ||
      coalesce(process_meaning_text, '') || ' ' ||
      coalesce(expected_user_action_text, '') || ' ' ||
      coalesce(search_keywords, '')
    )
  );

create index if not exists gin_help_manual_topics_search_vector
  on help_manual_topics using gin (
    to_tsvector(
      'english',
      coalesce(topic_title, '') || ' ' ||
      coalesce(topic_summary, '') || ' ' ||
      coalesce(topic_body, '') || ' ' ||
      coalesce(search_keywords, '')
    )
  );

create index if not exists gin_help_search_logs_normalized_text
  on help_search_logs using gin (
    to_tsvector(
      'english',
      coalesce(normalized_search_text, '') || ' ' ||
      coalesce(search_text, '')
    )
  );

-- Trigram indexes for fuzzy search
create index if not exists gin_help_targets_target_label_trgm
  on help_targets using gin (target_label gin_trgm_ops);

create index if not exists gin_help_targets_target_name_trgm
  on help_targets using gin (target_name gin_trgm_ops);

create index if not exists gin_help_targets_search_keywords_trgm
  on help_targets using gin (search_keywords gin_trgm_ops);

create index if not exists gin_help_contents_help_title_trgm
  on help_contents using gin (help_title gin_trgm_ops);

create index if not exists gin_help_manual_topics_topic_title_trgm
  on help_manual_topics using gin (topic_title gin_trgm_ops);

create index if not exists gin_help_search_logs_search_text_trgm
  on help_search_logs using gin (search_text gin_trgm_ops);