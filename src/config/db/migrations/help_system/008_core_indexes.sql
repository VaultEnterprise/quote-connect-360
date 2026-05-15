-- =========================================================
-- 008_core_indexes.sql
-- Phase: PERF
-- Purpose: Standard BTree indexes on all core help tables
-- Dependencies: 003–007 (all tables must exist)
-- =========================================================

create index if not exists ix_help_modules_tenant_id on help_modules(tenant_id);
create index if not exists ix_help_modules_is_active_sort on help_modules(is_active, sort_order);
create index if not exists ix_help_modules_module_name on help_modules(module_name);

create index if not exists ix_help_pages_help_module_id on help_pages(help_module_id);
create index if not exists ix_help_pages_route_path on help_pages(route_path);
create index if not exists ix_help_pages_page_type on help_pages(page_type);
create index if not exists ix_help_pages_is_active_sort on help_pages(is_active, sort_order);
create index if not exists ix_help_pages_tenant_id on help_pages(tenant_id);

create index if not exists ix_help_sections_help_page_id on help_sections(help_page_id);
create index if not exists ix_help_sections_parent_section_id on help_sections(parent_section_id);
create index if not exists ix_help_sections_section_type on help_sections(section_type);
create index if not exists ix_help_sections_is_active_sort on help_sections(is_active, sort_order);
create index if not exists ix_help_sections_tenant_id on help_sections(tenant_id);

create index if not exists ix_help_targets_help_module_id on help_targets(help_module_id);
create index if not exists ix_help_targets_help_page_id on help_targets(help_page_id);
create index if not exists ix_help_targets_help_section_id on help_targets(help_section_id);
create index if not exists ix_help_targets_parent_help_target_id on help_targets(parent_help_target_id);
create index if not exists ix_help_targets_target_type on help_targets(target_type);
create index if not exists ix_help_targets_component_key on help_targets(component_key);
create index if not exists ix_help_targets_field_name on help_targets(field_name);
create index if not exists ix_help_targets_action_code on help_targets(action_code);
create index if not exists ix_help_targets_workflow_code on help_targets(workflow_code);
create index if not exists ix_help_targets_is_help_enabled on help_targets(is_help_enabled);
create index if not exists ix_help_targets_is_active_sort on help_targets(is_active, sort_order);
create index if not exists ix_help_targets_tenant_id on help_targets(tenant_id);

create index if not exists ix_help_contents_help_target_id on help_contents(help_target_id);
create index if not exists ix_help_contents_content_status on help_contents(content_status);
create index if not exists ix_help_contents_content_source_type on help_contents(content_source_type);
create index if not exists ix_help_contents_language_code on help_contents(language_code);
create index if not exists ix_help_contents_is_active on help_contents(is_active);
create index if not exists ix_help_contents_review_required on help_contents(review_required);
create index if not exists ix_help_contents_last_updated_at on help_contents(last_updated_at);
create index if not exists ix_help_contents_tenant_id on help_contents(tenant_id);

create index if not exists ix_help_content_versions_help_content_id on help_content_versions(help_content_id);
create index if not exists ix_help_content_versions_version_no on help_content_versions(version_no);
create index if not exists ix_help_content_versions_changed_at on help_content_versions(changed_at);

create index if not exists ix_help_manual_topics_help_module_id on help_manual_topics(help_module_id);
create index if not exists ix_help_manual_topics_topic_type on help_manual_topics(topic_type);
create index if not exists ix_help_manual_topics_is_published on help_manual_topics(is_published);
create index if not exists ix_help_manual_topics_is_active_sort on help_manual_topics(is_active, sort_order);
create index if not exists ix_help_manual_topics_language_code on help_manual_topics(language_code);
create index if not exists ix_help_manual_topics_tenant_id on help_manual_topics(tenant_id);

create index if not exists ix_help_manual_topic_target_maps_topic_id on help_manual_topic_target_maps(help_manual_topic_id);
create index if not exists ix_help_manual_topic_target_maps_target_id on help_manual_topic_target_maps(help_target_id);

create index if not exists ix_help_search_logs_tenant_id on help_search_logs(tenant_id);
create index if not exists ix_help_search_logs_user_id on help_search_logs(user_id);
create index if not exists ix_help_search_logs_page_code on help_search_logs(page_code);
create index if not exists ix_help_search_logs_search_channel on help_search_logs(search_channel);
create index if not exists ix_help_search_logs_created_at on help_search_logs(created_at);

create index if not exists ix_help_ai_question_logs_tenant_id on help_ai_question_logs(tenant_id);
create index if not exists ix_help_ai_question_logs_user_id on help_ai_question_logs(user_id);
create index if not exists ix_help_ai_question_logs_page_code on help_ai_question_logs(page_code);
create index if not exists ix_help_ai_question_logs_answer_status on help_ai_question_logs(answer_status);
create index if not exists ix_help_ai_question_logs_confidence_score on help_ai_question_logs(confidence_score);
create index if not exists ix_help_ai_question_logs_requires_review on help_ai_question_logs(requires_admin_review);
create index if not exists ix_help_ai_question_logs_created_at on help_ai_question_logs(created_at);

create index if not exists ix_help_coverage_snapshots_snapshot_date on help_coverage_snapshots(snapshot_date);
create index if not exists ix_help_coverage_snapshots_tenant_id on help_coverage_snapshots(tenant_id);

create index if not exists ix_help_ai_training_queue_status on help_ai_training_queue(queue_status);
create index if not exists ix_help_ai_training_queue_source_entity on help_ai_training_queue(source_entity_type, source_entity_id);
create index if not exists ix_help_ai_training_queue_tenant_id on help_ai_training_queue(tenant_id);
create index if not exists ix_help_ai_training_queue_queued_at on help_ai_training_queue(queued_at);

create index if not exists ix_help_audit_logs_event_type on help_audit_logs(event_type);
create index if not exists ix_help_audit_logs_entity on help_audit_logs(entity_type, entity_id);
create index if not exists ix_help_audit_logs_target_code on help_audit_logs(target_code);
create index if not exists ix_help_audit_logs_actor_user_id on help_audit_logs(actor_user_id);
create index if not exists ix_help_audit_logs_event_timestamp on help_audit_logs(event_timestamp);

create index if not exists ix_seed_runs_seed_name on seed_runs(seed_name);
create index if not exists ix_seed_runs_status on seed_runs(status);
create index if not exists ix_seed_runs_started_at on seed_runs(started_at);

create index if not exists ix_seed_run_steps_seed_run_id on seed_run_steps(seed_run_id);
create index if not exists ix_seed_run_steps_status on seed_run_steps(status);
create index if not exists ix_seed_run_steps_table_name on seed_run_steps(table_name);
create index if not exists ix_seed_run_steps_created_at on seed_run_steps(created_at);