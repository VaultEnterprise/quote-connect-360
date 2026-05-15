-- =========================================================
-- 004_core_tables_targets_contents.sql
-- Phase: CORE
-- Purpose: Create help_targets, help_contents, help_content_versions
-- Dependencies: 003_core_tables_modules_pages_sections.sql
-- =========================================================

create table if not exists help_targets (
  help_target_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_module_id uuid not null,
  help_page_id uuid not null,
  help_section_id uuid null,
  parent_help_target_id uuid null,
  target_code varchar(200) not null,
  target_type help_target_type_enum not null,
  target_name varchar(255) not null,
  target_label varchar(255) null,
  component_key varchar(255) null,
  field_name varchar(255) null,
  control_name varchar(255) null,
  workflow_code varchar(150) null,
  action_code varchar(150) null,
  status_code varchar(150) null,
  report_code varchar(150) null,
  grid_code varchar(150) null,
  grid_column_code varchar(150) null,
  ui_selector_hint varchar(500) null,
  target_path varchar(1000) null,
  description text null,
  role_scope jsonb null,
  ui_metadata jsonb null,
  search_keywords text null,
  sort_order integer not null default 0,
  is_help_enabled boolean not null default true,
  is_required_for_coverage boolean not null default true,
  is_system_generated boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_targets_help_module
    foreign key (help_module_id) references help_modules(help_module_id)
    on update restrict on delete restrict,

  constraint fk_help_targets_help_page
    foreign key (help_page_id) references help_pages(help_page_id)
    on update restrict on delete restrict,

  constraint fk_help_targets_help_section
    foreign key (help_section_id) references help_sections(help_section_id)
    on update restrict on delete restrict,

  constraint fk_help_targets_parent_help_target
    foreign key (parent_help_target_id) references help_targets(help_target_id)
    on update restrict on delete restrict,

  constraint ux_help_targets_target_code unique (target_code),
  constraint ck_help_targets_target_code_not_blank check (btrim(target_code) <> ''),
  constraint ck_help_targets_target_name_not_blank check (btrim(target_name) <> ''),
  constraint ck_help_targets_sort_order_nonnegative check (sort_order >= 0),
  constraint ck_help_targets_self_parent check (
    parent_help_target_id is null or parent_help_target_id <> help_target_id
  ),
  constraint ck_help_targets_role_scope_is_object_or_array check (
    role_scope is null or jsonb_typeof(role_scope) in ('object','array')
  ),
  constraint ck_help_targets_ui_metadata_is_object check (
    ui_metadata is null or jsonb_typeof(ui_metadata) = 'object'
  )
);

create table if not exists help_contents (
  help_content_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_target_id uuid not null,
  content_source_type help_content_source_type_enum not null,
  content_status help_content_status_enum not null default 'draft',
  version_no integer not null default 1,
  language_code varchar(20) not null default 'en',
  help_title varchar(255) not null,
  short_help_text text null,
  detailed_help_text text not null,
  feature_capabilities_text text null,
  process_meaning_text text null,
  expected_user_action_text text null,
  allowed_values_text text null,
  examples_text text null,
  dependency_notes_text text null,
  warnings_text text null,
  validation_notes_text text null,
  related_topics_text text null,
  search_keywords text null,
  role_visibility jsonb null,
  source_confidence_score numeric(5,4) null,
  is_primary boolean not null default true,
  is_active boolean not null default true,
  review_required boolean not null default false,
  approved_by_user_id uuid null,
  approved_at timestamptz null,
  last_updated_by_user_id uuid null,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint fk_help_contents_help_target
    foreign key (help_target_id) references help_targets(help_target_id)
    on update restrict on delete cascade,

  constraint ck_help_contents_version_no_positive check (version_no > 0),
  constraint ck_help_contents_language_code_not_blank check (btrim(language_code) <> ''),
  constraint ck_help_contents_help_title_not_blank check (btrim(help_title) <> ''),
  constraint ck_help_contents_detailed_help_not_blank check (btrim(detailed_help_text) <> ''),
  constraint ck_help_contents_role_visibility_is_object_or_array check (
    role_visibility is null or jsonb_typeof(role_visibility) in ('object','array')
  ),
  constraint ck_help_contents_confidence_range check (
    source_confidence_score is null or
    (source_confidence_score >= 0 and source_confidence_score <= 1)
  ),
  constraint ck_help_contents_active_requires_nonarchived check (
    not (is_active = true and content_status = 'archived')
  ),
  constraint ck_help_contents_active_status_requires_active_flag check (
    not (content_status = 'active' and is_active = false)
  ),
  constraint ck_help_contents_approved_pairing check (
    (approved_by_user_id is null and approved_at is null) or
    (approved_by_user_id is not null and approved_at is not null)
  )
);

create table if not exists help_content_versions (
  help_content_version_id uuid primary key default gen_random_uuid(),
  help_content_id uuid not null,
  version_no integer not null,
  change_type help_change_type_enum not null,
  snapshot_payload jsonb not null,
  change_summary varchar(500) null,
  changed_by_user_id uuid null,
  changed_at timestamptz not null default now(),

  constraint fk_help_content_versions_help_content
    foreign key (help_content_id) references help_contents(help_content_id)
    on update restrict on delete cascade,

  constraint ux_help_content_versions_help_content_version unique (help_content_id, version_no),
  constraint ck_help_content_versions_version_no_positive check (version_no > 0),
  constraint ck_help_content_versions_snapshot_is_object check (
    jsonb_typeof(snapshot_payload) = 'object'
  )
);