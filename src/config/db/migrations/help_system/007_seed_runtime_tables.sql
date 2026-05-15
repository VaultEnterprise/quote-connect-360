-- =========================================================
-- 007_seed_runtime_tables.sql
-- Phase: RUNTIME
-- Purpose: Create seed_runs and seed_run_steps
-- Dependencies: none on help tables; must exist before seed execution
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