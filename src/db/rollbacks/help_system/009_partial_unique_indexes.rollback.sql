-- =========================================================
-- 009_partial_unique_indexes.rollback.sql
-- =========================================================

drop index if exists ux_help_ai_training_queue_one_queued_per_source;
drop index if exists ux_help_targets_page_section_field_type_active;
drop index if exists ux_help_targets_page_component_type_active;
drop index if exists ux_help_contents_one_active_primary_per_target_lang;

drop index if exists ix_help_targets_active_help_enabled;
drop index if exists ix_help_targets_missing_component_key;
drop index if exists ix_help_contents_active_primary;
drop index if exists ix_help_manual_topics_active_published;
drop index if exists ix_help_ai_question_logs_review_queue;