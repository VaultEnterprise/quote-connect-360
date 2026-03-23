-- =========================================================
-- 001_extensions.sql
-- Phase: PREP
-- Purpose: Install required PostgreSQL extensions
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;