-- ==========================================================
-- neXsv | Resultados por negocio
-- Métricas agregadas del negocio activo
-- ==========================================================

create or replace function public.get_business_results(p_business_id uuid)
returns table (
    publications bigint,
    views bigint,
    comments bigint,
    conversations bigint,
    messages bigint,
    shares bigint,
    saves bigint
)
language sql
security definer
set search_path = public
as $$
    select
        (
            select count(*)
            from public.community_publications p
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        ),
        (
            select count(*)
            from public.community_publication_views v
            join public.community_publications p on p.id = v.publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        ),
        (
            select count(*)
            from public.community_publication_comments c
            join public.community_publications p on p.id = c.publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
              and c.status = 'PUBLICADO'
        ),
        (
            select count(*)
            from public.conversations c
            join public.community_publications p on p.id = c.origin_publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        ),
        (
            select count(*)
            from public.messages m
            join public.conversations c on c.id = m.conversation_id
            join public.community_publications p on p.id = c.origin_publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        ),
        (
            select count(*)
            from public.community_publication_shares s
            join public.community_publications p on p.id = s.publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        ),
        (
            select count(*)
            from public.community_publication_saves s
            join public.community_publications p on p.id = s.publication_id
            where p.business_id = p_business_id
              and p.status = 'PUBLICADA'
        )
    where exists (
        select 1
        from public.businesses b
        where b.id = p_business_id
          and b.owner_id = auth.uid()
    );
$$;

revoke all on function public.get_business_results(uuid) from public;
grant execute on function public.get_business_results(uuid) to authenticated;
