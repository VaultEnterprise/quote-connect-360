-- =========================================================
-- 005_manual_topics_and_maps.sql
-- Phase: CORE
-- Purpose: Create help_manual_topics and help_manual_topic_target_maps
-- Dependencies: 003_core_tables_modules_pages_sections.sql, 004_core_tables_targets_contents.sql
-- =========================================================

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