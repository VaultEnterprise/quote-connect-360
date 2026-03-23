-- =========================================================
-- 004_core_tables_targets_contents.rollback.sql
-- CAUTION: Cascades will drop all dependent child records.
-- Run 005–007 rollbacks first.
-- =========================================================

drop table if exists help_content_versions cascade;
drop table if exists help_contents cascade;
drop table if exists help_targets cascade;