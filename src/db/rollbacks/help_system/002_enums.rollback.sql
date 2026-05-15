-- =========================================================
-- 002_enums.rollback.sql
-- CAUTION: Only run after all dependent tables have been dropped.
-- Run 003–007 rollbacks first.
-- =========================================================

drop type if exists help_change_type_enum;
drop type if exists help_search_channel_enum;
drop type if exists help_ai_training_queue_status_enum;
drop type if exists help_ai_answer_status_enum;
drop type if exists help_manual_topic_type_enum;
drop type if exists help_content_status_enum;
drop type if exists help_content_source_type_enum;
drop type if exists help_target_type_enum;
drop type if exists help_section_type_enum;
drop type if exists help_page_type_enum;