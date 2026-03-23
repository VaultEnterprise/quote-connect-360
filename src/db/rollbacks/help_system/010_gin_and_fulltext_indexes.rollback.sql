-- =========================================================
-- 010_gin_and_fulltext_indexes.rollback.sql
-- =========================================================

drop index if exists gin_help_targets_role_scope;
drop index if exists gin_help_targets_ui_metadata;
drop index if exists gin_help_contents_role_visibility;
drop index if exists gin_help_content_versions_snapshot_payload;
drop index if exists gin_help_ai_question_logs_source_help_ids;
drop index if exists gin_help_ai_question_logs_source_topic_ids;
drop index if exists gin_help_audit_logs_before_payload;
drop index if exists gin_help_audit_logs_after_payload;
drop index if exists gin_seed_run_steps_details;

drop index if exists gin_help_contents_search_vector;
drop index if exists gin_help_manual_topics_search_vector;
drop index if exists gin_help_search_logs_normalized_text;

drop index if exists gin_help_targets_target_label_trgm;
drop index if exists gin_help_targets_target_name_trgm;
drop index if exists gin_help_targets_search_keywords_trgm;
drop index if exists gin_help_contents_help_title_trgm;
drop index if exists gin_help_manual_topics_topic_title_trgm;
drop index if exists gin_help_search_logs_search_text_trgm;