-- =========================================================
-- 009_partial_unique_indexes.sql
-- Phase: PERF
-- Purpose: Partial unique indexes enforcing runtime integrity
-- Dependencies: 008_core_indexes.sql
-- Pre-install: Run duplicate detection queries before applying to non-empty environments
-- =========================================================

-- Pre-install duplicate checks (run and verify zero rows before applying):
--
-- Duplicate active primary help rows:
-- select help_target_id, language_code, count(*)
-- from help_contents
-- where is_primary = true and is_active = true
-- group by help_target_id, language_code
-- having count(*) > 1;
--
-- Duplicate active component mappings:
-- select help_page_id, component_key, target_type, count(*)
-- from help_targets
-- where component_key is not null and is_active = true
-- group by help_page_id, component_key, target_type
-- having count(*) > 1;
--
-- Duplicate queued AI refresh rows:
-- select source_entity_type, source_entity_id, count(*)
-- from help_ai_training_queue
-- where queue_status = 'queued'
-- group by source_entity_type, source_entity_id
-- having count(*) > 1;

create unique index if not exists ux_help_contents_one_active_primary_per_target_lang
  on help_contents(help_target_id, language_code)
  where is_primary = true and is_active = true;

create unique index if not exists ux_help_targets_page_component_type_active
  on help_targets(help_page_id, component_key, target_type)
  where component_key is not null and is_active = true;

create unique index if not exists ux_help_targets_page_section_field_type_active
  on help_targets(help_page_id, help_section_id, field_name, target_type)
  where field_name is not null and is_active = true;

create unique index if not exists ux_help_ai_training_queue_one_queued_per_source
  on help_ai_training_queue(source_entity_type, source_entity_id)
  where queue_status = 'queued';

-- Partial performance indexes

create index if not exists ix_help_targets_active_help_enabled
  on help_targets(help_page_id, help_section_id, target_type)
  where is_active = true and is_help_enabled = true;

create index if not exists ix_help_targets_missing_component_key
  on help_targets(help_page_id, target_type)
  where component_key is null;

create index if not exists ix_help_contents_active_primary
  on help_contents(help_target_id, language_code)
  where is_active = true and is_primary = true;

create index if not exists ix_help_manual_topics_active_published
  on help_manual_topics(help_module_id, topic_type, sort_order)
  where is_active = true and is_published = true;

create index if not exists ix_help_ai_question_logs_review_queue
  on help_ai_question_logs(requires_admin_review, answer_status, created_at)
  where requires_admin_review = true;