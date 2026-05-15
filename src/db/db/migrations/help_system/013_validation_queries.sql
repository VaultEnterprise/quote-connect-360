-- =========================================================
-- 013_validation_queries.sql
-- Phase: VALIDATE
-- Purpose: Post-install verification — read-only, no schema mutations
-- Run after all migration files complete successfully
-- All result sets should show exists_flag = true / index present
-- =========================================================

-- 1. Required tables exist
select 'help_modules'                    as object_name, to_regclass('public.help_modules') is not null as exists_flag
union all select 'help_pages',                to_regclass('public.help_pages') is not null
union all select 'help_sections',             to_regclass('public.help_sections') is not null
union all select 'help_targets',              to_regclass('public.help_targets') is not null
union all select 'help_contents',             to_regclass('public.help_contents') is not null
union all select 'help_content_versions',     to_regclass('public.help_content_versions') is not null
union all select 'help_manual_topics',        to_regclass('public.help_manual_topics') is not null
union all select 'help_manual_topic_target_maps', to_regclass('public.help_manual_topic_target_maps') is not null
union all select 'help_search_logs',          to_regclass('public.help_search_logs') is not null
union all select 'help_ai_question_logs',     to_regclass('public.help_ai_question_logs') is not null
union all select 'help_coverage_snapshots',   to_regclass('public.help_coverage_snapshots') is not null
union all select 'help_ai_training_queue',    to_regclass('public.help_ai_training_queue') is not null
union all select 'help_audit_logs',           to_regclass('public.help_audit_logs') is not null
union all select 'seed_runs',                 to_regclass('public.seed_runs') is not null
union all select 'seed_run_steps',            to_regclass('public.seed_run_steps') is not null
order by object_name;

-- 2. Critical partial unique indexes exist
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'ux_help_contents_one_active_primary_per_target_lang',
    'ux_help_targets_page_component_type_active',
    'ux_help_targets_page_section_field_type_active',
    'ux_help_ai_training_queue_one_queued_per_source'
  )
order by indexname;

-- 3. Critical GIN / full-text indexes exist
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'gin_help_contents_search_vector',
    'gin_help_manual_topics_search_vector',
    'gin_help_targets_role_scope',
    'gin_help_targets_target_label_trgm',
    'gin_help_contents_help_title_trgm'
  )
order by indexname;

-- 4. Views exist
select 'v_help_active_primary_content' as view_name, to_regclass('public.v_help_active_primary_content') is not null as exists_flag
union all
select 'v_help_target_coverage',        to_regclass('public.v_help_target_coverage') is not null;

-- 5. Enums exist
select typname as enum_name
from pg_type
where typname in (
  'help_page_type_enum',
  'help_section_type_enum',
  'help_target_type_enum',
  'help_content_source_type_enum',
  'help_content_status_enum',
  'help_manual_topic_type_enum',
  'help_ai_answer_status_enum',
  'help_ai_training_queue_status_enum',
  'help_search_channel_enum',
  'help_change_type_enum'
)
order by typname;

-- 6. Triggers attached
select trigger_name, event_object_table
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'trg_help_modules_set_updated_at',
    'trg_help_pages_set_updated_at',
    'trg_help_sections_set_updated_at',
    'trg_help_targets_set_updated_at',
    'trg_help_modules_topics_set_updated_at',
    'trg_seed_runs_set_updated_at'
  )
order by event_object_table;

-- 7. Duplicate-integrity checks (all should return zero rows)
select 'active_primary_duplicates' as check_name, count(*) as violation_count
from (
  select help_target_id, language_code
  from help_contents
  where is_primary = true and is_active = true
  group by help_target_id, language_code
  having count(*) > 1
) t
union all
select 'queued_ai_duplicates', count(*)
from (
  select source_entity_type, source_entity_id
  from help_ai_training_queue
  where queue_status = 'queued'
  group by source_entity_type, source_entity_id
  having count(*) > 1
) t;