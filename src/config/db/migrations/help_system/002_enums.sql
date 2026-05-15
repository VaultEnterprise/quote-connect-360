-- =========================================================
-- 002_enums.sql
-- Phase: PREP
-- Purpose: Create all help-system enums
-- Dependencies: 001_extensions.sql
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_page_type_enum') then
    create type help_page_type_enum as enum (
      'standard_screen',
      'wizard',
      'dashboard',
      'modal',
      'settings_page',
      'report_page',
      'admin_page',
      'manual_page'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_section_type_enum') then
    create type help_section_type_enum as enum (
      'panel',
      'tab',
      'accordion',
      'card',
      'grid',
      'toolbar',
      'form_section',
      'modal_section',
      'sidebar_section',
      'filter_section',
      'summary_section'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_target_type_enum') then
    create type help_target_type_enum as enum (
      'module',
      'page',
      'section',
      'field',
      'line_item',
      'button',
      'action',
      'workflow_step',
      'status',
      'grid',
      'grid_column',
      'report',
      'import',
      'export',
      'setting',
      'filter',
      'widget',
      'navigation_item',
      'modal',
      'tab',
      'process_step',
      'badge',
      'link',
      'toggle',
      'radio_option',
      'select_option'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_content_source_type_enum') then
    create type help_content_source_type_enum as enum (
      'system_generated',
      'admin_created',
      'admin_updated',
      'ai_draft',
      'approved_ai_enhanced',
      'migration_import'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_content_status_enum') then
    create type help_content_status_enum as enum (
      'draft',
      'active',
      'inactive',
      'archived',
      'review_required'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_manual_topic_type_enum') then
    create type help_manual_topic_type_enum as enum (
      'module_guide',
      'page_guide',
      'workflow_guide',
      'faq',
      'troubleshooting',
      'how_to',
      'reference',
      'release_note'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_ai_answer_status_enum') then
    create type help_ai_answer_status_enum as enum (
      'answered',
      'low_confidence',
      'unanswered',
      'escalated',
      'reviewed',
      'resolved'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_ai_training_queue_status_enum') then
    create type help_ai_training_queue_status_enum as enum (
      'queued',
      'processed',
      'failed',
      'skipped'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_search_channel_enum') then
    create type help_search_channel_enum as enum (
      'manual_search',
      'contextual_help',
      'help_ai',
      'global_help_launcher'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'help_change_type_enum') then
    create type help_change_type_enum as enum (
      'create',
      'update',
      'activate',
      'deactivate',
      'archive',
      'restore',
      'approve',
      'publish',
      'unpublish'
    );
  end if;
end $$;