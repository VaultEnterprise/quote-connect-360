-- =========================================================
-- 003_core_tables_modules_pages_sections.sql
-- Phase: CORE
-- Purpose: Create help_modules, help_pages, help_sections
-- Dependencies: 002_enums.sql
-- =========================================================

create table if not exists help_modules (
  help_module_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  module_code varchar(100) not null,
  module_name varchar(255) not null,
  module_description text null,
  route_base varchar(500) null,
  icon_name varchar(100) null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ux_help_modules_module_code unique (module_code),
  constraint ck_help_modules_module_code_not_blank check (btrim(module_code) <> ''),
  constraint ck_help_modules_module_name_not_blank check (btrim(module_name) <> ''),
  constraint ck_help_modules_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists help_pages (
  help_page_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_module_id uuid not null,
  page_code varchar(150) not null,
  page_name varchar(255) not null,
  page_label varchar(255) null,
  route_path varchar(500) not null,
  page_type help_page_type_enum not null,
  page_description text null,
  icon_name varchar(100) null,
  sort_order integer not null default 0,
  is_help_enabled boolean not null default true,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_pages_help_module
    foreign key (help_module_id) references help_modules(help_module_id)
    on update restrict on delete restrict,

  constraint ux_help_pages_page_code unique (page_code),
  constraint ck_help_pages_page_code_not_blank check (btrim(page_code) <> ''),
  constraint ck_help_pages_page_name_not_blank check (btrim(page_name) <> ''),
  constraint ck_help_pages_route_path_not_blank check (btrim(route_path) <> ''),
  constraint ck_help_pages_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists help_sections (
  help_section_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  help_page_id uuid not null,
  parent_section_id uuid null,
  section_code varchar(150) not null,
  section_name varchar(255) not null,
  section_label varchar(255) null,
  section_type help_section_type_enum not null,
  section_path varchar(1000) null,
  sort_order integer not null default 0,
  is_help_enabled boolean not null default true,
  is_active boolean not null default true,
  is_system_defined boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_help_sections_help_page
    foreign key (help_page_id) references help_pages(help_page_id)
    on update restrict on delete restrict,

  constraint fk_help_sections_parent_section
    foreign key (parent_section_id) references help_sections(help_section_id)
    on update restrict on delete restrict,

  constraint ux_help_sections_section_code unique (section_code),
  constraint ck_help_sections_section_code_not_blank check (btrim(section_code) <> ''),
  constraint ck_help_sections_section_name_not_blank check (btrim(section_name) <> ''),
  constraint ck_help_sections_sort_order_nonnegative check (sort_order >= 0),
  constraint ck_help_sections_self_parent check (
    parent_section_id is null or parent_section_id <> help_section_id
  )
);