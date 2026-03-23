-- =========================================================
-- 008_core_indexes.rollback.sql
-- =========================================================

drop index if exists ix_help_modules_tenant_id;
drop index if exists ix_help_modules_is_active_sort;
drop index if exists ix_help_modules_module_name;

drop index if exists ix_help_pages_help_module_id;
drop index if exists ix_help_pages_route_path;
drop index if exists ix_help_pages_page_type;
drop index if exists ix_help_pages_is_active_sort;
drop index if exists ix_help_pages_tenant_id;

drop index if exists ix_help_sections_help_page_id;
drop index if exists ix_help_sections_parent_section_id;
drop index if exists ix_help_sections_section_type;
drop index if exists ix_help_sections_is_active_sort;
drop index if exists ix_help_sections_tenant_id;

drop index if exists ix_help_targets_help_module_id;
drop index if exists ix_help_targets_help_page_id;
drop index if exists ix_help_targets_help_section_id;
drop index if exists ix_help_targets_parent_help_target_id;
drop index if exists ix_help_targets_target_type;
drop index if exists ix_help_targets_component_key;
drop index if exists ix_help_targets_field_name;
drop index if exists ix_help_targets_action_code;
drop index if exists ix_help_targets_workflow_code;
drop index if exists ix_help_targets_is_help_enabled;
drop index if exists ix_help_targets_is_active_sort;
drop index if exists ix_help_targets_tenant_id;

drop index if exists ix_help_contents_help_target_id;
drop index if exists ix_help_contents_content_status;
drop index if exists ix_help_contents_content_source_type;
drop index if exists ix_help_contents_language_code;
drop index if exists ix_help_contents_is_active;
drop index if exists ix_help_contents_review_required;
drop index if exists ix_help_contents_last_updated_at;
drop index if exists ix_help_contents_tenant_id;

drop index if exists ix_help_content_versions_help_content_id;
drop index if exists ix_help_content_versions_version_no;
drop index if exists ix_help_content_versions_changed_at;

drop index if exists ix_help_manual_topics_help_module_id;
drop index if exists ix_help_manual_topics_topic_type;
drop index if exists ix_help_manual_topics_is_published;
drop index if exists ix_help_manual_topics_is_active_sort;
drop index if exists ix_help_manual_topics_language_code;
drop index if exists ix_help_manual_topics_tenant_id;

drop index if exists ix_help_manual_topic_target_maps_topic_id;
drop index if exists ix_help_manual_topic_target_maps_target_id;

drop index if exists ix_help_search_logs_tenant_id;
drop index if exists ix_help_search_logs_user_id;
drop index if exists ix_help_search_logs_page_code;
drop index if exists ix_help_search_logs_search_channel;
drop index if exists ix_help_search_logs_created_at;

drop index if exists ix_help_ai_question_logs_tenant_id;
drop index if exists ix_help_ai_question_logs_user_id;
drop index if exists ix_help_ai_question_logs_page_code;
drop index if exists ix_help_ai_question_logs_answer_status;
drop index if exists ix_help_ai_question_logs_confidence_score;
drop index if exists ix_help_ai_question_logs_requires_review;
drop index if exists ix_help_ai_question_logs_created_at;

drop index if exists ix_help_coverage_snapshots_snapshot_date;
drop index if exists ix_help_coverage_snapshots_tenant_id;

drop index if exists ix_help_ai_training_queue_status;
drop index if exists ix_help_ai_training_queue_source_entity;
drop index if exists ix_help_ai_training_queue_tenant_id;
drop index if exists ix_help_ai_training_queue_queued_at;

drop index if exists ix_help_audit_logs_event_type;
drop index if exists ix_help_audit_logs_entity;
drop index if exists ix_help_audit_logs_target_code;
drop index if exists ix_help_audit_logs_actor_user_id;
drop index if exists ix_help_audit_logs_event_timestamp;

drop index if exists ix_seed_runs_seed_name;
drop index if exists ix_seed_runs_status;
drop index if exists ix_seed_runs_started_at;

drop index if exists ix_seed_run_steps_seed_run_id;
drop index if exists ix_seed_run_steps_status;
drop index if exists ix_seed_run_steps_table_name;
drop index if exists ix_seed_run_steps_created_at;