-- =========================================================
-- 011_triggers.rollback.sql
-- =========================================================

drop trigger if exists trg_help_modules_set_updated_at on help_modules;
drop trigger if exists trg_help_pages_set_updated_at on help_pages;
drop trigger if exists trg_help_sections_set_updated_at on help_sections;
drop trigger if exists trg_help_targets_set_updated_at on help_targets;
drop trigger if exists trg_help_modules_topics_set_updated_at on help_manual_topics;
drop trigger if exists trg_seed_runs_set_updated_at on seed_runs;

drop function if exists set_updated_at();