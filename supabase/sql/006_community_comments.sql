-- ==========================================================
-- neXsv Platform v2
-- Comunidad — comentarios públicos en publicaciones
-- ==========================================================

create table if not exists public.community_publication_comments (
    id uuid primary key default gen_random_uuid(),
    publication_id uuid not null references public.community_publications(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    body text not null check (char_length(trim(body)) between 1 and 1000),
    status text not null default 'PUBLICADO' check (status in ('PUBLICADO','ELIMINADO')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_community_comments_publication_created
    on public.community_publication_comments(publication_id, created_at desc);

create index if not exists idx_community_comments_author
    on public.community_publication_comments(author_id);

alter table public.community_publication_comments enable row level security;

drop policy if exists "Miembros pueden ver comentarios publicados" on public.community_publication_comments;
create policy "Miembros pueden ver comentarios publicados"
    on public.community_publication_comments for select to authenticated
    using (
        status = 'PUBLICADO'
        and exists (select 1 from public.community_publications p where p.id = publication_id and p.status = 'PUBLICADA')
    );

drop policy if exists "Miembros pueden comentar" on public.community_publication_comments;
create policy "Miembros pueden comentar"
    on public.community_publication_comments for insert to authenticated
    with check (
        auth.uid() = author_id
        and status = 'PUBLICADO'
        and exists (select 1 from public.community_publications p where p.id = publication_id and p.status = 'PUBLICADA')
    );

drop policy if exists "Usuarios pueden editar sus comentarios" on public.community_publication_comments;
create policy "Usuarios pueden editar sus comentarios"
    on public.community_publication_comments for update to authenticated
    using (auth.uid() = author_id)
    with check (auth.uid() = author_id);
