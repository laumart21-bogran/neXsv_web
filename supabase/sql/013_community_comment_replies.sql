-- ==========================================================
-- neXsv Platform v2
-- Comunidad — respuestas a comentarios
-- ==========================================================

alter table public.community_publication_comments
    add column if not exists parent_id uuid null
    references public.community_publication_comments(id)
    on delete cascade;

create index if not exists idx_community_comments_parent
    on public.community_publication_comments(parent_id, created_at asc);

-- Una respuesta debe apuntar a un comentario publicado de la misma publicación.
drop policy if exists "Miembros pueden comentar" on public.community_publication_comments;
create policy "Miembros pueden comentar"
    on public.community_publication_comments for insert to authenticated
    with check (
        auth.uid() = author_id
        and status = 'PUBLICADO'
        and exists (
            select 1
            from public.community_publications p
            where p.id = publication_id
              and p.status = 'PUBLICADA'
        )
        and (
            parent_id is null
            or exists (
                select 1
                from public.community_publication_comments parent
                where parent.id = parent_id
                  and parent.publication_id = publication_id
                  and parent.status = 'PUBLICADO'
                  and parent.parent_id is null
            )
        )
    );
