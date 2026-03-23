-- =========================================================
-- 003_core_tables_modules_pages_sections.rollback.sql
-- CAUTION: Cascades will drop all dependent child records.
-- Run 004–007 rollbacks first.
-- =========================================================

drop table if exists help_sections cascade;
drop table if exists help_pages cascade;
drop table if exists help_modules cascade;