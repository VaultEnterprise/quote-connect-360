-- =========================================================
-- 006_logs_analytics_ai_queue.rollback.sql
-- =========================================================

drop table if exists help_audit_logs cascade;
drop table if exists help_ai_training_queue cascade;
drop table if exists help_coverage_snapshots cascade;
drop table if exists help_ai_question_logs cascade;
drop table if exists help_search_logs cascade;