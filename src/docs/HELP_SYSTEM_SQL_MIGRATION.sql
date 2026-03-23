-- =========================================================
-- HELP SYSTEM + SEED RUNTIME
-- POSTGRESQL SQL MIGRATION PACK
-- =========================================================
-- Recommended extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =========================================================
-- 1. ENUMS
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

-- =========================================================
-- 2. CORE HELP TABLES
-- =========================================================

create table if not exists help_modules (
  help_module_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  module_code varchar(100) not null,
  module_name varchar(255) not null,
  module_description text null,
  route_base varchar(500) null,
  icon_name varchar(100) null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ux_help_modules_module_code unique (module_code),
  constraint ck_help_modules_module_code_not_blank check (btrim(module_code) <> ''),
  constraint ck_help_modules_module_name_not_blank check (btrim(module_name) <> ''),
  constraint ck_help_modules_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists help_pages (
  help_page_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_module_id uuid not null,
  page_code varchar(150) not null,
  page_name varchar(255) not null,
  page_label varchar(255) null,
  route_path varchar(500) not null,
  page_type help_page_type_enum not null,
  page_description text null,
  icon_name varchar(100) null,
  sort_order integer not null default 0,
  is_help_enabled boolean not null default true,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_pages_help_module
    foreign key (help_module_id) references help_modules(help_module_id)
    on update restrict on delete restrict,

  constraint ux_help_pages_page_code unique (page_code),
  constraint ck_help_pages_page_code_not_blank check (btrim(page_code) <> ''),
  constraint ck_help_pages_page_name_not_blank check (btrim(page_name) <> ''),
  constraint ck_help_pages_route_path_not_blank check (btrim(route_path) <> ''),
  constraint ck_help_pages_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists help_sections (
  help_section_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_page_id uuid not null,
  parent_section_id uuid null,
  section_code varchar(150) not null,
  section_name varchar(255) not null,
  section_label varchar(255) null,
  section_type help_section_type_enum not null,
  section_path varchar(1000) null,
  sort_order integer not null default 0,
  is_help_enabled boolean not null default true,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_sections_help_page
    foreign key (help_page_id) references help_pages(help_page_id)
    on update restrict on delete restrict,

  constraint fk_help_sections_parent_section
    foreign key (parent_section_id) references help_sections(help_section_id)
    on update restrict on delete restrict,

  constraint ux_help_sections_section_code unique (section_code),
  constraint ck_help_sections_section_code_not_blank check (btrim(section_code) <> ''),
  constraint ck_help_sections_section_name_not_blank check (btrim(section_name) <> ''),
  constraint ck_help_sections_sort_order_nonnegative check (sort_order >= 0),
  constraint ck_help_sections_self_parent check (
    parent_section_id is null or parent_section_id <> help_section_id
  )
);

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

create table if not exists help_manual_topics (
  help_manual_topic_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_module_id uuid null,
  topic_code varchar(150) not null,
  topic_title varchar(255) not null,
  topic_summary text null,
  topic_body text not null,
  topic_type help_manual_topic_type_enum not null,
  language_code varchar(20) not null default 'en',
  search_keywords text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_published boolean not null default false,
  is_system_generated boolean not null default false,
  review_required boolean not null default false,
  published_at timestamptz null,
  published_by_user_id uuid null,
  last_updated_by_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_manual_topics_help_module
    foreign key (help_module_id) references help_modules(help_module_id)
    on update restrict on delete set null,

  constraint ux_help_manual_topics_topic_code unique (topic_code),
  constraint ck_help_manual_topics_topic_code_not_blank check (btrim(topic_code) <> ''),
  constraint ck_help_manual_topics_topic_title_not_blank check (btrim(topic_title) <> ''),
  constraint ck_help_manual_topics_topic_body_not_blank check (btrim(topic_body) <> ''),
  constraint ck_help_manual_topics_language_code_not_blank check (btrim(language_code) <> ''),
  constraint ck_help_manual_topics_sort_order_nonnegative check (sort_order >= 0),
  constraint ck_help_manual_topics_published_pairing check (
    (is_published = false and published_at is null and published_by_user_id is null) or
    (is_published = true and published_at is not null)
  ),
  constraint ck_help_manual_topics_published_requires_active check (
    not (is_published = true and is_active = false)
  )
);

create table if not exists help_manual_topic_target_maps (
  help_manual_topic_target_map_id uuid primary key default gen_random_uuid(),
  help_manual_topic_id uuid not null,
  help_target_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint fk_help_manual_topic_target_maps_topic
    foreign key (help_manual_topic_id) references help_manual_topics(help_manual_topic_id)
    on update restrict on delete cascade,

  constraint fk_help_manual_topic_target_maps_target
    foreign key (help_target_id) references help_targets(help_target_id)
    on update restrict on delete cascade,

  constraint ux_help_manual_topic_target_maps unique (help_manual_topic_id, help_target_id),
  constraint ck_help_manual_topic_target_maps_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists help_search_logs (
  help_search_log_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  user_id uuid null,
  session_id varchar(255) null,
  module_code varchar(150) null,
  page_code varchar(150) null,
  context_help_target_id uuid null,
  search_channel help_search_channel_enum not null,
  search_text text not null,
  normalized_search_text text null,
  result_count integer not null default 0,
  selected_help_content_id uuid null,
  selected_help_manual_topic_id uuid null,
  answered_by_help_ai boolean not null default false,
  created_at timestamptz not null default now(),

  constraint fk_help_search_logs_context_help_target
    foreign key (context_help_target_id) references help_targets(help_target_id)
    on update restrict on delete set null,

  constraint fk_help_search_logs_selected_help_content
    foreign key (selected_help_content_id) references help_contents(help_content_id)
    on update restrict on delete set null,

  constraint fk_help_search_logs_selected_help_manual_topic
    foreign key (selected_help_manual_topic_id) references help_manual_topics(help_manual_topic_id)
    on update restrict on delete set null,

  constraint ck_help_search_logs_search_text_not_blank check (btrim(search_text) <> ''),
  constraint ck_help_search_logs_result_count_nonnegative check (result_count >= 0)
);

create table if not exists help_ai_question_logs (
  help_ai_question_log_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  user_id uuid null,
  session_id varchar(255) null,
  module_code varchar(150) null,
  page_code varchar(150) null,
  context_help_target_id uuid null,
  question_text text not null,
  normalized_question_text text null,
  answer_text text null,
  confidence_score numeric(5,4) null,
  answer_status help_ai_answer_status_enum not null,
  source_help_content_ids jsonb null,
  source_manual_topic_ids jsonb null,
  feedback_rating integer null,
  feedback_notes text null,
  requires_admin_review boolean not null default false,
  resolved_by_user_id uuid null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint fk_help_ai_question_logs_context_help_target
    foreign key (context_help_target_id) references help_targets(help_target_id)
    on update restrict on delete set null,

  constraint ck_help_ai_question_logs_question_text_not_blank check (btrim(question_text) <> ''),
  constraint ck_help_ai_question_logs_confidence_range check (
    confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)
  ),
  constraint ck_help_ai_question_logs_feedback_rating_range check (
    feedback_rating is null or (feedback_rating between 1 and 5)
  ),
  constraint ck_help_ai_question_logs_source_help_content_ids_is_array check (
    source_help_content_ids is null or jsonb_typeof(source_help_content_ids) = 'array'
  ),
  constraint ck_help_ai_question_logs_source_manual_topic_ids_is_array check (
    source_manual_topic_ids is null or jsonb_typeof(source_manual_topic_ids) = 'array'
  ),
  constraint ck_help_ai_question_logs_resolved_pairing check (
    (resolved_by_user_id is null and resolved_at is null) or
    (resolved_by_user_id is not null and resolved_at is not null)
  ),
  constraint ck_help_ai_question_logs_answered_requires_answer check (
    not (answer_status = 'answered' and (answer_text is null or btrim(answer_text) = ''))
  )
);

create table if not exists help_coverage_snapshots (
  help_coverage_snapshot_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  snapshot_date date not null,
  total_targets integer not null,
  targets_with_active_help integer not null,
  targets_missing_help integer not null,
  targets_with_draft_only integer not null,
  inactive_help_count integer not null,
  review_required_count integer not null,
  low_confidence_question_count integer not null,
  unanswered_question_count integer not null,
  created_at timestamptz not null default now(),

  constraint ux_help_coverage_snapshots_tenant_date unique (tenant_id, snapshot_date),
  constraint ck_help_coverage_snapshots_total_targets_nonnegative check (total_targets >= 0),
  constraint ck_help_coverage_snapshots_targets_with_active_help_nonnegative check (targets_with_active_help >= 0),
  constraint ck_help_coverage_snapshots_targets_missing_help_nonnegative check (targets_missing_help >= 0),
  constraint ck_help_coverage_snapshots_targets_with_draft_only_nonnegative check (targets_with_draft_only >= 0),
  constraint ck_help_coverage_snapshots_inactive_help_count_nonnegative check (inactive_help_count >= 0),
  constraint ck_help_coverage_snapshots_review_required_count_nonnegative check (review_required_count >= 0),
  constraint ck_help_coverage_snapshots_low_confidence_question_count_nonnegative check (low_confidence_question_count >= 0),
  constraint ck_help_coverage_snapshots_unanswered_question_count_nonnegative check (unanswered_question_count >= 0),
  constraint ck_help_coverage_snapshots_subtotals_lte_total check (
    targets_with_active_help <= total_targets and
    targets_missing_help <= total_targets and
    targets_with_draft_only <= total_targets
  )
);

create table if not exists help_ai_training_queue (
  help_ai_training_queue_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  source_entity_type varchar(100) not null,
  source_entity_id uuid not null,
  change_reason varchar(255) null,
  queue_status help_ai_training_queue_status_enum not null default 'queued',
  attempt_count integer not null default 0,
  queued_at timestamptz not null default now(),
  processed_at timestamptz null,
  processing_notes text null,

  constraint ck_help_ai_training_queue_source_entity_type_not_blank check (btrim(source_entity_type) <> ''),
  constraint ck_help_ai_training_queue_attempt_count_nonnegative check (attempt_count >= 0),
  constraint ck_help_ai_training_queue_processed_pairing check (
    (queue_status = 'processed' and processed_at is not null) or
    (queue_status <> 'processed')
  )
);

create table if not exists help_audit_logs (
  help_audit_log_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  event_type varchar(100) not null,
  entity_type varchar(100) not null,
  entity_id uuid not null,
  target_code varchar(200) null,
  actor_user_id uuid null,
  actor_role varchar(100) null,
  before_payload jsonb null,
  after_payload jsonb null,
  event_timestamp timestamptz not null default now(),

  constraint ck_help_audit_logs_event_type_not_blank check (btrim(event_type) <> ''),
  constraint ck_help_audit_logs_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint ck_help_audit_logs_before_payload_is_object check (
    before_payload is null or jsonb_typeof(before_payload) = 'object'
  ),
  constraint ck_help_audit_logs_after_payload_is_object check (
    after_payload is null or jsonb_typeof(after_payload) = 'object'
  )
);

-- =========================================================
-- 3. SEED RUNTIME TABLES
-- =========================================================

create table if not exists seed_runs (
  seed_run_id uuid primary key default gen_random_uuid(),
  seed_name varchar(200) not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  status varchar(50) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ck_seed_runs_seed_name_not_blank check (btrim(seed_name) <> ''),
  constraint ck_seed_runs_status_allowed check (status in ('running','completed','failed')),
  constraint ck_seed_runs_finished_after_started check (
    finished_at is null or finished_at >= started_at
  )
);

create table if not exists seed_run_steps (
  seed_run_step_id uuid primary key default gen_random_uuid(),
  seed_run_id uuid not null,
  step_name varchar(200) not null,
  table_name varchar(200) null,
  action_type varchar(50) not null,
  status varchar(50) not null,
  records_attempted integer null,
  records_written integer null,
  duration_ms integer null,
  details jsonb null,
  error_message text null,
  created_at timestamptz not null default now(),

  constraint fk_seed_run_steps_seed_run
    foreign key (seed_run_id) references seed_runs(seed_run_id)
    on update restrict on delete cascade,

  constraint ck_seed_run_steps_step_name_not_blank check (btrim(step_name) <> ''),
  constraint ck_seed_run_steps_action_type_allowed check (
    action_type in ('start','upsert','select_map','generate','validate','complete','error')
  ),
  constraint ck_seed_run_steps_status_allowed check (
    status in ('running','completed','failed')
  ),
  constraint ck_seed_run_steps_records_attempted_nonnegative check (
    records_attempted is null or records_attempted >= 0
  ),
  constraint ck_seed_run_steps_records_written_nonnegative check (
    records_written is null or records_written >= 0
  ),
  constraint ck_seed_run_steps_duration_nonnegative check (
    duration_ms is null or duration_ms >= 0
  ),
  constraint ck_seed_run_steps_details_is_object_or_array check (
    details is null or jsonb_typeof(details) in ('object','array')
  )
);

-- =========================================================
-- 4. STANDARD BTREE INDEXES
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

-- =========================================================
-- 5. PARTIAL UNIQUE INDEXES
-- =========================================================

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

-- =========================================================
-- 6. PARTIAL PERFORMANCE INDEXES
-- =========================================================

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

-- =========================================================
-- 7. GIN INDEXES FOR JSONB
-- =========================================================

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

-- =========================================================
-- 8. FULL-TEXT SEARCH INDEXES
-- =========================================================

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

-- =========================================================
-- 9. TRIGRAM INDEXES FOR FUZZY SEARCH
-- =========================================================

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

-- =========================================================
-- 10. UPDATED_AT TRIGGER
-- =========================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_help_modules_set_updated_at on help_modules;
create trigger trg_help_modules_set_updated_at
before update on help_modules
for each row
execute function set_updated_at();

drop trigger if exists trg_help_pages_set_updated_at on help_pages;
create trigger trg_help_pages_set_updated_at
before update on help_pages
for each row
execute function set_updated_at();

drop trigger if exists trg_help_sections_set_updated_at on help_sections;
create trigger trg_help_sections_set_updated_at
before update on help_sections
for each row
execute function set_updated_at();

drop trigger if exists trg_help_targets_set_updated_at on help_targets;
create trigger trg_help_targets_set_updated_at
before update on help_targets
for each row
execute function set_updated_at();

drop trigger if exists trg_help_modules_topics_set_updated_at on help_manual_topics;
create trigger trg_help_modules_topics_set_updated_at
before update on help_manual_topics
for each row
execute function set_updated_at();

drop trigger if exists trg_seed_runs_set_updated_at on seed_runs;
create trigger trg_seed_runs_set_updated_at
before update on seed_runs
for each row
execute function set_updated_at();

-- =========================================================
-- 11. OPTIONAL HELPER VIEWS
-- =========================================================

create or replace view v_help_active_primary_content as
select
  hc.*
from help_contents hc
where hc.is_active = true
  and hc.is_primary = true
  and hc.content_status = 'active';

create or replace view v_help_target_coverage as
select
  ht.help_target_id,
  ht.target_code,
  ht.target_type,
  ht.help_page_id,
  ht.help_section_id,
  ht.is_required_for_coverage,
  exists (
    select 1
    from help_contents hc
    where hc.help_target_id = ht.help_target_id
      and hc.is_active = true
      and hc.content_status = 'active'
  ) as has_active_help,
  exists (
    select 1
    from help_contents hc
    where hc.help_target_id = ht.help_target_id
      and hc.content_status = 'draft'
  ) as has_draft_help
from help_targets ht
where ht.is_active = true;

-- =========================================================
-- 12. COMMENTARY NOTES
-- =========================================================
-- Core production assumptions in this migration:
-- 1. tenant_id is nullable because the current seed/system content may be global.
-- 2. user tables are not hard-wired as foreign keys because your identity table name may vary.
-- 3. JSONB role fields allow either object or array to support both simple and advanced RBAC shapes.
-- 4. Full-text indexes are expression indexes rather than stored generated columns to keep migration simpler.
-- 5. Partial unique indexes enforce the most important runtime integrity constraints:
--    - one active primary help record per target/language
--    - one queued AI refresh item per source
--    - stable component uniqueness on active targets

-- =========================================================
-- END
-- =========================================================