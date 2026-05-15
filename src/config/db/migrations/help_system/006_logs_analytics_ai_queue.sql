-- =========================================================
-- 006_logs_analytics_ai_queue.sql
-- Phase: RUNTIME
-- Purpose: Create help_search_logs, help_ai_question_logs,
--          help_coverage_snapshots, help_ai_training_queue, help_audit_logs
-- Dependencies: 004_core_tables_targets_contents.sql, 005_manual_topics_and_maps.sql
-- =========================================================

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