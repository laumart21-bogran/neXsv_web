-- ==========================================================
-- neXsv | Realtime de Comunidad
-- Actualiza métricas cuando entran comentarios o conversaciones.
-- ==========================================================

-- Supabase Realtime no observa automáticamente cada tabla.
-- Este bloque es idempotente: solo agrega las tablas si todavía
-- no forman parte de la publicación supabase_realtime.

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'community_publication_comments'
    ) then
        alter publication supabase_realtime
            add table public.community_publication_comments;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'conversations'
    ) then
        alter publication supabase_realtime
            add table public.conversations;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'messages'
    ) then
        alter publication supabase_realtime
            add table public.messages;
    end if;
end;
$$;
