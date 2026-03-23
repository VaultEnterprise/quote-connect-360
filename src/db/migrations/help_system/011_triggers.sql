-- =========================================================
-- 011_triggers.sql
-- Phase: HELPERS
-- Purpose: set_updated_at() function and updated_at triggers
-- Dependencies: 003–007 (all target tables must exist)
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