-- ==========================================================
-- neXsv | Sprint 7.4 — Diagnóstico RLS antes de apertura pública
-- ==========================================================
-- Ejecutar en Supabase SQL Editor.
-- Este archivo NO modifica datos ni políticas.
-- Devuelve evidencia del estado real de seguridad en Supabase.
-- ==========================================================

-- 1) RLS habilitado en tablas críticas
select
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
      'profiles',
      'businesses',
      'business_requests',
      'admin_users',
      'community_publications',
      'community_publication_comments',
      'community_publication_images',
      'conversations',
      'conversation_participants',
      'messages',
      'business_media',
      'business_services'
  )
order by c.relname;

-- 2) Políticas existentes en tablas críticas
select
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
      'profiles',
      'businesses',
      'business_requests',
      'admin_users',
      'community_publications',
      'community_publication_comments',
      'community_publication_images',
      'conversations',
      'conversation_participants',
      'messages',
      'business_media',
      'business_services'
  )
order by tablename, policyname;

-- 3) Grants directos sobre tablas críticas
select
    grantee,
    table_schema,
    table_name,
    privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
      'profiles',
      'businesses',
      'business_requests',
      'admin_users',
      'community_publications',
      'community_publication_comments',
      'community_publication_images',
      'conversations',
      'conversation_participants',
      'messages',
      'business_media',
      'business_services'
  )
order by table_name, grantee, privilege_type;

-- 4) Grants sobre funciones SECURITY DEFINER relevantes
select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proconfig as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname;

-- 5) Políticas Storage críticas
select
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
