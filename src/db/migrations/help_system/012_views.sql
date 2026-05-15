-- =========================================================
-- 012_views.sql
-- Phase: HELPERS
-- Purpose: Helper views for runtime querying
-- Dependencies: 004_core_tables_targets_contents.sql
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