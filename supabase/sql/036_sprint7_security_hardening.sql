-- ==========================================================
-- neXsv | Sprint 7.1 — Hardening de funciones y métricas
-- ==========================================================
-- Objetivos:
-- 1) Reducir superficie de SECURITY DEFINER fijando search_path vacío.
-- 2) Impedir que una RPC de métricas de publicación revele métricas
--    de publicaciones ajenas.
-- 3) Mantener los grants explícitos existentes.
--
-- NOTA:
-- La función histórica de migración de negocios queda fuera de este
-- cambio porque utiliza information_schema y debe endurecerse en un
-- paso separado, manteniéndola además restringida a administradores.
-- ==========================================================

-- ----------------------------------------------------------
-- SECURITY DEFINER: search_path
-- ----------------------------------------------------------
-- Las funciones actuales usan relaciones calificadas con public.*.
-- Fijamos el search_path a vacío para evitar resolución de objetos
-- controlada por el caller.

alter function public.get_or_create_direct_conversation(uuid)
    set search_path = '';

alter function public.get_my_unread_message_count()
    set search_path = '';

alter function public.get_public_profile(uuid)
    set search_path = '';

alter function public.get_other_conversation_participant(uuid)
    set search_path = '';

alter function public.record_community_publication_view(uuid)
    set search_path = '';

alter function public.get_community_publication_metrics(uuid)
    set search_path = '';

alter function public.get_my_community_publication_metrics()
    set search_path = '';

alter function public.get_public_business_directory()
    set search_path = '';

alter function public.get_authenticated_business_detail(uuid)
    set search_path = '';

alter function public.get_public_business_detail(uuid)
    set search_path = '';

alter function public.get_public_business_presentation_media(uuid)
    set search_path = '';

alter function public.toggle_community_publication_save(uuid)
    set search_path = '';

alter function public.get_my_community_publication_save_state(uuid[])
    set search_path = '';

alter function public.record_community_publication_share(uuid)
    set search_path = '';

alter function public.get_my_community_publication_engagement_metrics()
    set search_path = '';

alter function public.get_business_results(uuid)
    set search_path = '';

alter function public.get_public_platform_stats()
    set search_path = '';

-- ----------------------------------------------------------
-- Métricas de publicaciones
-- ----------------------------------------------------------
-- Esta RPC es información de gestión del autor. Un usuario
-- autenticado no debe poder consultar las métricas de una
-- publicación ajena pasando su UUID.

create or replace function public.get_community_publication_metrics(p_publication_id uuid)
returns table (
    views bigint,
    comments bigint,
    conversations bigint
)
language sql
security definer
set search_path = ''
as $$
    select
        (select count(*)
         from public.community_publication_views v
         where v.publication_id = p_publication_id),
        (select count(*)
         from public.community_publication_comments c
         where c.publication_id = p_publication_id
           and c.status = 'PUBLICADO'),
        (select count(*)
         from public.conversations c
         where c.origin_publication_id = p_publication_id)
    where exists (
        select 1
        from public.community_publications p
        where p.id = p_publication_id
          and p.author_id = auth.uid()
    );
$$;

revoke all on function public.get_community_publication_metrics(uuid) from public;
revoke all on function public.get_community_publication_metrics(uuid) from anon;
grant execute on function public.get_community_publication_metrics(uuid) to authenticated;
